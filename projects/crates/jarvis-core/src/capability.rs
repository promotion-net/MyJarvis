//! 能力目录：`mj.*` 表面的唯一真相源，供 MCP tool 导出、`mj verify` 越界校验
//! 与 `@my-jarvis/types` 生成消费。

use serde::{Deserialize, Serialize};
use serde_json::json;

/// 合同命名空间：`1.0.0` 之前统一 `/v0`，不随包版本递增。
pub const CONTRACT_VERSION: &str = "/v0";

/// 一个 `mj.*` 能力的契约条目。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Capability {
    /// 能力标识，例如 `db:query`、`sms:send`。
    pub id: String,
    /// 一句话语义说明。
    pub summary: String,
    /// 输入参数的 JSON Schema。
    pub input_schema: serde_json::Value,
    /// 该能力是否产生计量事件。
    pub metered: bool,
}

/// 当前 `/v0` 能力目录。
pub fn capability_catalog() -> Vec<Capability> {
    vec![
        Capability {
            id: "backend:provision".into(),
            summary: "为应用分配 loopback 端口与专属 SQLite 文件".into(),
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
            summary: "在应用专属数据库上执行迁移".into(),
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
            summary: "在应用专属数据库上执行只读查询".into(),
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
            summary: "在 runtime 反向代理上注册应用路由".into(),
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
            summary: "经 Provider 代理完成一次 LLM 调用；默认 L0/L1（档位），L2/L3（pin 模型族/版本）需授权".into(),
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
                        "description": "L2/L3 pin：封闭模型族或版本标识，由 runtime 能力目录驱动；未授权 llm:pin 时调用被拒绝"
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
            summary: "经 Provider 代理发送一条短信".into(),
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
