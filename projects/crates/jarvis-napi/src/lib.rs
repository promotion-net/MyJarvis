//! napi-rs 绑定：开源接口能力的正交导出面（唯一 native 出口）。
//!
//! 按领域分组：`core`（合同版本与能力目录）、`mcp`（协议版本、tool 定义与
//! JSON-RPC 纯函数处理）、`sandbox`（宿主模块注册表）。CLI 不带 native 二进制，
//! 由 npm 包用 `@vmz/commander` 直接组装这些导出。
//! 不承载沙箱执行，也不承载计量写入——那些留在闭源 runtime 与 billing。

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

/// 能力目录 JSON（`mj capabilities` 的数据源）。
#[napi]
pub fn capability_catalog_json() -> Result<String, Error> {
    to_json(&jarvis_core::capability_catalog())
}

// ---- mcp ----

#[napi]
pub fn mcp_protocol_version() -> String {
    jarvis_mcp::PROTOCOL_VERSION.to_string()
}

/// MCP `tools/list` 的 tool 定义 JSON（`mj schema --mcp` 的数据源）。
#[napi]
pub fn mcp_tool_definitions_json() -> Result<String, Error> {
    to_json(&jarvis_mcp::tool_definitions())
}

/// 处理一条 JSON-RPC 请求字符串；notification（无需应答）返回 null。
#[napi]
pub fn mcp_handle_request(request_json: String) -> Result<Option<String>, Error> {
    let request: serde_json::Value =
        serde_json::from_str(&request_json).map_err(|err| Error::from_reason(err.to_string()))?;
    jarvis_mcp::handle_request(&request).map(|response| to_json(&response)).transpose()
}

// ---- sandbox ----

/// 宿主模块注册表 JSON（`jarvis:*` 白名单，与沙箱 loader 同源）。
#[napi]
pub fn sandbox_host_registry_json() -> Result<String, Error> {
    to_json(&jarvis_sandbox::default_host_registry())
}