//! 确定性 mock provider：记录调用序列，供 `jarvis-verify` 断言与测试。

use std::collections::BTreeSet;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, PoisonError};

use async_trait::async_trait;

use crate::error::ProviderError;
use crate::llm::{LlmCapabilities, LlmProvider, LlmRequest, LlmResponse, ProviderId, TokenUsage};
use crate::sms::{SmsProvider, SmsReceipt};

pub struct MockSmsProvider {
    sent: Mutex<Vec<(String, String)>>,
    counter: AtomicU64,
}

impl Default for MockSmsProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl MockSmsProvider {
    pub fn new() -> Self {
        Self { sent: Mutex::new(Vec::new()), counter: AtomicU64::new(0) }
    }

    /// 已记录的 (to, text) 序列，按调用顺序。
    pub fn messages(&self) -> Vec<(String, String)> {
        self.sent.lock().unwrap_or_else(PoisonError::into_inner).clone()
    }
}

#[async_trait]
impl SmsProvider for MockSmsProvider {
    async fn send(&self, to: &str, text: &str) -> Result<SmsReceipt, ProviderError> {
        self.sent
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .push((to.to_owned(), text.to_owned()));
        let n = self.counter.fetch_add(1, Ordering::SeqCst) + 1;
        Ok(SmsReceipt { provider: "mock".into(), message_id: format!("mock-{n:06}") })
    }
}

/// 确定性 mock LLM：回显最后一条消息，固定 usage；无 `model_families`（只支持 L0/L1）。
pub struct MockLlmProvider {
    counter: AtomicU64,
}

impl Default for MockLlmProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl MockLlmProvider {
    pub fn new() -> Self {
        Self { counter: AtomicU64::new(0) }
    }
}

#[async_trait]
impl LlmProvider for MockLlmProvider {
    fn id(&self) -> ProviderId {
        ProviderId("mock-llm".into())
    }

    fn capabilities(&self) -> LlmCapabilities {
        LlmCapabilities {
            profiles: BTreeSet::from([
                crate::llm::LlmProfile::Fast,
                crate::llm::LlmProfile::Balanced,
                crate::llm::LlmProfile::Reasoning,
            ]),
            model_families: BTreeSet::new(),
            regions: BTreeSet::new(),
            max_context: 8192,
        }
    }

    async fn complete(&self, request: &LlmRequest) -> Result<LlmResponse, ProviderError> {
        let n = self.counter.fetch_add(1, Ordering::SeqCst) + 1;
        let last = request.messages.last().map(|m| m.content.clone()).unwrap_or_default();
        Ok(LlmResponse {
            text: format!("mock-reply-{n:06}:{last}"),
            usage: TokenUsage { input_tokens: 10, output_tokens: 5 },
        })
    }
}
