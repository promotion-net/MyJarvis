//! 宿主模块注册表：从 `jarvis-core` 能力目录派生，单一真相源。
//! capability id `db:query` → specifier `jarvis:db` 的具名导出 `query`，
//! wire 方法 `mj.db.query`；目录里没有的 specifier 一律拒绝。

use std::collections::BTreeMap;

use serde_json::{Value, json};

use jarvis_core::Capability;

/// 默认注册表：当前 `/v0` 能力目录的模块视图。
pub fn default_host_registry() -> Value {
    host_registry_from(&jarvis_core::capability_catalog())
}

pub fn host_registry_from(catalog: &[Capability]) -> Value {
    let mut domains: BTreeMap<String, Vec<Value>> = BTreeMap::new();
    for capability in catalog {
        let Some((ns, method_name)) = capability.id.split_once(':') else { continue };
        domains
            .entry(ns.to_owned())
            .or_default()
            .push(json!({ "name": method_name, "method": format!("mj.{ns}.{method_name}") }));
    }
    let mut modules: Vec<Value> = domains
        .into_iter()
        .map(|(ns, exports)| {
            json!({ "specifier": format!("jarvis:{ns}"), "kind": "domain", "exports": exports })
        })
        .collect();
    modules.push(json!({ "specifier": "jarvis", "kind": "aggregate", "exports": [] }));
    modules.push(json!({ "specifier": "jarvis:global", "kind": "global", "exports": [] }));
    json!({ "modules": modules })
}
