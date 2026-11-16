// 桌面壳前端入口：安装 transport 适配器。
// Tauri 命令桥接入前，transport 显式失败，不伪造任何本地执行。
import {installMjTransport} from "@my-jarvis/sdk";

installMjTransport(async (method, params) => {
    const invoke = globalThis.__TAURI__?.core?.invoke;
    if (!invoke) {
        throw new Error("desktop-shell: Tauri bridge not available; running outside the shell");
    }
    return invoke("mj_dispatch", {method, params});
});
