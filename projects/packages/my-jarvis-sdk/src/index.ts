/**
 * `@my-jarvis/sdk` — proxy stubs only, no implementation of any kind.
 *
 * The host runtime injects the real channel through `installMjTransport`; no
 * direct-to-vendor path can exist inside this package. semver binds strictly to
 * the `@my-jarvis/types` capability contract.
 */
import type {MjApi} from "@my-jarvis/types";

export type MjTransport = (
    method: string,
    params: Record<string, unknown>,
) => Promise<unknown>;

let transport: MjTransport | null = null;

/** Runtime injection point: hosts (sandbox prelude / tests) call this before loading user code. */
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
