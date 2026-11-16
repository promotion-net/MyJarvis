//! Host module registry: derived from the `jarvis-core` capability catalog — the single source of truth.
//! Capability id `db:query` → specifier `jarvis:db` named export `query`, wire method `mj.db.query`;
//! any specifier absent from the catalog is rejected.

use std::collections::BTreeMap;

use serde_json::{Value, json};

use jarvis_core::Capability;

/// Default registry: the module view of the current `/v0` capability catalog.
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
