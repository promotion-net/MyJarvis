//! LLM Provider：trait 携带能力元数据，路由决策是闭源 runtime 的内部事。
//! 社区 provider 与商业实现走同一接口；`LlmCapabilities` 让路由依赖元数据而非硬编码。

use std::collections::BTreeSet;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::error::ProviderError;

/// 内部 provider 标识——不出 runtime，不进入任何对外响应。
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ProviderId(pub String);

/// L1 能力档位。用户可见，供应商不可见。
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LlmProfile {
    Fast,
    Balanced,
    Reasoning,
}

/// provider 的能力声明；路由层据此做硬约束筛选（闭源 runtime 内部消费）。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LlmCapabilities {
    pub profiles: BTreeSet<LlmProfile>,
    /// L2/L3 允许 pin 的模型族/版本标识（公开信息；空集 = 只支持 L0/L1）。
    pub model_families: BTreeSet<String>,
    /// 合规区域标识。
    pub regions: BTreeSet<String>,
    pub max_context: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmRequest {
    pub messages: Vec<LlmMessage>,
    /// L1 档位；与 `model` 互斥，缺省按 `balanced` 路由。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile: Option<LlmProfile>,
    /// L2/L3 pin：模型族或版本标识；需要 `llm:pin` / `llm:pin-exact` 授权。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
}

/// 归一化响应：runtime 在返回前抹平供应商特有字段，生成代码永远看不到。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
