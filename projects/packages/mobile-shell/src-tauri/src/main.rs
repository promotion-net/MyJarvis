//! 移动壳入口：同一 workspace、不同 target。
//! 移动端直接走 Tauri command → `jarvis-runtime`，不经过 napi-rs；
//! 完整 Tauri 依赖在壳联调阶段引入，当前先输出 `/v0` 能力目录验证装配。

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
