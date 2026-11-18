import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MoonwitnessApiError,
  buildCsrfLogoutInit,
  createMoonwitnessClient,
  requestApiJson,
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
    await sdk.model("timeline.event").history("a b");
    const urls = fn.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(urls).toEqual([
      "/api/v1/_meta/views/timeline.event",
      "/api/v1/m/timeline.event/a%20b/history",
    ]);
  });
});
