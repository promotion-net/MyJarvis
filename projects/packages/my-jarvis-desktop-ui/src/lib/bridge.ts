// Shell-side transport bridge: every `mj.*` call is forwarded through the
// Tauri `mj_dispatch` command to the loopback runtime gateway. Outside the
// shell the transport fails explicitly — the surface never fakes local execution.

import { installMjTransport } from "@my-jarvis/sdk";

const APP_ID_KEY = "mj.shell.appId";

type TauriInvoke = (command: string, args: Record<string, unknown>) => Promise<unknown>;

interface TauriWindowScope {
    __TAURI__?: { core?: { invoke?: TauriInvoke } };
}

function tauriInvoke(): TauriInvoke | null {
    const scope = globalThis as TauriWindowScope;
    const invoke = scope.__TAURI__?.core?.invoke;
    return typeof invoke === "function" ? invoke : null;
}

/** Shell session identity: stable per install, owned by the front end. */
export function currentAppId(): string {
    const existing = localStorage.getItem(APP_ID_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(APP_ID_KEY, fresh);
    return fresh;
}

/** One capability call through the shell bridge (single transport for the whole UI). */
export function invokeDispatch(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const invoke = tauriInvoke();
    if (!invoke) {
        return Promise.reject(new Error("desktop shell: Tauri bridge not available; run inside the shell"));
    }
    return invoke("mj_dispatch", { appId: currentAppId(), method, params });
}

export interface RuntimeHealth {
    ok: boolean;
    status: number;
    base: string;
    detail: string;
}

/** Loopback runtime probe; never throws so the shell can render offline honestly. */
export async function runtimeHealth(): Promise<RuntimeHealth> {
    const invoke = tauriInvoke();
    if (!invoke) {
        return { ok: false, status: 0, base: "", detail: "Tauri bridge not available" };
    }
    try {
        const raw = (await invoke("mj_health", {})) as Partial<RuntimeHealth> | null;
        return {
            ok: raw?.ok === true,
            status: Number(raw?.status || 0),
            base: String(raw?.base || ""),
            detail: String(raw?.detail || ""),
        };
    } catch (err) {
        return { ok: false, status: 0, base: "", detail: String(err) };
    }
}

export function installShellTransport(): void {
    installMjTransport((method, params) => invokeDispatch(method, params));
}
