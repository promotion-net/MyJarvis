// MyJarvis sandbox prelude: the controlled stub substrate behind the `jarvis:*` host modules.
// Every named export serializes to one JSON-RPC request on stdout; the host runtime answers it.
// The global `mj` is not injected by default; `import "jarvis:global"` installs the frozen view explicitly.
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

// One host capability call: the wire method name (`mj.<ns>.<method>`) comes from the registry.
export function hostCall(method, params = {}) {
  return send(method, params);
}

const registry = JSON.parse(process.env.MJ_HOST_REGISTRY ?? "[]");

// The `mj` aggregate of the `jarvis` entry: a frozen merge of every `jarvis:*` domain namespace.
// It is not an independent capability source — only registry-listed methods are exposed.
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

// Side effect of `jarvis:global`: installs a non-writable, non-redefinable global `mj`.
export function installGlobalMj() {
  Object.defineProperty(globalThis, "mj", {
    value: makeMj(),
    writable: false,
    configurable: false,
  });
}

// Called by the entry after the script finishes: releases stdin so the event loop drains naturally.
export function finish() {
  lines.close();
  process.stdin.destroy();
}
