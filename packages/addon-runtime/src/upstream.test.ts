import { afterEach, describe, expect, it } from "vitest";
import {
  buildChildTraceparent,
  getDisabledOptionalOpsErrorPayload,
  getEdgeLoopbackErrorPayload,
  getUpstreamBridgeHeaders,
  isBlockedRuntimeHost,
  isOptionalOpsServiceEnabled,
  probeOptionalOpsServices,
  resolveTraceContext,
  validateServiceEndpointUrl,
} from "./upstream.js";

describe("addon-runtime upstream & trace helpers", () => {
  const prevDbUrl = process.env.DATABASE_URL;
  const prevBridgeToken = process.env.BRIDGE_SHARED_TOKEN;

  afterEach(() => {
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevBridgeToken === undefined) delete process.env.BRIDGE_SHARED_TOKEN;
    else process.env.BRIDGE_SHARED_TOKEN = prevBridgeToken;
  });

  it("blocks cloud metadata and non-routable IP ranges", () => {
    expect(isBlockedRuntimeHost("169.254.169.254")).toBe(true);
    expect(isBlockedRuntimeHost("10.0.0.5")).toBe(true);
    expect(isBlockedRuntimeHost("::1")).toBe(true);
    expect(isBlockedRuntimeHost("api.moonwitness.biz.id")).toBe(false);
  });

  it("validates service endpoint URLs strictly", () => {
    expect(
      validateServiceEndpointUrl("http://169.254.169.254/", "MEMORY_API_URL", false).length,
    ).toBeGreaterThan(0);
    expect(validateServiceEndpointUrl("http://127.0.0.1:8000", "MEMORY_API_URL", false)).toEqual(
      [],
    );
    expect(
      validateServiceEndpointUrl("https://ai.moonwitness.biz.id/v1", "RIOT_AI_BASE_URL", true),
    ).toEqual([]);
  });

  it("returns edge loopback error payload in Cloudflare Workers runtime", () => {
    process.env.DATABASE_URL = "d1:moonwitness";
    expect(getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", "http://127.0.0.1:8787")).toMatchObject({
      reachable: false,
      configured: false,
      mode: "cloudflare-edge",
    });
    expect(
      getEdgeLoopbackErrorPayload("arsy", "ARSY_URL", "https://arsy.moonwitness.biz.id"),
    ).toBeNull();
  });

  it("propagates W3C child traceparent and bridge shared token", () => {
    process.env.BRIDGE_SHARED_TOKEN = "bridge-secret";
    const ctx = resolveTraceContext("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
    const child = buildChildTraceparent(ctx);
    expect(child).toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);

    const headers = getUpstreamBridgeHeaders(
      { accept: "application/json" },
      {
        id: "req-42",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
    );
    expect(headers["x-moonwitness-bridge-token"]).toBe("bridge-secret");
    expect(headers["x-request-id"]).toBe("req-42");
    expect(headers.traceparent).toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
    expect(headers.traceparent).not.toBe("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
  });

  it("evaluates optional ops feature flags and probes enabled services cleanly", async () => {
    expect(isOptionalOpsServiceEnabled("radius", {})).toBe(true);
    expect(isOptionalOpsServiceEnabled("radius", { MW_OPS_ENABLED: "0" })).toBe(false);
    expect(
      isOptionalOpsServiceEnabled("radius", { MW_OPS_ENABLED: "0", MW_OPS_RADIUS_ENABLED: "1" }),
    ).toBe(true);
    expect(isOptionalOpsServiceEnabled("snmp", { MW_ADDON_SNMP_DISABLED: "1" })).toBe(false);
    expect(getDisabledOptionalOpsErrorPayload("radius", { MW_OPS_RADIUS_ENABLED: "0" })).toEqual({
      error: "SERVICE_DISABLED",
      service: "radius",
      enabled: false,
    });
    expect(getDisabledOptionalOpsErrorPayload("radius", {})).toBeNull();

    const summary = await probeOptionalOpsServices({
      envSource: {
        MW_OPS_RADIUS_ENABLED: "1",
        MW_OPS_SNMP_ENABLED: "0",
        MW_OPS_SYSLOG_ENABLED: "1",
        MW_OPS_STORAGE_ENABLED: "0",
      },
      fetchImpl: (async (url: string | URL | Request) => {
        const href = String(url);
        if (href.includes("8090")) return new Response("ok", { status: 200 });
        return new Response("down", { status: 503 });
      }) as typeof fetch,
      timeoutMs: 250,
    });
    expect(summary).toEqual({
      radius: { enabled: true, status: "healthy" },
      snmp: { enabled: false, status: "disabled" },
      syslog: { enabled: true, status: "unhealthy" },
      storage: { enabled: false, status: "disabled" },
    });
  });
});
