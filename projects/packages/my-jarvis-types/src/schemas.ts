/**
 * Zod schema entry (optional `zod` dependency): the runtime-validation twin of
 * the `CAPABILITIES` JSON Schemas, for host-side input checking.
 */
import {z} from "zod";

const bindParam = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const provisionInputSchema = z
    .object({name: z.string()})
    .strict();

export const migrateInputSchema = z
    .object({sql: z.string()})
    .strict();

export const queryInputSchema = z
    .object({sql: z.string(), params: z.array(bindParam).optional()})
    .strict();

export const routeInputSchema = z
    .object({
        path: z.string(),
        upstreamPort: z.number().int().min(1).max(65535).optional(),
    })
    .strict();

export const smsSendInputSchema = z
    .object({to: z.string(), text: z.string()})
    .strict();

export const llmCompleteInputSchema = z
    .object({
        messages: z.array(
            z
                .object({
                    role: z.enum(["system", "user", "assistant"]),
                    content: z.string(),
                })
                .strict(),
        ),
        profile: z.enum(["fast", "balanced", "reasoning"]).optional(),
        model: z.string().optional(),
        maxTokens: z.number().int().min(1).optional(),
    })
    .strict();

export const agentTurnInputSchema = z
    .object({
        messages: z
            .array(
                z
                    .object({
                        role: z.enum(["system", "user", "assistant"]),
                        content: z.string(),
                    })
                    .strict(),
            )
            .min(1),
        profile: z.enum(["fast", "balanced", "reasoning"]).optional(),
        maxTokens: z.number().int().min(1).optional(),
    })
    .strict();

export const capabilityIdSchema = z.enum([
    "backend:provision",
    "db:migrate",
    "db:query",
    "server:route",
    "llm:complete",
    "agent:turn",
    "sms:send",
]);
