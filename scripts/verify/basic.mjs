// 示例用户代码（`jarvis:*` 规范形态）：migrate ×2 → query → sms。
// 确定性验收引擎在闭源 MJ-Cloud（`mj-verify` 消费本场景并断言
// db:migrate,db:migrate,db:query,sms:send 序列）；开源侧用 @my-jarvis/testing 的
// mock 或 jarvis-sandbox 的 mock Dispatcher 即可跑同款代码。
import {migrate, query} from "jarvis:db";
import {send} from "jarvis:sms";

await migrate({sql: "CREATE TABLE ping(msg TEXT)"});
await migrate({sql: "INSERT INTO ping VALUES ('ok')"});
const rows = await query({sql: "SELECT msg FROM ping"});
if (rows[0].msg !== "ok") {
    throw new Error("unexpected row");
}
await send({to: "+100", text: rows[0].msg});
