// Capability catalog for the left column, derived from the `@my-jarvis/types`
// contract so the surface can never drift ahead of the `/v0` catalog.

import { CAPABILITIES } from "@my-jarvis/types";

export interface CatalogEntry {
    method: string;
    capability: string;
    summary: string;
    template: Record<string, unknown>;
}

export interface CallLogRow {
    time: string;
    method: string;
    ok: boolean;
    message: string;
}

const TEMPLATES: Record<string, Record<string, unknown>> = {
    "backend:provision": { name: "demo-app" },
    "db:migrate": { sql: "CREATE TABLE IF NOT EXISTS note(text TEXT)" },
    "db:query": { sql: "SELECT 1 AS answer", params: [] },
    "server:route": { path: "/api" },
    "llm:complete": { messages: [{ role: "user", content: "Ping" }], profile: "fast" },
    "sms:send": { to: "+10000000000", text: "ping" },
};

export function catalog(): CatalogEntry[] {
    return CAPABILITIES.map((entry) => ({
        method: `mj.${entry.id.replace(":", ".")}`,
        capability: entry.id,
        summary: entry.summary,
        template: TEMPLATES[entry.id] ?? {},
    }));
}
