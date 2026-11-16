//! Subprocess sandbox executor (a Node sidecar in the current stage; V8 lives inside Node).
//!
//! The sandbox injects only `mj.*` stubs (`prelude/mj-prelude.mjs`); every capability call from
//! user code is serialized as a stdio JSON-RPC line and forwarded to the host `Dispatcher`
//! (implemented by the embedding runtime). The executor owns the child process lifecycle: a
//! timeout kills the run, a crash never reaches the host. The implementation can be swapped per
//! platform (V8 isolate, OS-level resource-limited subprocess) without changing `Dispatcher`.

pub mod ipc;
pub mod registry;

use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{ChildStdin, Command};

use ipc::{Request, Response};
pub use registry::{default_host_registry, host_registry_from};

const PRELUDE: &str = include_str!("../prelude/mj-prelude.mjs");
const LOADER: &str = include_str!("../prelude/loader.mjs");

/// Capability call dispatcher: implemented by the embedding runtime.
#[async_trait]
pub trait Dispatcher: Send + Sync {
    /// Handles one `mj.<ns>.<method>` call; an `Err` message surfaces as a rejected Promise inside the sandbox.
    async fn dispatch(&self, app_id: &str, method: &str, params: Value) -> Result<Value, String>;
}

#[derive(Debug, Clone)]
pub struct SandboxOptions {
    /// Managed app id, injected into the sandbox through an environment variable.
    pub app_id: String,
    /// Node executable; falls back to `node` on PATH.
    pub node_binary: Option<PathBuf>,
    /// Whole-script execution timeout; the child is killed on expiry.
    pub timeout: Duration,
    /// Host module registry override (for tests); defaults to `default_host_registry()` derived from the capability catalog.
    pub host_registry: Option<Value>,
}

impl SandboxOptions {
    pub fn new(app_id: impl Into<String>) -> Self {
        Self {
            app_id: app_id.into(),
            node_binary: None,
            timeout: Duration::from_secs(30),
            host_registry: None,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SandboxError {
    #[error("failed to spawn sandbox: {0}")]
    Spawn(std::io::Error),
    #[error("sandbox timed out after {0:?} and was killed")]
    Timeout(Duration),
    #[error("sandbox exited with {status}:\n{stderr}")]
    Failed { status: String, stderr: String },
    #[error("sandbox io error: {0}")]
    Io(#[from] std::io::Error),
}

/// Runs `code` (ESM, authoring surface `jarvis:*` host modules) in a sandboxed child
/// process; every capability call goes through `dispatcher`.
pub async fn run(
    code: &str,
    dispatcher: Arc<dyn Dispatcher>,
    opts: SandboxOptions,
) -> Result<(), SandboxError> {
    let workdir = tempfile::tempdir().map_err(SandboxError::Spawn)?;
    let prelude_path = workdir.path().join("mj-prelude.mjs");
    let loader_path = workdir.path().join("loader.mjs");
    let user_path = workdir.path().join("user.mjs");
    let entry_path = workdir.path().join("entry.mjs");
    std::fs::write(&prelude_path, PRELUDE)?;
    std::fs::write(&loader_path, LOADER)?;
    std::fs::write(&user_path, code)?;

    let registry = opts.host_registry.clone().unwrap_or_else(default_host_registry);
    let modules = registry.get("modules").cloned().unwrap_or_else(|| Value::Array(vec![]));
    let prelude_url = file_url(&prelude_path);
    let loader_data = serde_json::json!({ "prelude": prelude_url, "modules": modules });
    std::fs::write(
        &entry_path,
        format!(
            "import {{ register }} from \"node:module\";\nimport {{ finish }} from \"./mj-prelude.mjs\";\n\
             register(\"./loader.mjs\", import.meta.url, {{ data: {loader_data} }});\n\
             await import(\"./user.mjs\");\nfinish();\n"
        ),
    )?;

    let node = opts.node_binary.clone().unwrap_or_else(|| PathBuf::from("node"));
    let mut child = Command::new(node)
        .arg(&entry_path)
        .current_dir(workdir.path())
        .env("MJ_APP_ID", &opts.app_id)
        .env("MJ_HOST_REGISTRY", modules.to_string())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(SandboxError::Spawn)?;

    let stdout = BufReader::new(child.stdout.take().expect("stdout piped"));
    let stderr = BufReader::new(child.stderr.take().expect("stderr piped"));
    let mut stdin = child.stdin.take().expect("stdin piped");

    // Collect stderr for the failure report without blocking the child.
    let stderr_task = tokio::spawn(async move {
        let mut buf = String::new();
        let mut lines = stderr.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            buf.push_str(&line);
            buf.push('\n');
        }
        buf
    });

    // stdout line protocol: JSON-RPC requests go to the dispatcher; non-JSON lines are user logs and dropped.
    let dispatch_task = {
        let app_id = opts.app_id.clone();
        tokio::spawn(async move {
            let mut lines = stdout.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let Ok(req) = serde_json::from_str::<Request>(&line) else { continue };
                let result = dispatcher.dispatch(&app_id, &req.method, req.params).await;
                let response = match result {
                    Ok(value) => Response::ok(req.id, value),
                    Err(message) => Response::err(req.id, message),
                };
                let payload = format!("{}\n", serde_json::to_string(&response).expect("response"));
                if write_line(&mut stdin, &payload).await.is_err() {
                    break;
                }
            }
        })
    };

    let outcome = tokio::time::timeout(opts.timeout, child.wait()).await;
    dispatch_task.abort();

    let status = match outcome {
        Ok(Ok(status)) => status,
        Ok(Err(err)) => return Err(SandboxError::Io(err)),
        Err(_) => {
            let _ = child.kill().await;
            let _ = child.wait().await;
            return Err(SandboxError::Timeout(opts.timeout));
        }
    };

    let stderr_text = stderr_task.await.unwrap_or_default();
    if !status.success() {
        return Err(SandboxError::Failed { status: status.to_string(), stderr: stderr_text });
    }
    Ok(())
}

async fn write_line(stdin: &mut ChildStdin, payload: &str) -> Result<(), std::io::Error> {
    stdin.write_all(payload.as_bytes()).await?;
    stdin.flush().await
}

/// Minimal file URL conversion (normalizes Windows backslashes; temp paths are ASCII).
fn file_url(path: &std::path::Path) -> String {
    let joined = path.to_string_lossy().replace('\\', "/");
    format!("file:///{joined}")
}
