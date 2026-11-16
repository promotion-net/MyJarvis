//! 计量事件：runtime 各受控模块在操作完成时发出，由闭源 billing 消费。
//! 本 schema 开源；定价折算、ledger 与结算在闭源仓。

use serde::{Deserialize, Serialize};

use crate::app::AppId;

/// 计量单位。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MeterUnit {
    CpuSeconds,
    MemoryPeakBytes,
    DiskBytes,
    Requests,
    DbQueries,
    SmsMessages,
    CdnBytes,
    LlmTokens,
    Delivery,
}

/// 披露层级（L0–L3）：用户在该次调用中能感知到什么。
/// L0 完全保密（默认；SMS/CDN 永远 L0）；L1 档位披露；L2 模型族披露；L3 精确版本。
/// 任何层级都不暴露供应商身份、凭证与单价。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DisclosureLevel {
    #[default]
    L0,
    L1,
    L2,
    L3,
}

/// 一次受控操作的计量事件。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeterEvent {
    pub app_id: AppId,
    /// 触发事件的能力 id，例如 `db:query`。
    pub capability: String,
    pub quantity: u64,
    pub unit: MeterUnit,
    /// 用户可见的披露层级；闭源 ledger 据此区分"按能力计费"与"按所选模型计费"。
    pub disclosure_level: DisclosureLevel,
    /// Unix 毫秒时间戳。
    pub timestamp_ms: u64,
}
