// Invoke one contract method by its `mj.<ns>.<member>` name through the SDK
// proxy. Names outside the capability surface are rejected before dispatch.

import { mj } from "@my-jarvis/sdk";

type Caller = (args?: Record<string, unknown>) => Promise<unknown>;

export async function callMj(method: string, params: Record<string, unknown>): Promise<unknown> {
    const parts = method.split(".");
    if (parts.length !== 3 || parts[0] !== "mj") {
        throw new Error(`invalid method name: ${method}`);
    }
    const surface = mj as unknown as Record<string, Record<string, Caller>>;
    const caller = surface[parts[1]]?.[parts[2]];
    if (!caller) {
        throw new Error(`method not in capability contract: ${method}`);
    }
    return caller(params);
}
