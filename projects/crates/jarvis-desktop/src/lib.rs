//! WAE desktop shell: opens the built VMZ surface in a native WebView and
//! forwards `mj.*` requests to the loopback runtime gateway.
//!
//! The shell is a normal WAE application, so `wae-harness` can drive it through
//! the standard control channel (`WAE_HARNESS_PORT` / `WAE_HARNESS_TOKEN`).
//! Capability calls still go over loopback HTTP to the runtime (`POST /v0/dispatch`);
//! this crate links no runtime implementation.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde_json::{json, Value};
use wae::harness::{self, PlatformHarness};
use wae::webview::{DragRect, IpcHandler, IpcOutcome, IpcSink, OpenOptions};

/// Latest drag-region list queued by the page; the window thread applies it.
type DragQueue = Arc<Mutex<Option<Vec<DragRect>>>>;

const WINDOW_TITLE: &str = "MyJarvis";
const WINDOW_WIDTH: i32 = 1240;
const WINDOW_HEIGHT: i32 = 780;

/// Window operations queued by the IPC worker and applied on the window thread.
#[derive(Debug, Clone, Copy)]
enum WindowCommand {
    Minimize,
    ToggleMaximize,
}

type WindowQueue = Arc<Mutex<Vec<WindowCommand>>>;

/// Loopback runtime gateway used by the page bridge.
struct Gateway {
    client: reqwest::blocking::Client,
    base: String,
}

