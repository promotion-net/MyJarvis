use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProviderError {
    #[error("no provider configured for `{0}`")]
    NotConfigured(String),
    #[error("transport failure in provider `{provider}`: {detail}")]
    Transport { provider: String, detail: String },
    #[error("provider `{provider}` returned status {status}: {message}")]
    Api { provider: String, status: u16, message: String },
}
