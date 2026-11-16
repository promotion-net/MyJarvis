import assert from "node:assert/strict";
import test from "node:test";

import {assertCallSequence, createMockMj} from "../dist/index.js";

test("mock mj records the deterministic call sequence", async () => {
    const {mj, calls} = createMockMj({
        "mj.db.migrate": {applied: true},
        "mj.db.query": [{msg: "ok"}],
        "mj.sms.send": {provider: "mock", messageId: "mock-000001"},
    });

    await mj.db.migrate({sql: "CREATE TABLE ping(msg TEXT)"});
    const rows = await mj.db.query({sql: "SELECT msg FROM ping"});
    await mj.sms.send({to: "+100", text: rows[0].msg});

    assertCallSequence(calls, [
        "mj.db.migrate",
        "mj.db.query",
        "mj.sms.send",
    ]);
});

test("unconfigured capability call surfaces as an error", async () => {
    const {mj} = createMockMj();
    await assert.rejects(() => mj.sms.send({to: "+1", text: "x"}), /no reply configured/);
});
