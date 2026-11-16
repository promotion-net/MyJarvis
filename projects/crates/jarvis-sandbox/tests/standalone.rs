//! 开源仓独立验收：沙箱不依赖闭源 runtime，用 mock `Dispatcher` 跑通
//! `jarvis:*` 宿主模块的请求/应答、错误透传、聚合与全局注入、白名单拒绝与超时 kill。

use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use serde_json::{Value, json};

use jarvis_sandbox::{Dispatcher, SandboxError, SandboxOptions, run};

struct MockDispatcher;

#[async_trait]
impl Dispatcher for MockDispatcher {
    async fn dispatch(&self, app_id: &str, method: &str, params: Value) -> Result<Value, String> {
        match method {
            "mj.echo.pong" => Ok(json!({ "app": app_id, "params": params, "pong": true })),
            "mj.boom.fail" => Err("boom".into()),
            other => Err(format!("unknown method {other}")),
        }
    }
}

fn test_registry() -> Value {
    json!({ "modules": [
        { "specifier": "jarvis:echo", "kind": "domain", "exports": [
            { "name": "pong", "method": "mj.echo.pong" },
            { "name": "fail", "method": "mj.boom.fail" },
        ] },
        { "specifier": "jarvis", "kind": "aggregate", "exports": [] },
        { "specifier": "jarvis:global", "kind": "global", "exports": [] },
    ] })
}

fn options(app_id: &str) -> SandboxOptions {
    let mut opts = SandboxOptions::new(app_id);
    opts.host_registry = Some(test_registry());
    opts
}

async fn exec(code: &str) -> Result<(), SandboxError> {
    run(code, Arc::new(MockDispatcher), options("solo")).await
}

#[tokio::test]
async fn domain_module_round_trip() {
    let code = r#"
        import { pong } from "jarvis:echo";
        const r = await pong({ n: 1 });
        if (!r.pong || r.app !== "solo" || r.params.n !== 1) {
            throw new Error("bad response: " + JSON.stringify(r));
        }
    "#;
    exec(code).await.unwrap();
}

#[tokio::test]
async fn dispatcher_errors_reject_the_call_promise() {
    let code = r#"
        import { fail } from "jarvis:echo";
        let caught = null;
        try {
            await fail({});
        } catch (err) {
            caught = String(err.message);
        }
        if (!caught || !caught.includes("boom")) {
            throw new Error("expected rejection containing boom, got: " + caught);
        }
    "#;
    exec(code).await.unwrap();
}

#[tokio::test]
async fn aggregate_mj_is_a_frozen_view_of_the_registry() {
    let code = r#"
        import { mj } from "jarvis";
        const r = await mj.echo.pong({ via: "aggregate" });
        if (!r.pong) throw new Error("aggregate call failed");
        // 冻结：写入被拒，且不能引入注册表之外的能力
        let rejected = false;
        try {
            mj.echo.hacked = () => {};
        } catch {
            rejected = true;
        }
        if (!rejected) throw new Error("aggregate mj must be frozen");
        if (mj.notinregistry !== undefined) throw new Error("aggregate must match registry");
    "#;
    exec(code).await.unwrap();
}

#[tokio::test]
async fn global_injection_is_explicit_and_frozen() {
    let code = r#"
        if (typeof globalThis.mj !== "undefined") {
            throw new Error("global mj must not be injected by default");
        }
        await import("jarvis:global");
        const r = await mj.echo.pong({ via: "global" });
        if (!r.pong) throw new Error("global call failed");
        let rejected = false;
        try {
            globalThis.mj = 1;
        } catch {
            rejected = true;
        }
        if (!rejected) throw new Error("injected global mj must be non-writable");
    "#;
    exec(code).await.unwrap();
}

#[tokio::test]
async fn unregistered_specifiers_are_rejected() {
    for source in [
        r#"import "jarvis:bogus";"#,
        r#"import "node:fs";"#,
        r#"import "fs";"#,
        r#"import "some-npm-package";"#,
    ] {
        let err = exec(source).await.unwrap_err();
        match err {
            SandboxError::Failed { stderr, .. } => {
                assert!(stderr.contains("ERR_UNKNOWN_HOST_MODULE"), "stderr: {stderr}");
            }
            other => panic!("expected Failed for {source:?}, got {other:?}"),
        }
    }
}

#[tokio::test]
async fn timeout_kills_the_sidecar() {
    let code = "await new Promise(() => {});";
    let mut opts = options("solo");
    opts.timeout = Duration::from_millis(500);
    let err = run(code, Arc::new(MockDispatcher), opts).await.unwrap_err();
    assert!(matches!(err, SandboxError::Timeout(_)), "expected Timeout, got {err:?}");
}
