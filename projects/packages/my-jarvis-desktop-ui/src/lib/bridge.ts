// Shell-side transport bridge: every `mj.*` call is forwarded through the
// Tauri `mj_dispatch` command to the loopback runtime gateway. Outside the
// shell the transport fails explicitly — the surface never fakes local execution.

import { installMjTransport } from "@my-jarvis/sdk";

const APP_ID_KEY = "mj.shell.appId";

type TauriInvoke = (command: string, args: Record<string, unknown>) => Promise<unknown>;

interface TauriWindowScope {
    __TAURI__?: { core?: { invoke?: TauriInvoke } };
}

/** Shell session identity: stable per install, owned by the front end. */
export function currentAppId(): string {
    const existing = localStorage.getItem(APP_ID_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(APP_ID_KEY, fresh);
    return fresh;
}

export function installShellTransport(): void {
    installMjTransport(async (method, params) => {
        const invoke = globalThis as TauriWindowScope;
        const core = invoke.__TAURI__?.core?.invoke;
        if (!core) {
            throw new Error("desktop shell: Tauri bridge not available; run inside the shell");
        }
        return core("mj_dispatch", { appId: currentAppId(), method, params });
    });
}
