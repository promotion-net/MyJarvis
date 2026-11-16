//! 子进程沙箱执行器（第一阶段为 Node sidecar，V8 在 Node 内）。
//!
//! 沙箱内只注入 `mj.*` 桩（`prelude/mj-prelude.mjs`），用户代码的每次能力调用
//! 序列化为 stdio JSON-RPC 行，转发给宿主 `Dispatcher`（由 `jarvis-runtime` 实现）。
//! 执行器持有子进程生命周期：超时即 kill，崩溃不波及宿主。后续可按平台替换为
//! V8 isolate 或 OS 级资源限制子进程，`Dispatcher` 接口不变。

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

/// 能力调用分发者：runtime 侧的真实实现。
#[async_trait]
pub trait Dispatcher: Send + Sync {
    /// 处理一次 `mj.<ns>.<method>` 调用；返回 Err 时错误消息透传给沙箱内的 Promise reject。
    async fn dispatch(&self, app_id: &str, method: &str, params: Value) -> Result<Value, String>;
}

#[derive(Debug, Clone)]
pub struct SandboxOptions {
    /// 受管应用 id，经环境变量注入沙箱。
    pub app_id: String,
    /// node 可执行文件；缺省用 PATH 上的 `node`。
    pub node_binary: Option<PathBuf>,
    /// 整个脚本执行的超时；超时即 kill 子进程。
    pub timeout: Duration,
    /// 宿主模块注册表覆盖（测试用）；缺省由 `default_host_registry()` 从能力目录派生。
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

/// 在沙箱子进程中执行 `code`（ESM，作者面为 `jarvis:*` 宿主模块），
/// 所有能力调用经 `dispatcher` 中介。
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

    // stderr 收集为失败报告文本，不阻塞子进程。
    let stderr_task = tokio::spawn(async move {
        let mut buf = String::new();
        let mut lines = stderr.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            buf.push_str(&line);
            buf.push('\n');
        }
        buf
    });

    // stdout 行协议：JSON-RPC 请求交给 dispatcher，非 JSON 行视为用户日志丢弃。
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

/// 最小 file URL 转换（Windows 反斜杠归一；temp 路径为 ASCII）。
fn file_url(path: &std::path::Path) -> String {
    let joined = path.to_string_lossy().replace('\\', "/");
    format!("file:///{joined}")
}
