// Builds the `jarvis-napi` Node-API artifact and stages it into the host platform's npm shard.
// Platform shard manifests are the artifact contract: `os` + `cpu` identify the target and
// `main` names the `.node` that gets published.
import { execFileSync, execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type PlatformPackage = {
    dir: string;
    dirName: string;
    os: string[];
    cpu: string[];
    main: string;
    artifact: string;
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const napiDir = join(root, "projects/crates/jarvis-napi");
const packagesDir = join(root, "projects/packages");

function readPlatformPackages(): PlatformPackage[] {
    const packages: PlatformPackage[] = [];
    for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue;
        }
        const dir = join(packagesDir, entry.name);
        const manifestPath = join(dir, "package.json");
        if (!existsSync(manifestPath)) {
            continue;
        }
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (
            !Array.isArray(manifest.os) ||
            manifest.os.length === 0 ||
            !Array.isArray(manifest.cpu) ||
            manifest.cpu.length === 0
        ) {
            continue;
        }
        if (typeof manifest.main !== "string" || !manifest.main.endsWith(".node")) {
            throw new Error(`${entry.name}/package.json must declare its addon as "main", got ${manifest.main}`);
        }
        packages.push({
            dir,
            dirName: entry.name,
            os: manifest.os,
            cpu: manifest.cpu,
            main: manifest.main,
            artifact: basename(manifest.main),
        });
    }
    return packages;
}

function nodeFiles(dir: string): string[] {
    return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".node")) : [];
}

/** A `.node` left behind by an earlier run must never be staged as this build's output. */
function clearNodes(dir: string): void {
    for (const name of nodeFiles(dir)) {
        unlinkSync(join(dir, name));
    }
}

const host = readPlatformPackages().filter(
    (pkg) => pkg.os.includes(process.platform) && pkg.cpu.includes(process.arch),
);
if (host.length !== 1) {
    throw new Error(
        `expected exactly one platform package for ${process.platform}-${process.arch}, found ${
            host.map((pkg) => pkg.dirName).join(", ") || "none"
        }`,
    );
}
const target = host[0];

// `napi build` runs an unlocked `cargo metadata` of its own first, so a stale `Cargo.lock`
// would be silently rewritten. The `--locked` pre-check fails loudly on drift instead,
// matching CI (`@napi-rs/cli` v3 has no `--cargo-flags`).
try {
    execFileSync("cargo", ["metadata", "--format-version", "1", "--locked"], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "ignore", "pipe"],
    });
} catch (error) {
    console.error("Cargo.lock does not match the workspace manifests.");
    console.error(String(error instanceof Error ? error.message : error).trim());
    process.exit(1);
}

clearNodes(napiDir);

execSync("pnpm exec napi build --platform --release --no-js", {
    cwd: napiDir,
    stdio: "inherit",
    shell: true,
});

const source = join(napiDir, target.artifact);
if (!existsSync(source)) {
    throw new Error(
        `napi build did not produce ${target.artifact} for ${target.dirName} (found: ${
            nodeFiles(napiDir).join(", ") || "no .node files"
        })`,
    );
}
for (const name of nodeFiles(napiDir).filter((name) => name !== target.artifact)) {
    console.warn(`skip unclaimed artifact: ${name}`);
}

const dest = join(target.dir, target.main);
mkdirSync(dirname(dest), { recursive: true });
clearNodes(dirname(dest));
copyFileSync(source, dest);
console.log(`staged ${target.artifact} -> ${dest}`);
