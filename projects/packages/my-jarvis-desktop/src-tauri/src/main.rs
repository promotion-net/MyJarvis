//! Desktop shell skeleton (open source): mounting and capability self-check only, no runtime assembly.
//! The shell receives its runtime through an injected bridge; full Tauri wiring lands with shell integration.

fn main() {
    println!(
        "my-jarvis desktop shell skeleton, contract {}, {} capabilities",
        jarvis_core::CONTRACT_VERSION,
        jarvis_core::capability_catalog().len()
    );
}
