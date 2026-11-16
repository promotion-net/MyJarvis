# MyJarvis

本地 native runtime、收窄的 `mj.*` 能力 SDK 与 agentic 工具链。生成代码只触达 `mj.*` 桩，端口、数据库文件、供应商凭证与计费全部由 runtime 中介。

## 布局

- `projects/crates/` — Rust workspace：`jarvis-core`（领域模型）、`jarvis-runtime`（supervisor / server / db / assets）、`jarvis-sandbox`（sidecar 执行器）、`jarvis-provider`（SMS / CDN / LLM trait 与可选实现）、`jarvis-billing`（计量事件与 append-only ledger）、`jarvis-mcp`、`jarvis-verify`、`jarvis-napi`、`jarvis-cli`
- `projects/packages/` — npm 包：`@my-jarvis/types`（能力契约，唯一类型源）、`@my-jarvis/sdk`、`@my-jarvis/cli`、`@my-jarvis/testing`、桌面 / 移动壳
- `projects/homepage/` — Web 门户与文档站
- `fixtures/` — 共享测试输入与 goldens
- `tools/xtask/` — 仓库自动化入口

## 开发

```sh
cargo build --workspace
cargo test --workspace
pnpm install
```

合同命名空间为 `/v0`：`1.0.0` 之前不保证旧版 API/ABI/shape 兼容。
