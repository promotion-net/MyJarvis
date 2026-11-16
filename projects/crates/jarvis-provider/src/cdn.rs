use async_trait::async_trait;

use crate::error::ProviderError;

#[async_trait]
pub trait CdnProvider: Send + Sync {
    /// 按路径前缀刷新缓存；流量计量由 runtime 代理层发出。
    async fn purge(&self, paths: &[String]) -> Result<(), ProviderError>;
}

pub struct NullCdnProvider;

#[async_trait]
impl CdnProvider for NullCdnProvider {
    async fn purge(&self, _paths: &[String]) -> Result<(), ProviderError> {
        Err(ProviderError::NotConfigured("cdn".into()))
    }
}
