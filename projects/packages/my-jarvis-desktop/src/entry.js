// Desktop shell frontend entry: installs the transport adapter.
// Until the Tauri command bridge lands, the transport fails explicitly and never fakes local execution.
import {installMjTransport} from "@my-jarvis/sdk";

installMjTransport(async (method, params) => {
    const invoke = globalThis.__TAURI__?.core?.invoke;
    if (!invoke) {
        throw new Error("desktop-shell: Tauri bridge not available; running outside the shell");
    }
    return invoke("mj_dispatch", {method, params});
});
