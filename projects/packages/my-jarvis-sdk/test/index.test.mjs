import assert from "node:assert/strict";
import test from "node:test";

import {installMjTransport, mj} from "../dist/index.js";

test("mj proxies every call to the installed transport", async () => {
    const seen = [];
    installMjTransport(async (method, params) => {
        seen.push([method, params]);
        return [{answer: 2}];
    });

    const rows = await mj.db.query({sql: "SELECT 1 + 1 AS answer"});
    assert.deepEqual(rows, [{answer: 2}]);
    assert.deepEqual(seen, [["mj.db.query", {sql: "SELECT 1 + 1 AS answer"}]]);
});

test("without transport the stub refuses instead of connecting anywhere", async () => {
    installMjTransport(null);
    await assert.rejects(() => mj.sms.send({to: "+1", text: "x"}), /no runtime transport/);
});
