//! 参考实现：通用 webhook SMS provider。
//!
//! 把 `{ to, text }` POST 到配置的端点，响应文本作为 `message_id`。
//! 这是社区 provider 的模板（凭证管理属于宿主，不在本实现里）；
//! 商业供应商实现与路由策略在闭源仓，走同一 `SmsProvider` trait。

use async_trait::async_trait;

use crate::error::ProviderError;
use crate::sms::{SmsProvider, SmsReceipt};

pub struct WebhookSmsProvider {
    endpoint: String,
    client: reqwest::Client,
}

impl WebhookSmsProvider {
    pub fn new(endpoint: impl Into<String>) -> Self {
        Self { endpoint: endpoint.into(), client: reqwest::Client::new() }
    }
}

#[async_trait]
impl SmsProvider for WebhookSmsProvider {
    async fn send(&self, to: &str, text: &str) -> Result<SmsReceipt, ProviderError> {
        let response = self
            .client
            .post(&self.endpoint)
            .json(&serde_json::json!({ "to": to, "text": text }))
            .send()
            .await
            .map_err(|err| ProviderError::Transport {
                provider: "webhook".into(),
                detail: err.to_string(),
            })?;
        let status = response.status().as_u16();
        if !response.status().is_success() {
            return Err(ProviderError::Api {
                provider: "webhook".into(),
                status,
                message: "webhook endpoint rejected the message".into(),
            });
        }
        let message_id = response.text().await.unwrap_or_default().trim().to_owned();
        Ok(SmsReceipt { provider: "webhook".into(), message_id })
    }
}