impl Gateway {
    fn from_env() -> Self {
        let base = std::env::var("MJ_RUNTIME_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_owned());
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .expect("desktop shell: build HTTP client");
        Self { client, base: base.trim_end_matches('/').to_owned() }
    }

    /// One `mj.*` call through the runtime dispatch entry.
    fn dispatch(&self, app_id: &str, method: &str, params: Value) -> Result<Value, String> {
        let response = self
            .client
            .post(format!("{}/v0/dispatch", self.base))
            .json(&json!({ "appId": app_id, "method": method, "params": params }))
            .send()
            .map_err(|error| format!("runtime unreachable at {}: {error}", self.base))?;
        let status = response.status();
        let body: Value = response.json().map_err(|error| format!("invalid runtime response: {error}"))?;
        if status.is_success() {
            Ok(body["result"].clone())
        }
        else {
            Err(body["error"]["message"].as_str().unwrap_or("runtime error").to_owned())
        }
    }

    /// Loopback probe; an unreachable runtime is a reported state, not a failure.
    fn health(&self) -> Value {
        match self.client.get(format!("{}/healthz", self.base)).send() {
            Ok(response) => json!({
                "ok": response.status().is_success(),
                "status": response.status().as_u16(),
                "base": self.base,
                "detail": response.text().unwrap_or_default(),
            }),
            Err(error) => json!({
                "ok": false,
                "status": 0,
                "base": self.base,
                "detail": error.to_string(),
            }),
        }
    }
}

/// Page bridge: JSON in, JSON out. Replies carry the request `id` so the page can
/// resolve concurrent calls without a FIFO assumption.
struct ShellIpc {
    gateway: Gateway,
    window: WindowQueue,
    regions: DragQueue,
}

impl IpcHandler for ShellIpc {
    fn on_ipc(&mut self, message: &str, _sink: &IpcSink) -> IpcOutcome {
        let Ok(request) = serde_json::from_str::<Value>(message)
        else {
            return IpcOutcome::ReplyToPage(reply_error(0, "invalid json"));
        };
        let id = request.get("id").and_then(Value::as_u64).unwrap_or(0);
        match request.get("type").and_then(Value::as_str).unwrap_or_default() {
            "dispatch" => {
                let app_id = request.get("appId").and_then(Value::as_str).unwrap_or_default();
                let method = request.get("method").and_then(Value::as_str).unwrap_or_default();
                let params = request.get("params").cloned().unwrap_or(Value::Null);
                if app_id.is_empty() || method.is_empty() {
                    return IpcOutcome::ReplyToPage(reply_error(id, "dispatch needs `appId` and `method`"));
                }
                match self.gateway.dispatch(app_id, method, params) {
                    Ok(result) => IpcOutcome::ReplyToPage(reply(id, json!({ "ok": true, "result": result }))),
                    Err(error) => IpcOutcome::ReplyToPage(reply_error(id, &error)),
                }
            }
            "health" => IpcOutcome::ReplyToPage(reply(id, json!({ "ok": true, "data": self.gateway.health() }))),
            "window.minimize" => {
                self.window.lock().expect("window queue").push(WindowCommand::Minimize);
                IpcOutcome::ReplyToPage(reply(id, json!({ "ok": true, "result": true })))
            }
            "window.toggleMaximize" => {
                self.window.lock().expect("window queue").push(WindowCommand::ToggleMaximize);
                IpcOutcome::ReplyToPage(reply(id, json!({ "ok": true, "result": true })))
            }
            "window.dragRegions" => {
                let rects = request.get("rects").and_then(Value::as_array).cloned().unwrap_or_default();
                let parsed: Vec<DragRect> = rects
                    .iter()
                    .filter_map(|rect| {
                        Some(DragRect {
                            x: rect.get("x")?.as_i64()? as i32,
                            y: rect.get("y")?.as_i64()? as i32,
                            width: rect.get("width")?.as_i64()? as i32,
                            height: rect.get("height")?.as_i64()? as i32,
                        })
                    })
                    .collect();
                *self.regions.lock().expect("drag queue") = Some(parsed);
                IpcOutcome::ReplyToPage(reply(id, json!({ "ok": true, "result": true })))
            }
            "window.close" => IpcOutcome::CloseWindow,
            other => IpcOutcome::ReplyToPage(reply_error(id, &format!("unknown message type `{other}`"))),
        }
    }
}

fn reply(id: u64, mut body: Value) -> String {
    if let Some(object) = body.as_object_mut() {
        object.insert("id".to_owned(), json!(id));
    }
    serde_json::to_string(&body).unwrap_or_else(|_| reply_error(id, "serialization failed"))
}

fn reply_error(id: u64, message: &str) -> String {
    serde_json::to_string(&json!({ "id": id, "ok": false, "error": message }))
        .unwrap_or_else(|_| format!(r#"{{"id":{id},"ok":false,"error":"serialization failed"}}"#))
}

/// Built VMZ surface: `MJ_UI_DIR`, the repo checkout, or a `ui/` folder next to the binary.
fn resolve_content_dir() -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(dir) = std::env::var("MJ_UI_DIR") {
        candidates.push(PathBuf::from(dir));
    }
    candidates.push(PathBuf::from("projects/packages/my-jarvis-desktop-ui/dist/app"));
    if let Ok(exe) = std::env::current_exe()
        && let Some(dir) = exe.parent()
    {
        candidates.push(dir.join("ui"));
        // `cargo run` lands in `target/<profile>/`; release bundles sit one level deeper.
        candidates.push(dir.join("../../projects/packages/my-jarvis-desktop-ui/dist/app"));
        candidates.push(dir.join("../../../projects/packages/my-jarvis-desktop-ui/dist/app"));
    }
    for candidate in &candidates {
        if candidate.join("index.html").is_file() {
            return Ok(candidate.clone());
        }
    }
    Err(format!(
        "desktop UI not found; set MJ_UI_DIR or run `pnpm --filter @my-jarvis/desktop build:desktop` (tried: {})",
        candidates.iter().map(|path| path.display().to_string()).collect::<Vec<_>>().join(", ")
    ))
}

fn drain_window_commands(host: &mut PlatformHarness, queue: &WindowQueue) {
    let commands: Vec<WindowCommand> = {
        let mut queue = queue.lock().expect("window queue");
        queue.drain(..).collect()
    };
    for command in commands {
        let result = match command {
            WindowCommand::Minimize => host.host_mut().minimize(),
            WindowCommand::ToggleMaximize => host.host_mut().toggle_maximize(),
        };
        if let Err(error) = result {
            eprintln!("desktop shell: window command failed: {error}");
        }
    }
}

/// Start the desktop shell and run its event loop until the window closes.
pub fn run() {
    if let Err(error) = run_inner() {
        eprintln!("desktop shell: {error}");
        std::process::exit(1);
    }
}

fn drain_drag_regions(host: &mut PlatformHarness, queue: &DragQueue) {
    let latest = queue.lock().expect("drag queue").take();
    if let Some(rects) = latest
        && let Err(error) = host.host_mut().set_drag_regions(&rects)
    {
        eprintln!("desktop shell: drag regions failed: {error}");
    }
}

fn run_inner() -> Result<(), Box<dyn std::error::Error>> {
    let content_dir = resolve_content_dir()?;
    let window: WindowQueue = Arc::new(Mutex::new(Vec::new()));
    let regions: DragQueue = Arc::new(Mutex::new(None));
    let handler = ShellIpc { gateway: Gateway::from_env(), window: Arc::clone(&window), regions: Arc::clone(&regions) };
    let mut options = OpenOptions::from_content_dir(content_dir.display().to_string(), WINDOW_TITLE);
    options.width = WINDOW_WIDTH;
    options.height = WINDOW_HEIGHT;
    // The page draws its own title bar; the native caption would only duplicate it.
    options.decorations = false;
    // Harness runs stay off the desktop unless explicitly asked to show.
    options.hidden = std::env::var("WAE_HARNESS_HIDDEN").is_ok_and(|value| value == "1");
    let mut host = PlatformHarness::open(options, Box::new(handler))?;

    // Harness mode: serve one control session, then exit. `serve_from_env` keeps
    // pumping while it waits for the client, so the first frame is not delayed.
    if std::env::var("WAE_HARNESS_PORT").is_ok() {
        harness::serve_from_env(&mut host)?;
        return Ok(());
    }

    while host.host_mut().pump() {
        drain_window_commands(&mut host, &window);
        drain_drag_regions(&mut host, &regions);
        std::thread::sleep(Duration::from_millis(2));
    }
    Ok(())
}
