// `mj` CLI：用 `@vmz/commander` 组装 `jarvis-napi` 的正交导出，不 spawn 任何原生二进制。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createCli, normalizeArgv, type Cli, type ParsedOptions } from "@vmz/commander";

import { loadJarvisNative } from "./native.js";

function buildMjCli(): Cli {
    const localesRoot = join(dirname(fileURLToPath(import.meta.url)), "../locales");
    const cli = createCli("mj").locales(localesRoot).intro("cli.intro");

    cli.command("capabilities", "cli.cmd.capabilities").action((options: ParsedOptions) => {
        printJson(loadJarvisNative().capabilityCatalogJson());
        return 0;
    });

    cli.command("schema", "cli.cmd.schema")
        .option("--mcp", "cli.opt.mcp")
        .action((options: ParsedOptions) => {
            const native = loadJarvisNative();
            printJson(options["mcp"] ? native.mcpToolDefinitionsJson() : native.capabilityCatalogJson());
            return 0;
        });

    return cli;
}

function printJson(payload: string): void {
    console.log(JSON.stringify(JSON.parse(payload), null, 2));
}

const packageVersion = readPackageVersion();

function readPackageVersion(): string {
    try {
        const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
            version?: string;
        };
        return manifest.version ?? "0.0.0";
    } catch {
        return "0.0.0";
    }
}

export async function runCli(argv: string[]): Promise<number> {
    const args = normalizeArgv(argv);
    if (args.length === 1 && (args[0] === "--version" || args[0] === "-V")) {
        console.log(packageVersion);
        return 0;
    }

    try {
        return await buildMjCli().parse(argv);
    } catch (error) {
        console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
        return 1;
    }
}
