/**
 * `@my-jarvis/types` — MyJarvis 能力契约的唯一类型源。
 *
 * 主入口零运行时依赖：Agent 生成代码只读这里；`mj schema` / `mj verify`
 * 与 MCP tool 定义都从本契约派生。合同命名空间固定 `/v0`。
 * 沙箱作者面 `jarvis:*` 的宿主模块类型见 `jarvis.d.ts`（ambient）。
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

/** L1 能力档位：用户可见，供应商不可见。 */
export type LlmProfile = "fast" | "balanced" | "reasoning";

/**
 * 披露层级：L0 完全保密（默认；SMS/CDN 永远 L0）、L1 档位、L2 模型族、L3 精确版本。
 * 任何层级都不暴露供应商身份、凭证与单价。
 */
export type DisclosureLevel = "l0" | "l1" | "l2" | "l3";

export interface Capability {
    id: CapabilityId;
    summary: string;
    inputSchema: unknown;
    metered: boolean;
}

/** 当前 `/v0` 能力目录（与 jarvis-core 保持一致）。 */
export const CAPABILITIES: readonly Capability[] = [
    {
        id: "backend:provision",
        summary: "为应用分配 loopback 端口与专属 SQLite 文件",
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
        summary: "在应用专属数据库上执行迁移",
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
        summary: "在应用专属数据库上执行只读查询",
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
        summary: "在 runtime 反向代理上注册应用路由",
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
            "经 Provider 代理完成一次 LLM 调用；默认 L0/L1（档位），L2/L3（pin 模型族/版本）需授权",
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
                        "L2/L3 pin：封闭模型族或版本标识，由 runtime 能力目录驱动；未授权 llm:pin 时调用被拒绝",
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
        summary: "经 Provider 代理发送一条短信",
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
 * `mj.llm.complete` 输入：L0/L1 用 `profile`（缺省 balanced）；L2/L3 用 `model`
 * pin 模型族/版本（封闭枚举由 runtime 能力目录驱动，需要 `llm:pin` 授权）。
 * 两者互斥；任何形态都不出现供应商词汇。
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

/** 沙箱内可见的完整 `mj.*` 表面。 */
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

/** 一次受控操作的计量事件（schema 开源；定价折算在闭源 billing）。 */
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
