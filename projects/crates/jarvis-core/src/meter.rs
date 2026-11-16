//! 计量事件：runtime 各受控模块在操作完成时发出，`jarvis-billing` 消费。

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

/// 一次受控操作的计量事件。
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeterEvent {
    pub app_id: AppId,
    /// 触发事件的能力 id，例如 `db:query`。
    pub capability: String,
    pub quantity: u64,
    pub unit: MeterUnit,
    /// Unix 毫秒时间戳。
    pub timestamp_ms: u64,
}
