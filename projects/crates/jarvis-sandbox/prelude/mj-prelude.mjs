// MyJarvis 沙箱 prelude：宿主模块 `jarvis:*` 的受控桩底座。
// 每个具名导出序列化为一条 JSON-RPC 请求写入 stdout，由宿主 runtime 应答。
// 全局 `mj` 默认不注入；`import "jarvis:global"` 显式注入冻结视图。
import readline from "node:readline";

const pending = new Map();
let nextId = 1;

function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}

const lines = readline.createInterface({ input: process.stdin });
lines.on("line", (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) {
      reject(new Error(msg.error.message ?? "host call failed"));
    } else {
      resolve(msg.result);
    }
  }
});

/// 一次宿主能力调用：wire 方法名（`mj.<ns>.<method>`）由注册表决定。
export function hostCall(method, params = {}) {
  return send(method, params);
}

const registry = JSON.parse(process.env.MJ_HOST_REGISTRY ?? "[]");

/// `jarvis` 聚合入口的 `mj`：各 `jarvis:*` 域命名空间的冻结合并视图，
/// 不是独立能力来源——只暴露注册表内的方法。
export function makeMj() {
  const domains = {};
  for (const mod of registry) {
    if (mod.kind !== "domain") continue;
    const ns = mod.specifier.slice("jarvis:".length);
    const impl = {};
    for (const e of mod.exports) {
      impl[e.name] = (opts = {}) => hostCall(e.method, opts);
    }
    domains[ns] = Object.freeze(impl);
  }
  return Object.freeze(domains);
}

/// `jarvis:global` 的副作用：注入不可写、不可重定义的全局 `mj`。
export function installGlobalMj() {
  Object.defineProperty(globalThis, "mj", {
    value: makeMj(),
    writable: false,
    configurable: false,
  });
}

/// 脚本正常结束后由入口调用：释放 stdin，让事件循环自然退出。
export function finish() {
  lines.close();
  process.stdin.destroy();
}
