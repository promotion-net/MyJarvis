//! napi-rs 绑定：只把 `jarvis-core` 的只读/编排能力暴露给 Node 侧。
//! 不承载沙箱执行，也不承载计量写入——那些留在 runtime 与 billing。

use napi::bindgen_prelude::Error;
use napi_derive::napi;

#[napi]
pub fn contract_version() -> String {
    jarvis_core::CONTRACT_VERSION.to_string()
}

/// 能力目录 JSON（与 `mj capabilities` 同源）。
#[napi]
pub fn capability_catalog_json() -> Result<String, Error> {
    serde_json::to_string(&jarvis_core::capability_catalog())
        .map_err(|err| Error::from_reason(err.to_string()))
}
