use std::sync::Arc;

use jarvis_provider::sms::{SmsProvider, SmsReceipt};
use jarvis_provider::ProviderError;

#[tokio::test]
async fn null_provider_fails_explicitly() {
    let provider = jarvis_provider::sms::NullSmsProvider;
    let err = provider.send("+100", "hi").await.unwrap_err();
    assert!(matches!(err, ProviderError::NotConfigured(_)));
}

#[cfg(feature = "mock")]
#[tokio::test]
async fn mock_provider_records_sequence_with_deterministic_ids() {
    let provider = Arc::new(jarvis_provider::mock::MockSmsProvider::new());
    let a: SmsReceipt = provider.send("+100", "first").await.unwrap();
    let b = provider.send("+200", "second").await.unwrap();

    assert_eq!(a.message_id, "mock-000001");
    assert_eq!(b.message_id, "mock-000002");
    assert_eq!(a.provider, "mock");
    assert_eq!(
        provider.messages(),
        vec![("+100".to_string(), "first".to_string()), ("+200".to_string(), "second".to_string())]
    );
}
