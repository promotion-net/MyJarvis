//! MCP server: registers the `jarvis-core` capability catalog as tools so external
//! coding agents can read them.
//!
//! This layer exposes the capability contract (`mj_capabilities` / `mj_schema`);
//! execution tools bound to an app session are added once a host runtime session is
//! wired in. `handle_request` is a pure function and deterministically testable.

use jarvis_core::{CONTRACT_VERSION, capability_catalog};
use serde_json::{Value, json};

pub const PROTOCOL_VERSION: &str = "2024-11-05";

fn tool_name(capability_id: &str) -> String {
    capability_id.replace(':', "_")
}

/// MCP `tools/list` tool definitions.
pub fn tool_definitions() -> Vec<Value> {
    let mut tools: Vec<Value> = vec![json!({
        "name": "mj_capabilities",
        "description": format!("List the MyJarvis {CONTRACT_VERSION} capability catalog"),
        "inputSchema": { "type": "object", "properties": {}, "additionalProperties": false }
    })];
    for capability in capability_catalog() {
        tools.push(json!({
            "name": tool_name(&capability.id),
            "description": capability.summary,
            "inputSchema": capability.input_schema,
        }));
    }
    tools
}

/// Handles one JSON-RPC request; notifications (no response required) return None.
pub fn handle_request(request: &Value) -> Option<Value> {
    let method = request.get("method")?.as_str()?;
    if method.starts_with("notifications/") {
        return None;
    }
    let id = request.get("id")?.clone();
    let result: Result<Value, (i64, String)> = match method {
        "initialize" => Ok(json!({
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": { "tools": {} },
            "serverInfo": {
                "name": "my-jarvis",
                "version": env!("CARGO_PKG_VERSION"),
                "contract": CONTRACT_VERSION,
            },
        })),
        "tools/list" => Ok(json!({ "tools": tool_definitions() })),
        "tools/call" => {
            let params = request.get("params").cloned().unwrap_or(Value::Null);
            call_tool(&params)
        }
        other => Err((-32601, format!("method not found: {other}"))),
    };
    Some(match result {
        Ok(value) => json!({ "jsonrpc": "2.0", "id": id, "result": value }),
        Err((code, message)) => {
            json!({ "jsonrpc": "2.0", "id": id, "error": { "code": code, "message": message } })
        }
    })
}

fn call_tool(params: &Value) -> Result<Value, (i64, String)> {
    let name =
        params.get("name").and_then(Value::as_str).ok_or((-32602, "missing tool name".into()))?;
    let payload = if name == "mj_capabilities" {
        serde_json::to_string_pretty(&capability_catalog())
            .map_err(|err| (-32603, err.to_string()))?
    } else {
        let capability = capability_catalog()
            .into_iter()
            .find(|c| c.id.replace(':', "_") == *name)
            .ok_or((-32602, format!("unknown tool: {name}")))?;
        serde_json::to_string_pretty(&capability).map_err(|err| (-32603, err.to_string()))?
    };
    Ok(json!({ "content": [{ "type": "text", "text": payload }], "isError": false }))
}
