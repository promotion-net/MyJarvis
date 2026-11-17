/**
 * Authoring-surface types for the `jarvis:*` host modules.
 * The sandbox injects these at runtime; this package only declares the types —
 * no extra runtime package is required. The registry derives from the capability
 * catalog: any specifier absent from the catalog raises ERR_UNKNOWN_HOST_MODULE.
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

declare module "jarvis:agent" {
    export function turn(
        input: import("./index.js").AgentTurnInput,
    ): Promise<import("./index.js").AgentTurnResult>;

    const _default: { turn: typeof turn };
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
    /** A frozen merge of every `jarvis:*` domain namespace; not an independent capability source. */
    export const mj: import("./index.js").MjApi;
    const _default: import("./index.js").MjApi;
    export default _default;
}

declare module "jarvis:global" {
    /** Side-effect import: installs the frozen `mj` on globalThis. Never injected by default. */
    export {};
}
