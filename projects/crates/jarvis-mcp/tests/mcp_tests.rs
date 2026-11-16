use jarvis_mcp::{PROTOCOL_VERSION, handle_request, tool_definitions};
use serde_json::json;

#[test]
fn initialize_announces_contract_version() {
    let response = handle_request(&json!({
        "jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}
    }))
    .expect("response");
    assert_eq!(response["result"]["protocolVersion"], PROTOCOL_VERSION);
    assert_eq!(response["result"]["serverInfo"]["contract"], "/v0");
}

#[test]
fn tools_list_covers_capability_catalog() {
    let response = handle_request(&json!({
        "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}
    }))
    .unwrap();
    let tools = response["result"]["tools"].as_array().unwrap();
    assert!(tools.iter().any(|t| t["name"] == "db_query"));
    assert!(tools.iter().any(|t| t["name"] == "sms_send"));
    assert_eq!(tools.len(), tool_definitions().len());
}

#[test]
fn tool_call_returns_capability_schema() {
    let response = handle_request(&json!({
        "jsonrpc": "2.0", "id": 3, "method": "tools/call",
        "params": { "name": "db_query", "arguments": {} }
    }))
    .unwrap();
    let text = response["result"]["content"][0]["text"].as_str().unwrap();
    assert!(text.contains("db:query"));
    assert_eq!(response["result"]["isError"], json!(false));
}

#[test]
fn notifications_get_no_response_and_unknown_method_errors() {
    assert!(
        handle_request(&json!({ "jsonrpc": "2.0", "method": "notifications/initialized" })).is_none()
    );
    let response =
        handle_request(&json!({ "jsonrpc": "2.0", "id": 9, "method": "resources/list" })).unwrap();
    assert_eq!(response["error"]["code"], -32601);
}
