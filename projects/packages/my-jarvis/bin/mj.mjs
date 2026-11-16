#!/usr/bin/env node
// `mj` 入口：加载构建后的 CLI（`@vmz/commander` 组装 `jarvis-napi` 导出），不 spawn 原生二进制。
const minimum = [24, 12, 0];
const current = process.versions.node.split(".").map((part) => Number(part));
const tooOld =
    current[0] < minimum[0] ||
    (current[0] === minimum[0] &&
        (current[1] < minimum[1] || (current[1] === minimum[1] && current[2] < minimum[2])));

if (tooOld) {
    console.error(`my-jarvis requires Node.js >=24.12.0 (found ${process.versions.node})`);
    process.exit(1);
}

const { runCli } = await import("../dist/cli.js");

process.exitCode = await runCli(process.argv.slice(2));
