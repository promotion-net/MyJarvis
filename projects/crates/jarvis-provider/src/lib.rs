//! Provider trait definitions: the only egress through which the runtime proxies external capabilities.
//!
//! This crate carries the traits, capability metadata, the deterministic `mock` and the
//! `webhook` reference implementation. Vendor-specific backends, routing and rate-limit
//! policies satisfy the same traits outside this crate. Vendor identity, credentials and
//! unit prices never enter any outward-facing trait type; the `mj.sms.send` signature does
//! not change with the vendor.

pub mod cdn;
pub mod error;
pub mod llm;
pub mod sms;

#[cfg(feature = "mock")]
pub mod mock;
#[cfg(feature = "webhook")]
pub mod webhook;

pub use error::ProviderError;
