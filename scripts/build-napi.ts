// 构建 `jarvis-napi` 的 Node-API 产物并 staging 到宿主平台的 npm 分片包。
// 平台分片清单是产物合同：`os` + `cpu` 标识目标平台，`main` 指名要发布的 `.node`。
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

/** 上一轮构建残留的 `.node` 绝不能被当作本轮产物 staging。 */
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

// `napi build` 自己会先跑一次不加锁的 `cargo metadata`，陈旧 `Cargo.lock` 会被静默改写。
// 编译前先做 `--locked` 预检，漂移直接失败，与 CI 口径一致（`@napi-rs/cli` v3 无 `--cargo-flags`）。
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
