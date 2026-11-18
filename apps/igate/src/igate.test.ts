import { describe, expect, it } from "vitest";
import { createIgateHandler } from "./app";

describe("@moonwitness/igate retirement stub", () => {
  it("reports retired status and directs callers to API probe routes", async () => {
    const handler = createIgateHandler();
    const health = await handler(new Request("https://igate.moonwitness.biz.id/health"), {});
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: "retired", replacement: "/api/v1/probes" });

    const api = await handler(new Request("https://igate.moonwitness.biz.id/api/status"), {});
    expect(api.status).toBe(410);
    expect(await api.json()).toMatchObject({ error: "igate_worker_retired" });
  });
});
