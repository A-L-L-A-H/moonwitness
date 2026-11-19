import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MoonwitnessApiError,
  TENANT_STORAGE_KEY,
  buildCsrfLogoutInit,
  createMoonwitnessClient,
  getActiveTenantFromStorage,
  requestApiJson,
  requestApiResponse,
} from "./client";

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("moonwitness sdk transport", () => {
  it("returns parsed JSON and includes credentials", async () => {
    const fn = mockFetch({ ok: 1 });
    await expect(requestApiJson<{ ok: number }>("/api/v1/x")).resolves.toEqual({ ok: 1 });
    expect(fn).toHaveBeenCalledWith(
      "/api/v1/x",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("throws MoonwitnessApiError with status and message", async () => {
    mockFetch({ error: "nope", code: "E1" }, 403);
    await expect(requestApiJson("/api/v1/x")).rejects.toMatchObject({
      name: "MoonwitnessApiError",
      status: 403,
      message: "nope",
      code: "E1",
    });
    expect(new MoonwitnessApiError("m", 500)).toBeInstanceOf(Error);
  });

  it("builds minimal logout init without csrf cookie", () => {
    expect(buildCsrfLogoutInit()).toEqual({ method: "POST", credentials: "include" });
  });

  it("routes meta and model resources through one client", async () => {
    const fn = mockFetch({ data: [] });
    const sdk = createMoonwitnessClient("/api/v1");
    await sdk.meta.getViewDescriptor("timeline.event");
    await sdk.model("timeline.event").list({
      q: "lunar",
      limit: 10,
      offset: 20,
      orderBy: "-id",
      includeDeleted: true,
    });
    await sdk.model("timeline.event").history("a b");
    const urls = fn.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(urls).toEqual([
      "/api/v1/_meta/views/timeline.event",
      "/api/v1/m/timeline.event?q=lunar&limit=10&offset=20&orderBy=-id&includeDeleted=true",
      "/api/v1/m/timeline.event/a%20b/history",
    ]);
  });

  it("omits headers when neither init.headers, csrf, nor non-default tenant exist", async () => {
    const fn = mockFetch({ ok: 1 });
    await requestApiResponse("/api/v1/auth/me", { credentials: "include" });
    expect(fn).toHaveBeenCalledWith("/api/v1/auth/me", { credentials: "include" });
  });

  it("injects x-tenant-id when mw_active_tenant is set, skips default/absent, and preserves explicit override", async () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
    });
    const fn = mockFetch({ ok: 1 });

    const getInit = (index: number) =>
      (fn.mock.calls[index] as unknown as [string, RequestInit])[1];

    expect(getActiveTenantFromStorage()).toBeNull();
    await requestApiResponse("/api/v1/items");
    expect(getInit(0)).toEqual({ credentials: "include" });

    store.set(TENANT_STORAGE_KEY, "default");
    expect(getActiveTenantFromStorage()).toBeNull();
    await requestApiResponse("/api/v1/items");
    expect(getInit(1)).toEqual({ credentials: "include" });

    store.set(TENANT_STORAGE_KEY, "sanctuary-hq");
    expect(getActiveTenantFromStorage()).toBe("sanctuary-hq");
    await requestApiResponse("/api/v1/items");
    expect(getInit(2)).toEqual({
      credentials: "include",
      headers: { "x-tenant-id": "sanctuary-hq" },
    });

    await requestApiResponse("/api/v1/items", {
      headers: { "X-Tenant-Id": "override-tenant" },
    });
    expect(getInit(3)).toEqual({
      credentials: "include",
      headers: { "X-Tenant-Id": "override-tenant" },
    });
  });

  it("routes rpc.call through /rpc with JSON payload", async () => {
    const fn = mockFetch({ result: { verified: true } });
    const sdk = createMoonwitnessClient("/api/v1");
    const res = await sdk.rpc.call<{ verified: boolean }>({
      model: "witness.claim",
      method: "verify_claim",
      id: "claim-1",
      kwargs: { reason: "confirmed" },
    });

    expect(res).toEqual({ result: { verified: true } });
    expect(fn).toHaveBeenCalledWith("/api/v1/rpc", {
      credentials: "include",
      cache: "no-store",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "witness.claim",
        method: "verify_claim",
        id: "claim-1",
        kwargs: { reason: "confirmed" },
      }),
    });
  });

  it("requestApiJson preserves Headers instances, tuple arrays, and X-Tenant-Id override on string body", async () => {
    const store = new Map<string, string>([[TENANT_STORAGE_KEY, "storage-tenant"]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
    });
    const fn = mockFetch({ ok: true });
    const getHeaders = (index: number) =>
      (fn.mock.calls[index] as unknown as [string, RequestInit])[1].headers as Record<
        string,
        string
      >;

    await requestApiJson("/api/v1/test", {
      method: "POST",
      body: JSON.stringify({ x: 1 }),
      headers: new Headers({ "X-Tenant-Id": "custom", "X-Trace": "t1" }),
    });
    expect(getHeaders(0)).toEqual({
      "x-tenant-id": "custom",
      "x-trace": "t1",
      "content-type": "application/json",
    });

    await requestApiJson("/api/v1/test", {
      method: "POST",
      body: JSON.stringify({ x: 2 }),
      headers: [
        ["X-Tenant-Id", "custom"],
        ["X-Trace", "t2"],
      ],
    });
    expect(getHeaders(1)).toEqual({
      "X-Tenant-Id": "custom",
      "X-Trace": "t2",
      "content-type": "application/json",
    });

    await requestApiJson("/api/v1/test", {
      method: "POST",
      body: "plain-text",
      headers: new Headers({ "Content-Type": "text/plain", "X-Trace": "t3" }),
    });
    expect(getHeaders(2)).toEqual({
      "content-type": "text/plain",
      "x-trace": "t3",
      "x-tenant-id": "storage-tenant",
    });
  });

  it("requestApiResponse deduplicates mixed-case x-csrf-token headers when injecting mw_csrf", async () => {
    vi.stubGlobal("document", { cookie: "mw_csrf=cookie-csrf" });
    const fn = mockFetch({ ok: true });
    const getHeaders = (index: number) =>
      (fn.mock.calls[index] as unknown as [string, RequestInit])[1].headers as Record<
        string,
        string
      >;

    await requestApiResponse("/api/v1/test", {
      method: "POST",
      headers: { "X-CSRF-Token": "stale-csrf", "X-Trace": "t1" },
    });
    expect(getHeaders(0)).toEqual({
      "X-Trace": "t1",
      "x-csrf-token": "cookie-csrf",
    });
    expect(Object.keys(getHeaders(0)).filter((k) => k.toLowerCase() === "x-csrf-token")).toEqual([
      "x-csrf-token",
    ]);
  });
});
