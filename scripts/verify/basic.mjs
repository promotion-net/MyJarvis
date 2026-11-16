// Example user code (canonical `jarvis:*` form): migrate x2 -> query -> sms.
// A deterministic verifier can consume this scenario and assert the exact
// sequence db:migrate, db:migrate, db:query, sms:send; the same code runs
// against @my-jarvis/testing mocks or a jarvis-sandbox mock Dispatcher.
import {migrate, query} from "jarvis:db";
import {send} from "jarvis:sms";

await migrate({sql: "CREATE TABLE ping(msg TEXT)"});
await migrate({sql: "INSERT INTO ping VALUES ('ok')"});
const rows = await query({sql: "SELECT msg FROM ping"});
if (rows[0].msg !== "ok") {
    throw new Error("unexpected row");
}
await send({to: "+100", text: rows[0].msg});
