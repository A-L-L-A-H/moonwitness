import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { snmpPollerRoutes } from "./snmp-poller.routes";

vi.mock("../../middleware/auth", () => ({
  requireAuth: () => async () => {},
  requireRole: () => async () => {},
}));

describe("SNMP poller proxy", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
    vi.unstubAllGlobals();
  });

  it("redacts nested community and credential fields from upstream JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "device-1",
            community: "private",
            targets: [{ name: "sysName", authPassword: "private", value: "router" }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    app = Fastify({ logger: false });
    await app.register(snmpPollerRoutes);
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/snmp/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: "device-1",
      targets: [{ name: "sysName", value: "router" }],
    });
  });
});
