/**
 * 宿主模块 `jarvis:*` 的作者面类型（合同见 `03-宿主模块命名空间.md`）。
 * 运行时由沙箱注入，类型由本包声明——不需要额外运行时包。
 * 注册表从能力目录派生：目录里没有的 specifier 一律 ERR_UNKNOWN_HOST_MODULE。
 */

declare module "jarvis:backend" {
    export function provision(
        input: import("./index.js").ProvisionInput,
    ): Promise<import("./index.js").ProvisionResult>;

    const _default: { provision: typeof provision };
    export default _default;
}

declare module "jarvis:db" {
    export function migrate(
        input: import("./index.js").MigrateInput,
    ): Promise<import("./index.js").MigrateResult>;

    export function query(
        input: import("./index.js").QueryInput,
    ): Promise<import("./index.js").Row[]>;

    const _default: { migrate: typeof migrate; query: typeof query };
    export default _default;
}

declare module "jarvis:llm" {
    export function complete(
        input: import("./index.js").LlmCompleteInput,
    ): Promise<import("./index.js").LlmCompleteResult>;

    const _default: { complete: typeof complete };
    export default _default;
}

declare module "jarvis:server" {
    export function route(
        input: import("./index.js").RouteInput,
    ): Promise<import("./index.js").RouteResult>;

    const _default: { route: typeof route };
    export default _default;
}

declare module "jarvis:sms" {
    export function send(
        input: import("./index.js").SmsSendInput,
    ): Promise<import("./index.js").SmsReceipt>;

    const _default: { send: typeof send };
    export default _default;
}

declare module "jarvis" {
    /** 各 `jarvis:*` 域命名空间的冻结合并视图，不是独立能力来源。 */
    export const mj: import("./index.js").MjApi;
    const _default: import("./index.js").MjApi;
    export default _default;
}

declare module "jarvis:global" {
    /** 副作用导入：把冻结的 `mj` 注入 globalThis。默认不注入。 */
    export {};
}
