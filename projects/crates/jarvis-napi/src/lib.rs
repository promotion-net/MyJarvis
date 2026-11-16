//! napi-rs bindings: the orthogonal export surface of the open interface
//! capabilities (the only native egress).
//!
//! Grouped by domain: `core` (contract version and capability catalog), `mcp`
//! (protocol version, tool definitions and the pure JSON-RPC handler),
//! `sandbox` (host module registry). The CLI ships no native binary — the
//! `my-jarvis` npm package assembles these exports with `@vmz/commander`.
//! Sandbox execution and metering writes are out of scope: they belong to the
//! host runtime and its billing layer.

use napi::bindgen_prelude::Error;
use napi_derive::napi;
use serde::Serialize;

fn to_json<T: Serialize>(value: &T) -> Result<String, Error> {
    serde_json::to_string(value).map_err(|err| Error::from_reason(err.to_string()))
}

// ---- core ----

#[napi]
pub fn contract_version() -> String {
    jarvis_core::CONTRACT_VERSION.to_string()
}

/// Capability catalog JSON (the data behind `mj capabilities`).
#[napi]
pub fn capability_catalog_json() -> Result<String, Error> {
    to_json(&jarvis_core::capability_catalog())
}

// ---- mcp ----

#[napi]
pub fn mcp_protocol_version() -> String {
    jarvis_mcp::PROTOCOL_VERSION.to_string()
}

/// MCP `tools/list` definitions JSON (the data behind `mj schema --mcp`).
#[napi]
pub fn mcp_tool_definitions_json() -> Result<String, Error> {
    to_json(&jarvis_mcp::tool_definitions())
}

/// Handles one JSON-RPC request string; notifications (no response required) return null.
#[napi]
pub fn mcp_handle_request(request_json: String) -> Result<Option<String>, Error> {
    let request: serde_json::Value =
        serde_json::from_str(&request_json).map_err(|err| Error::from_reason(err.to_string()))?;
    jarvis_mcp::handle_request(&request).map(|response| to_json(&response)).transpose()
}

// ---- sandbox ----

/// Host module registry JSON (the `jarvis:*` whitelist, same source as the sandbox loader).
#[napi]
pub fn sandbox_host_registry_json() -> Result<String, Error> {
    to_json(&jarvis_sandbox::default_host_registry())
}
