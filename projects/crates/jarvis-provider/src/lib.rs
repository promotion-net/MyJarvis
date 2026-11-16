//! Provider trait 定义：runtime 代理外部能力的唯一出口。
//!
//! 开源面 = trait + 元数据 + `mock`（确定性测试）+ `webhook`（参考实现）。
//! 商业供应商实现（`sms-aliyun` / `sms-twilio` / `cdn-cloudflare` 等）、路由与
//! 限流策略在闭源 MJ-Cloud 仓，走同一 trait。供应商身份、凭证与单价不进入
//! trait 的任何对外类型；`mj.sms.send` 签名不随供应商变化。

pub mod cdn;
pub mod error;
pub mod llm;
pub mod sms;

#[cfg(feature = "mock")]
pub mod mock;
#[cfg(feature = "webhook")]
pub mod webhook;

pub use error::ProviderError;
