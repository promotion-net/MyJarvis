/**
 * `@my-jarvis/testing` — mock `mj.*` 与确定性场景断言。
 * 只依赖 `@my-jarvis/types` 契约，不依赖 `@my-jarvis/sdk` 的运行时实现。
 */
import type {MjApi} from "@my-jarvis/types";

export interface MockCall {
    method: string;
    params: Record<string, unknown>;
}

/**
 * 构造 mock `mj`：`replies` 以完整方法名（如 `mj.db.query`）为键给出返回值；
 * 未配置的能力调用直接抛错，保证越界可见。
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

/** 断言能力调用序列（完整方法名，按发生顺序精确匹配）。 */
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
