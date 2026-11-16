//! Reference implementation: a generic webhook SMS provider.
//!
//! POSTs `{ to, text }` to the configured endpoint and uses the response text as `message_id`.
//! This doubles as the template for community providers (credential management belongs to the
//! host, not to this implementation); vendor-specific implementations satisfy the same
//! `SmsProvider` trait.

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
