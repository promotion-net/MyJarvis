//! Capability catalog: the single source of truth for the `mj.*` surface,
//! consumed by MCP tool export, out-of-band verification and `@my-jarvis/types`
//! generation.

use serde::{Deserialize, Serialize};
use serde_json::json;

/// Contract namespace: always `/v0` before `1.0.0`; it never tracks the package version.
pub const CONTRACT_VERSION: &str = "/v0";

/// One `mj.*` capability contract entry.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Capability {
    /// Capability id, e.g. `db:query` or `sms:send`.
    pub id: String,
    /// One-line semantic summary.
    pub summary: String,
    /// JSON Schema of the input parameters.
    pub input_schema: serde_json::Value,
    /// Whether this capability emits a metering event.
    pub metered: bool,
}

/// The current `/v0` capability catalog.
pub fn capability_catalog() -> Vec<Capability> {
    vec![
        Capability {
            id: "backend:provision".into(),
            summary: "Provision a loopback port and a dedicated SQLite file for an app".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "name": { "type": "string" }
                },
                "required": ["name"],
                "additionalProperties": false
            }),
            metered: true,
        },
        Capability {
            id: "db:migrate".into(),
            summary: "Run a migration against the app's dedicated database".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "sql": { "type": "string" }
                },
                "required": ["sql"],
                "additionalProperties": false
            }),
            metered: true,
        },
        Capability {
            id: "db:query".into(),
            summary: "Run a read-only query against the app's dedicated database".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "sql": { "type": "string" },
                    "params": {
                        "type": "array",
                        "items": { "type": ["string", "number", "boolean", "null"] }
                    }
                },
                "required": ["sql"],
                "additionalProperties": false
            }),
            metered: true,
        },
        Capability {
            id: "server:route".into(),
            summary: "Register an app route on the runtime reverse proxy".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "upstreamPort": { "type": "integer", "minimum": 1, "maximum": 65535 }
                },
                "required": ["path"],
                "additionalProperties": false
            }),
            metered: true,
        },
        Capability {
            id: "llm:complete".into(),
            summary: "Complete one LLM call through the provider proxy; defaults to L0/L1 (tier), L2/L3 (pinned model family/version) require authorization".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "messages": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "role": { "type": "string", "enum": ["system", "user", "assistant"] },
                                "content": { "type": "string" }
                            },
                            "required": ["role", "content"],
                            "additionalProperties": false
                        }
                    },
                    "profile": { "type": "string", "enum": ["fast", "balanced", "reasoning"] },
                    "model": {
                        "type": "string",
                        "description": "L2/L3 pin: a closed model family or version id, driven by the runtime capability catalog; calls are rejected without llm:pin authorization"
                    },
                    "maxTokens": { "type": "integer", "minimum": 1 }
                },
                "required": ["messages"],
                "additionalProperties": false
            }),
            metered: true,
        },
        Capability {
            id: "sms:send".into(),
            summary: "Send one SMS message through the provider proxy".into(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "to": { "type": "string" },
                    "text": { "type": "string" }
                },
                "required": ["to", "text"],
                "additionalProperties": false
            }),
            metered: true,
        },
    ]
}
