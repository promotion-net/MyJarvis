// JS-side loader for `jarvis-napi`: platform shard packages are the only delivery channel for `.node` artifacts.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/** The orthogonal export surface of `jarvis-napi` (napi-derive maps snake_case to camelCase). */
export type JarvisNative = {
    contractVersion(): string;
    capabilityCatalogJson(): string;
    mcpProtocolVersion(): string;
    mcpToolDefinitionsJson(): string;
    mcpHandleRequest(requestJson: string): string | null;
    sandboxHostRegistryJson(): string;
};

/** Platform coverage declared by an installed shard. */
export type PlatformShard = { name: string; os: string[]; cpu: string[] };

/**
 * `optionalDependencies` are the platform shards; their manifests (`os` + `cpu`) are the single
 * source of truth for platform coverage, the same rule `scripts/build-napi.ts` applies when
 * staging. Shards npm skipped during install are not resolvable and therefore absent here.
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

/** Loads the Node-API binding from the shard matching the current platform (the shard's `main` is the `.node`, so `require` returns the exports directly). */
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
