# MyJarvis（开源仓）

收窄的 `mj.*` 能力 SDK、可独立测试的沙箱执行器与 agentic 工具链。生成代码只触达 `mj.*` 桩；运行时治理（supervisor / server / db 代理）、凭证、计费定价与验收引擎在**闭源 MJ-Cloud 仓**，本仓不依赖它，也不要求它才能构建和测试。

## 布局

- `projects/crates/` — Rust workspace：`jarvis-core`（领域模型与计量事件 schema）、`jarvis-sandbox`（子进程 sidecar 执行器，mock `Dispatcher` 即可独立测试）、`jarvis-provider`（SMS / CDN / LLM trait + `webhook` 参考实现，feature 门控）、`jarvis-mcp`（MCP 协议适配层）、`jarvis-napi`（开源接口能力的正交导出面，唯一 native 出口）
- `projects/packages/` — npm 包：`@my-jarvis/types`（能力契约，唯一类型源）、`@my-jarvis/sdk`（代理桩）、`my-jarvis`（`mj` CLI，用 `@vmz/commander` 组装 napi 导出）、`@my-jarvis/testing`（mock 与断言）、`@my-jarvis/jarvis-<platform>`（Node-API 平台分片）、桌面 / 移动壳骨架
- `scripts/build-napi.ts` — 构建 `jarvis-napi` 并按平台清单 staging `.node` 产物
- `projects/homepage/` — Web 门户与文档站
- `scripts` — 共享测试输入与示例用户代码

依赖方向：闭源仓只依赖本仓的已发布版本（`git + rev` pin 或 registry），本仓绝不反向依赖闭源代码。

## 开发

```sh
cargo build --workspace
cargo test --workspace
pnpm install
```

合同命名空间为 `/v0`：`1.0.0` 之前不保证旧版 API/ABI/shape 兼容。UI 框架中立——壳与生成应用的前端自由选型，跨生态 ABI 只认 Custom Element + HTTP + `mj.*`。
