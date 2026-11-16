//! Metering events: emitted by controlled runtime modules when an operation
//! completes. This crate defines the event schema only; pricing, ledgers and
//! settlement are the host application's responsibility.

use serde::{Deserialize, Serialize};

use crate::app::AppId;

/// Metering unit.
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

/// Disclosure level (L0–L3): what the user may perceive for a given call.
/// L0 fully opaque (default; SMS/CDN are always L0); L1 discloses the tier;
/// L2 discloses the model family; L3 discloses the exact version.
/// No level ever exposes vendor identity, credentials or unit prices.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DisclosureLevel {
    #[default]
    L0,
    L1,
    L2,
    L3,
}

/// A metering event for one controlled operation.
///
/// Serde output is `snake_case` (language-neutral truth source); camelCase is a
/// TypeScript-binding concern only.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MeterEvent {
    pub app_id: AppId,
    /// Capability id that produced the event, e.g. `db:query`.
    pub capability: String,
    pub quantity: u64,
    pub unit: MeterUnit,
    /// User-facing disclosure level; hosts use it to separate
    /// "billed by capability" from "billed by the selected model".
    pub disclosure_level: DisclosureLevel,
    /// Unix timestamp in milliseconds.
    pub timestamp_ms: u64,
}
