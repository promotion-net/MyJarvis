// 沙箱 ESM 解析钩子：只放行注册表内的 `jarvis*` specifier，其余一律
// ERR_UNKNOWN_HOST_MODULE。`node:*` 仅 prelude 自身可用；npm bare specifier 拒绝。
let cfg = { prelude: "", modules: [] };

export function initialize(data) {
  cfg = data;
}

const ALIAS = "jarvis-host:";

function findModule(specifier) {
  return cfg.modules.find((m) => m.specifier === specifier);
}

export async function resolve(specifier, context, next) {
  if (specifier === "jarvis" || specifier.startsWith("jarvis:")) {
    if (!findModule(specifier)) {
      throw new Error(`ERR_UNKNOWN_HOST_MODULE: ${specifier}`);
    }
    return { url: ALIAS + specifier, format: "module", shortCircuit: true };
  }
  if (specifier.startsWith("node:")) {
    if (context.parentURL === cfg.prelude) {
      return next(specifier, context);
    }
    throw new Error(`ERR_UNKNOWN_HOST_MODULE: ${specifier}`);
  }
  const isPathLike =
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/") ||
    specifier.startsWith("file:") ||
    specifier.startsWith("data:");
  if (!isPathLike) {
    throw new Error(`ERR_UNKNOWN_HOST_MODULE: ${specifier}`);
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (!url.startsWith(ALIAS)) {
    return next(url, context);
  }
  const mod = findModule(url.slice(ALIAS.length));
  return { format: "module", source: synthesize(mod), shortCircuit: true };
}

function synthesize(mod) {
  if (mod.kind === "aggregate") {
    return `import { makeMj } from "${cfg.prelude}";\nexport const mj = makeMj();\nexport default mj;\n`;
  }
  if (mod.kind === "global") {
    return `import { installGlobalMj } from "${cfg.prelude}";\ninstallGlobalMj();\n`;
  }
  const lines = [`import { hostCall } from "${cfg.prelude}";`];
  for (const e of mod.exports) {
    lines.push(`export const ${e.name} = (opts = {}) => hostCall("${e.method}", opts);`);
  }
  lines.push(`export default { ${mod.exports.map((e) => e.name).join(", ")} };`);
  return lines.join("\n") + "\n";
}
