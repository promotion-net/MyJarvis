//! MyJarvis 领域模型：Session、Message、Task、Capability、AppId 与计量事件。
//!
//! 这里是所有 crate 与 `@my-jarvis/types` 契约的共同真相源；wire/serde 命名以
//! Rust 字段为准（结构体 camelCase，枚举 tag kebab-case）。

pub mod app;
pub mod capability;
pub mod meter;
pub mod session;

pub use app::AppId;
pub use capability::{CONTRACT_VERSION, Capability, capability_catalog};
pub use meter::{DisclosureLevel, MeterEvent, MeterUnit};
pub use session::{Message, Role, Session, Task, TaskState};
