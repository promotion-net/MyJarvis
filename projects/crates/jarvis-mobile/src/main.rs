//! Mobile shell entry: same workspace, different target.
//! Mobile reuses the WAE host bridge of the desktop shell instead of napi-rs;
//! the platform integration lands with the WAE mobile target. For now this
//! prints the `/v0` capability catalog to verify assembly.

fn main() {
    let catalog = jarvis_core::capability_catalog();
    println!(
        "my-jarvis mobile shell, contract {}, {} capabilities",
        jarvis_core::CONTRACT_VERSION,
        catalog.len()
    );
    println!(
        "{}",
        serde_json::to_string_pretty(&catalog).expect("catalog json")
    );
}
