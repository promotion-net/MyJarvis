//! 桌面壳骨架（开源）：只做挂载与能力自检，不组装 runtime。
//! runtime 治理在闭源 MJ-Cloud，经 runtime-bridge 注入本壳；Tauri 完整依赖在壳联调阶段引入。

fn main() {
    println!(
        "my-jarvis desktop shell skeleton, contract {}, {} capabilities",
        jarvis_core::CONTRACT_VERSION,
        jarvis_core::capability_catalog().len()
    );
}
