use async_trait::async_trait;
use serde::Serialize;

use crate::error::ProviderError;

/// Acceptance receipt for one send.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmsReceipt {
    pub provider: String,
    pub message_id: String,
}

#[async_trait]
pub trait SmsProvider: Send + Sync {
    /// Credential injection and forwarding are mediated by the runtime; implementations must never expose credentials to callers.
    async fn send(&self, to: &str, text: &str) -> Result<SmsReceipt, ProviderError>;
}

/// Default null implementation: fails explicitly when no vendor is configured, never drops silently.
pub struct NullSmsProvider;

#[async_trait]
impl SmsProvider for NullSmsProvider {
    async fn send(&self, _to: &str, _text: &str) -> Result<SmsReceipt, ProviderError> {
        Err(ProviderError::NotConfigured("sms".into()))
    }
}
