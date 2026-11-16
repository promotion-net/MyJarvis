/**
 * `@my-jarvis/types` — the single type source of the MyJarvis capability contract.
 *
 * The main entry has zero runtime dependencies: agent-generated code reads only
 * from here; `mj schema`, verification reports and MCP tool definitions all
 * derive from this contract. The contract namespace is fixed at `/v0`.
 * Ambient `jarvis:*` host-module types for the sandbox authoring surface live in `jarvis.d.ts`.
 */
/// <reference path="./jarvis.d.ts" />

export const CONTRACT_VERSION = "/v0";

export type CapabilityId =
    | "backend:provision"
    | "db:migrate"
    | "db:query"
    | "server:route"
    | "llm:complete"
    | "sms:send";

/** L1 capability tier: visible to users, the backing vendor is not. */
export type LlmProfile = "fast" | "balanced" | "reasoning";

/**
 * Disclosure levels: L0 fully opaque (default; SMS/CDN are always L0), L1 tier,
 * L2 model family, L3 exact version. No level ever exposes vendor identity,
 * credentials or unit prices.
 */
export type DisclosureLevel = "l0" | "l1" | "l2" | "l3";

export interface Capability {
    id: CapabilityId;
    summary: string;
    inputSchema: unknown;
    metered: boolean;
}

/** The current `/v0` capability catalog (kept in lockstep with `jarvis-core`). */
export const CAPABILITIES: readonly Capability[] = [
    {
        id: "backend:provision",
        summary: "Provision a loopback port and a dedicated SQLite file for an app",
        inputSchema: {
            type: "object",
            properties: {name: {type: "string"}},
            required: ["name"],
            additionalProperties: false,
        },
        metered: true,
    },
    {
        id: "db:migrate",
        summary: "Run a migration against the app's dedicated database",
        inputSchema: {
            type: "object",
            properties: {sql: {type: "string"}},
            required: ["sql"],
            additionalProperties: false,
        },
        metered: true,
    },
    {
        id: "db:query",
        summary: "Run a read-only query against the app's dedicated database",
        inputSchema: {
            type: "object",
            properties: {
                sql: {type: "string"},
                params: {type: "array", items: {type: ["string", "number", "boolean", "null"]}},
            },
            required: ["sql"],
            additionalProperties: false,
        },
        metered: true,
    },
    {
        id: "server:route",
        summary: "Register an app route on the runtime reverse proxy",
        inputSchema: {
            type: "object",
            properties: {
                path: {type: "string"},
                upstreamPort: {type: "integer", minimum: 1, maximum: 65535},
            },
            required: ["path"],
            additionalProperties: false,
        },
        metered: true,
    },
    {
        id: "llm:complete",
        summary:
            "Complete one LLM call through the provider proxy; defaults to L0/L1 (tier), L2/L3 (pinned model family/version) require authorization",
        inputSchema: {
            type: "object",
            properties: {
                messages: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            role: {type: "string", enum: ["system", "user", "assistant"]},
                            content: {type: "string"},
                        },
                        required: ["role", "content"],
                        additionalProperties: false,
                    },
                },
                profile: {type: "string", enum: ["fast", "balanced", "reasoning"]},
                model: {
                    type: "string",
                    description:
                        "L2/L3 pin: a closed model family or version id, driven by the runtime capability catalog; calls are rejected without llm:pin authorization",
                },
                maxTokens: {type: "integer", minimum: 1},
            },
            required: ["messages"],
            additionalProperties: false,
        },
        metered: true,
    },
    {
        id: "sms:send",
        summary: "Send one SMS message through the provider proxy",
        inputSchema: {
            type: "object",
            properties: {to: {type: "string"}, text: {type: "string"}},
            required: ["to", "text"],
            additionalProperties: false,
        },
        metered: true,
    },
] as const;

export type BindParam = string | number | boolean | null;
export type Row = Record<string, BindParam>;

export interface ProvisionInput {
    name: string;
}

export interface ProvisionResult {
    name: string;
    port: number;
}

export interface MigrateInput {
    sql: string;
}

export interface MigrateResult {
    applied: true;
}

export interface QueryInput {
    sql: string;
    params?: BindParam[];
}

export interface RouteInput {
    path: string;
    upstreamPort?: number;
}

export interface RouteResult {
    path: string;
    port: number;
}

export interface SmsSendInput {
    to: string;
    text: string;
}

export interface SmsReceipt {
    provider: string;
    messageId: string;
}

export interface LlmMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * `mj.llm.complete` input: L0/L1 use `profile` (defaults to balanced); L2/L3 use
 * `model` to pin a model family/version (a closed enum driven by the runtime
 * capability catalog, requiring `llm:pin` authorization). The two are mutually
 * exclusive and no vendor vocabulary ever appears in any shape.
 */
export interface LlmCompleteInput {
    messages: LlmMessage[];
    profile?: LlmProfile;
    model?: string;
    maxTokens?: number;
}

export interface LlmCompleteResult {
    text: string;
    usage: { input: number; output: number };
}

/** The full `mj.*` surface visible inside the sandbox. */
export interface MjApi {
    backend: {
        provision(input: ProvisionInput): Promise<ProvisionResult>;
    };
    db: {
        migrate(input: MigrateInput): Promise<MigrateResult>;
        query(input: QueryInput): Promise<Row[]>;
    };
    server: {
        route(input: RouteInput): Promise<RouteResult>;
    };
    llm: {
        complete(input: LlmCompleteInput): Promise<LlmCompleteResult>;
    };
    sms: {
        send(input: SmsSendInput): Promise<SmsReceipt>;
    };
}

/** A metering event for one controlled operation (schema only; pricing lives in the host). */
export interface MeterEvent {
    appId: string;
    capability: CapabilityId;
    quantity: number;
    disclosureLevel: DisclosureLevel;
    unit:
        | "cpu-seconds"
        | "memory-peak-bytes"
        | "disk-bytes"
        | "requests"
        | "db-queries"
        | "sms-messages"
        | "cdn-bytes"
        | "llm-tokens"
        | "delivery";
    timestampMs: number;
}
