/**
 * `@my-jarvis/sdk` — 只包含代理桩，不包含任何实现。
 *
 * 运行时由 `jarvis-runtime` 经 `installMjTransport` 注入真实通道；本包内
 * 不可能存在直连供应商的路径。semver 严格绑定 `@my-jarvis/types` 的能力契约。
 */
import type {MjApi} from "@my-jarvis/types";

export type MjTransport = (
    method: string,
    params: Record<string, unknown>,
) => Promise<unknown>;

let transport: MjTransport | null = null;

/** runtime 注入点：宿主（沙箱 prelude / 测试）在加载用户代码前调用。 */
export function installMjTransport(next: MjTransport | null): void {
    transport = next;
}

function call(
    method: string,
    args: Record<string, unknown> = {},
): Promise<unknown> {
    if (!transport) {
        return Promise.reject(new Error("@my-jarvis/sdk: no runtime transport installed"));
    }
    return transport(method, args);
}

function namespace(name: string): Record<string, unknown> {
    return new Proxy(
        {},
        {
            get(_target, member) {
                return (args?: Record<string, unknown>) =>
                    call(`mj.${name}.${String(member)}`, args);
            },
        },
    );
}

export const mj = new Proxy(
    {},
    {
        get(_target, name) {
            return namespace(String(name));
        },
    },
) as MjApi;
