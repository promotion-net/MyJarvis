/**
 * `@my-jarvis/testing` — mock `mj.*` and deterministic scenario assertions.
 * Depends only on the `@my-jarvis/types` contract, never on `@my-jarvis/sdk` runtime behavior.
 */
import type {MjApi} from "@my-jarvis/types";

export interface MockCall {
    method: string;
    params: Record<string, unknown>;
}

/**
 * Builds a mock `mj`: `replies` keys are full method names (e.g. `mj.db.query`)
 * mapping to return values; unconfigured calls throw immediately so any
 * out-of-band usage stays visible.
 */
export function createMockMj(
    replies: Record<string, unknown> = {},
): { mj: MjApi; calls: MockCall[] } {
    const calls: MockCall[] = [];

    const handler =
        (method: string) =>
            async (params: Record<string, unknown> = {}): Promise<unknown> => {
                calls.push({method, params});
                if (method in replies) {
                    return replies[method];
                }
                throw new Error(`mock mj: no reply configured for ${method}`);
            };

    const namespace = (name: string) =>
        new Proxy(
            {},
            {
                get(_target, member) {
                    return handler(`mj.${name}.${String(member)}`);
                },
            },
        );

    const mj = new Proxy(
        {},
        {
            get(_target, name) {
                return namespace(String(name));
            },
        },
    ) as MjApi;

    return {mj, calls};
}

/** Asserts the capability call sequence (full method names, exact order match). */
export function assertCallSequence(
    calls: readonly MockCall[],
    expected: readonly string[],
): void {
    const actual = calls.map((call) => call.method);
    const same =
        actual.length === expected.length && actual.every((m, i) => m === expected[i]);
    if (!same) {
        throw new Error(
            `call sequence mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
    }
}
