//! MyJarvis domain model: Session, Message, Task, Capability, AppId and metering events.
//!
//! This crate is the shared source of truth for every crate and the
//! `@my-jarvis/types` contract; wire/serde naming follows the Rust fields
//! (structs `camelCase`, enum tags `kebab-case`).

pub mod app;
pub mod capability;
pub mod meter;
pub mod session;

pub use app::AppId;
pub use capability::{CONTRACT_VERSION, Capability, capability_catalog};
pub use meter::{DisclosureLevel, MeterEvent, MeterUnit};
pub use session::{Message, Role, Session, Task, TaskState};
