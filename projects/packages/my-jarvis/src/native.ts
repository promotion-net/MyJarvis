// `jarvis-napi` 的 JS 侧装载：平台分片包是 `.node` 产物的唯一配送通道。
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/** `jarvis-napi` 的正交导出面（napi-derive 把 snake_case 转成 camelCase）。 */
export type JarvisNative = {
    contractVersion(): string;
    capabilityCatalogJson(): string;
    mcpProtocolVersion(): string;
    mcpToolDefinitionsJson(): string;
    mcpHandleRequest(requestJson: string): string | null;
    sandboxHostRegistryJson(): string;
};

/** 已安装平台分片的清单覆盖信息。 */
export type PlatformShard = { name: string; os: string[]; cpu: string[] };

/**
 * `optionalDependencies` 即平台分片；它们的清单（`os` + `cpu`）是平台覆盖的唯一真相源，
 * 与 `scripts/build-napi.ts` 的 staging 规则一致。npm 安装时跳过的分片不可解析，自然缺席。
 */
export function listPlatformShards(): PlatformShard[] {
    const require = createRequire(import.meta.url);
    const manifest = require("../package.json") as { optionalDependencies?: Record<string, string> };
    const shards: PlatformShard[] = [];
    for (const name of Object.keys(manifest.optionalDependencies ?? {})) {
        let manifestPath: string;
        try {
            manifestPath = require.resolve(`${name}/package.json`);
        } catch {
            continue;
        }
        const shard = JSON.parse(readFileSync(manifestPath, "utf8")) as { os?: string[]; cpu?: string[] };
        if (!Array.isArray(shard.os) || shard.os.length === 0 || !Array.isArray(shard.cpu) || shard.cpu.length === 0) {
            continue;
        }
        shards.push({ name, os: shard.os, cpu: shard.cpu });
    }
    return shards;
}

let cached: JarvisNative | undefined;

/** 从匹配当前平台的分片包装载 Node-API 绑定（分片包 `main` 即 `.node`，require 直接返回导出）。 */
export function loadJarvisNative(): JarvisNative {
    if (cached) {
        return cached;
    }
    const platform = process.platform;
    const arch = process.arch;
    const shard = listPlatformShards().find(
        (candidate) => candidate.os.includes(platform) && candidate.cpu.includes(arch),
    );
    if (!shard) {
        throw new Error(
            `Unsupported platform for MyJarvis native bindings: ${platform}-${arch}. ` +
                "No installed optional dependency declares that platform",
        );
    }
    const require = createRequire(import.meta.url);
    cached = require(shard.name) as JarvisNative;
    return cached;
}
