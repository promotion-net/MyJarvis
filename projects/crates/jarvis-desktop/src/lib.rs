//! Desktop shell (open source): window mount, static surface loading and the
//! `mj_dispatch` bridge. Capability calls are forwarded over loopback HTTP to a
//! local runtime process (`POST {base}/v0/dispatch`, contract `/v0`); the shell
//! links no runtime implementation itself. The runtime address comes from
//! `MJ_RUNTIME_URL` and defaults to `http://127.0.0.1:8080`.

use serde_json::{json, Value};
use tauri::State;

struct Gateway {
    client: reqwest::Client,
    base: String,
}

impl Gateway {
    fn from_env() -> Self {
        let base =
            std::env::var("MJ_RUNTIME_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_owned());
        Self { client: reqwest::Client::new(), base: base.trim_end_matches('/').to_owned() }
    }
}

/// Forward one `mj.<ns>.<method>` call to the loopback runtime gateway.
/// The `appId` is the shell-side session identity owned by the front end.
#[tauri::command]
async fn mj_dispatch(
    gateway: State<'_, Gateway>,
    app_id: String,
    method: String,
    params: Value,
) -> Result<Value, String> {
    let response = gateway
        .client
        .post(format!("{}/v0/dispatch", gateway.base))
        .json(&json!({ "appId": app_id, "method": method, "params": params }))
        .send()
        .await
        .map_err(|err| format!("runtime unreachable at {}: {err}", gateway.base))?;
    let status = response.status();
    let body: Value =
        response.json().await.map_err(|err| format!("invalid runtime response: {err}"))?;
    if status.is_success() {
        return Ok(body["result"].clone());
    }
    Err(body["error"]["message"].as_str().unwrap_or("runtime error").to_owned())
}

pub fn run() {
    let app = tauri::Builder::default()
        .manage(Gateway::from_env())
        .invoke_handler(tauri::generate_handler![mj_dispatch])
        .build(tauri::generate_context!())
        .expect("error while building the MyJarvis desktop shell");
    app.run(|handle, event| {
        // The window and the WebView2 child can disagree on pixel vs logical units on
        // scaled displays, which makes the page wider than the window. Once the app is
        // ready, size the window from the logical design size and the real scale factor.
        if let tauri::RunEvent::Ready = event {
            let handle = handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(1500));
                if let Some(window) = tauri::Manager::get_webview_window(&handle, "main") {
                    // WebView2 can lay the page out wider than the window on scaled
                    // displays. Scale the document down only when that happens.
                    let _ = window.eval(
                        "try{const r=window.outerWidth/window.innerWidth;\
                         if(r>0&&r<1){document.documentElement.style.zoom=String(r);}}catch(e){}",
                    );
                }
            });
        }
    });
}
