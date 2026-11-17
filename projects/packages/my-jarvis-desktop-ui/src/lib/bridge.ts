// Shell-side transport bridge: every `mj.*` call is forwarded through the WAE
// host IPC channel to the loopback runtime gateway. Outside the shell the
// transport fails explicitly — the surface never fakes local execution.

import { installMjTransport } from "@my-jarvis/sdk";

const APP_ID_KEY = "mj.shell.appId";

interface WaeWebViewBridge {
    postMessage(payload: string): void;
    addEventListener?(type: "message", listener: (event: { data: unknown }) => void): void;
}

interface WaeWebkitBridge {
    postMessage(payload: string): void;
}

interface WaeScope {
    chrome?: { webview?: WaeWebViewBridge };
    webkit?: { messageHandlers?: { wae?: WaeWebkitBridge } };
    __waeReceive?: (text: string) => void;
}

type Pending = {
    resolve(value: unknown): void;
    reject(error: Error): void;
};

const pending = new Map<string, Pending>();
let wired = false;
let nextId = 1;

function scope(): WaeScope {
    return globalThis as WaeScope;
}

function hostBridge(): WaeWebViewBridge | null {
    const bridge = scope().chrome?.webview;
    return bridge && typeof bridge.postMessage === "function" ? bridge : null;
}

function webkitBridge(): WaeWebkitBridge | null {
    return scope().webkit?.messageHandlers?.wae ?? null;
}

function handleReply(raw: unknown): void {
    let data: any = raw;
    if (typeof raw === "string") {
        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }
    }
    if (!data || typeof data !== "object" || typeof data.id !== "number") return;
    const waiter = pending.get(String(data.id));
    if (!waiter) return;
    pending.delete(String(data.id));
    if (data.ok === true) {
        waiter.resolve(data.result !== undefined ? data.result : (data.data ?? null));
        return;
    }
    const failure = data.error;
    waiter.reject(new Error(typeof failure === "string" ? failure : "shell request failed"));
}

/** Install the reply listeners once; WAE hosts push replies through one of two channels. */
function ensureBridge(): boolean {
    const bridge = hostBridge();
    const webkit = webkitBridge();
    if (!bridge && !webkit) return false;
    if (!wired) {
        wired = true;
        if (bridge && typeof bridge.addEventListener === "function") {
            bridge.addEventListener("message", (event) => handleReply(event.data));
        }
        scope().__waeReceive = (text) => {
            try {
                handleReply(JSON.parse(text));
            } catch {
                // Ignore malformed host messages.
            }
        };
    }
    return true;
}

function send(type: string, extra: Record<string, unknown> = {}): Promise<unknown> {
    if (!ensureBridge()) {
        return Promise.reject(new Error("desktop shell: WAE bridge not available; run inside the shell"));
    }
    const id = nextId++;
    const payload = JSON.stringify({ id, type, ...extra });
    return new Promise<unknown>((resolve, reject) => {
        pending.set(String(id), { resolve, reject });
        const bridge = hostBridge();
        if (bridge) {
            bridge.postMessage(payload);
            return;
        }
        const webkit = webkitBridge();
        if (webkit) {
            webkit.postMessage(payload);
            return;
        }
        pending.delete(String(id));
        reject(new Error("desktop shell: WAE bridge not available; run inside the shell"));
    });
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
    return send("dispatch", { appId: currentAppId(), method, params });
}

export interface RuntimeHealth {
    ok: boolean;
    status: number;
    base: string;
    detail: string;
}

/** Loopback runtime probe; never throws so the shell can render offline honestly. */
export async function runtimeHealth(): Promise<RuntimeHealth> {
    try {
        const raw = (await send("health")) as Partial<RuntimeHealth> | null;
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

/** Window chrome actions handled by the WAE host. */
export function windowCommand(command: "minimize" | "toggleMaximize" | "close"): Promise<unknown> {
    return send("window." + command);
}

export interface DragRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Frameless window: hand the host the draggable rects of the custom title bar. */
export function windowDragRegions(rects: DragRegion[]): Promise<unknown> {
    return send("window.dragRegions", { rects });
}

export function installShellTransport(): void {
    installMjTransport((method, params) => invokeDispatch(method, params));
}
