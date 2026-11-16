#!/usr/bin/env node
// 薄封装：转发到 jarvis-cli 产出的原生 `mj` 二进制（MJ_NATIVE_BIN 可覆盖路径）。
import {spawnSync} from "node:child_process";

const binary = process.env.MJ_NATIVE_BIN ?? "mj";
const result = spawnSync(binary, process.argv.slice(2), {stdio: "inherit"});

if (result.error) {
    console.error(`@my-jarvis/cli: cannot run native binary "${binary}": ${result.error.message}`);
    console.error("build it first: cargo build -p jarvis-cli");
    process.exit(127);
}
process.exit(result.status ?? 1);
