import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

/**
 * The auth middleware is mocked per-test with `vi.doMock` rather than at module
 * scope, so the authorization test exercises the real `requireRole` gate that
 * the routes install instead of a no-op stub.
 */
async function loadRoutes(allowWrite: boolean) {
  vi.doMock("../../middleware/auth", () => ({
    requireAuth: () => async () => {},
    requireRole: () =>
      allowWrite
        ? async () => {}
        : async (
            _request: unknown,
            reply: { code: (status: number) => { send: (body: unknown) => unknown } },
          ) => {
            reply.code(403).send({ error: "Forbidden: insufficient permissions" });
          },
  }));
  vi.resetModules();
  const module = await import("./snmp-poller.routes");
  return module.snmpPollerRoutes;
}

describe("SNMP poller proxy", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
    vi.unstubAllGlobals();
    vi.doUnmock("../../middleware/auth");
  });

  it("redacts nested community and credential fields from upstream JSON", async () => {
    const routes = await loadRoutes(true);
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
    await app.register(routes);
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/snmp/devices" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: "device-1",
      targets: [{ name: "sysName", value: "router" }],
    });
  });

  it("rejects device creation when the role gate denies the caller", async () => {
    const routes = await loadRoutes(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    app = Fastify({ logger: false });
    await app.register(routes);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/snmp/devices",
      payload: { name: "rogue", host: "192.0.2.1" },
    });

    expect(response.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects target deletion when the role gate denies the caller", async () => {
    const routes = await loadRoutes(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    app = Fastify({ logger: false });
    await app.register(routes);
    await app.ready();

    const response = await app.inject({
      method: "DELETE",
      url: "/snmp/targets/target-1",
    });

    expect(response.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
