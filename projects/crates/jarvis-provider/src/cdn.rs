use async_trait::async_trait;

use crate::error::ProviderError;

#[async_trait]
pub trait CdnProvider: Send + Sync {
    /// Purge cached objects by path prefix; traffic metering is emitted by the runtime proxy layer.
    async fn purge(&self, paths: &[String]) -> Result<(), ProviderError>;
}

pub struct NullCdnProvider;

#[async_trait]
impl CdnProvider for NullCdnProvider {
    async fn purge(&self, _paths: &[String]) -> Result<(), ProviderError> {
        Err(ProviderError::NotConfigured("cdn".into()))
    }
}
