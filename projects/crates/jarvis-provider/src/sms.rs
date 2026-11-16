use async_trait::async_trait;
use serde::Serialize;

use crate::error::ProviderError;

/// 一次发送的受理回执。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SmsReceipt {
    pub provider: String,
    pub message_id: String,
}

#[async_trait]
pub trait SmsProvider: Send + Sync {
    /// 凭证注入与转发由 runtime 代理完成；实现不得把凭证暴露给调用方。
    async fn send(&self, to: &str, text: &str) -> Result<SmsReceipt, ProviderError>;
}

/// 默认空实现：未配置供应商时显式失败，不静默丢弃。
pub struct NullSmsProvider;

#[async_trait]
impl SmsProvider for NullSmsProvider {
    async fn send(&self, _to: &str, _text: &str) -> Result<SmsReceipt, ProviderError> {
        Err(ProviderError::NotConfigured("sms".into()))
    }
}
