# MyJarvis

The narrowed `mj.*` capability SDK, a standalone-testable sandbox executor and the agentic toolchain. Generated code touches only `mj.*` stubs; this repository builds and tests on its own without any external runtime.

## Layout

- `projects/crates/` — Rust workspace: `jarvis-core` (domain model and metering event schema), `jarvis-sandbox` (subprocess sidecar executor, fully testable with a mock `Dispatcher`), `jarvis-provider` (SMS / CDN / LLM traits + `webhook` reference implementation, feature-gated), `jarvis-mcp` (MCP protocol adapter), `jarvis-napi` (the orthogonal export surface of the open interface capabilities — the only native egress)
- `projects/packages/` — npm packages: `@my-jarvis/types` (capability contract, single type source), `@my-jarvis/sdk` (proxy stubs), `my-jarvis` (the `mj` CLI, `@vmz/commander` over the napi exports), `@my-jarvis/testing` (mocks and assertions), `@my-jarvis/jarvis-<platform>` (Node-API platform shards), desktop / mobile shell skeletons
- `scripts/build-napi.ts` — builds `jarvis-napi` and stages `.node` artifacts per platform manifest
- `projects/homepage/` — web portal and documentation site
- `scripts` — shared test inputs and example user code

## Development

```sh
cargo build --workspace
cargo test --workspace
pnpm install
pnpm run build:napi   # stage the native addon into the platform shard
```

The contract namespace is `/v0`: no compatibility is promised for older APIs, ABIs or shapes before `1.0.0`. UI frameworks are neutral — shells and generated apps pick their own frontend; the cross-ecosystem ABI is Custom Element + HTTP + `mj.*` only.
