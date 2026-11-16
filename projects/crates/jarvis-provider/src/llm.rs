//! LLM provider trait: the trait carries capability metadata so routing can
//! depend on metadata instead of hard-coded vendor knowledge. Community and
//! vendor-supplied implementations satisfy the same interface.

use std::collections::BTreeSet;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::error::ProviderError;

/// Internal provider identifier — never leaves the runtime, never appears in any outward response.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ProviderId(pub String);

/// L1 capability tier. Visible to users; the backing vendor is not.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LlmProfile {
    Fast,
    Balanced,
    Reasoning,
}

/// A provider's capability declaration; the routing layer uses it for hard-constraint filtering.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LlmCapabilities {
    pub profiles: BTreeSet<LlmProfile>,
    /// Model families/versions allowed for L2/L3 pins (public information; empty set = L0/L1 only).
    pub model_families: BTreeSet<String>,
    /// Compliance region identifiers.
    pub regions: BTreeSet<String>,
    pub max_context: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LlmMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LlmRequest {
    pub messages: Vec<LlmMessage>,
    /// L1 tier; mutually exclusive with `model`, defaults to `balanced` routing.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile: Option<LlmProfile>,
    /// L2/L3 pin: model family or version id; requires `llm:pin` / `llm:pin-exact` authorization.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
}

/// Normalized response: the runtime flattens vendor-specific fields before returning,
/// so generated code never observes them.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LlmResponse {
    pub text: String,
    pub usage: TokenUsage,
}

#[async_trait]
pub trait LlmProvider: Send + Sync {
    fn id(&self) -> ProviderId;
    fn capabilities(&self) -> LlmCapabilities;
    async fn complete(&self, request: &LlmRequest) -> Result<LlmResponse, ProviderError>;
}

pub struct NullLlmProvider;

#[async_trait]
impl LlmProvider for NullLlmProvider {
    fn id(&self) -> ProviderId {
        ProviderId("null".into())
    }

    fn capabilities(&self) -> LlmCapabilities {
        LlmCapabilities {
            profiles: BTreeSet::new(),
            model_families: BTreeSet::new(),
            regions: BTreeSet::new(),
            max_context: 0,
        }
    }

    async fn complete(&self, _request: &LlmRequest) -> Result<LlmResponse, ProviderError> {
        Err(ProviderError::NotConfigured("llm".into()))
    }
}
