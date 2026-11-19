import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginBrowserPkceRedirect,
  consumeStoredPkceEnvelope,
  createCallbackDeduplicator,
  extractOAuthCallbackParams,
  sanitizeRedirectPath,
} from "./oidc-client.js";

describe("core oidc-client helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sanitizes redirect paths against protocol-relative open redirects", () => {
    expect(sanitizeRedirectPath("/mission-control", "/")).toBe("/mission-control");
    expect(sanitizeRedirectPath("//evil.example", "/safe")).toBe("/safe");
    expect(sanitizeRedirectPath("https://evil.example", "/safe")).toBe("/safe");
  });

  it("extracts callback parameters and rejects OAuth error responses", () => {
    expect(extractOAuthCallbackParams(new URLSearchParams({ code: "c1", state: "s1" }))).toEqual({
      code: "c1",
      state: "s1",
    });
    const onError = vi.fn();
    expect(() =>
      extractOAuthCallbackParams(new URLSearchParams({ error: "access_denied" }), { onError }),
    ).toThrow("access_denied");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("persists and consumes browser PKCE state cleanly", async () => {
    const store = new Map<string, string>();
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://moonwitness.biz.id", assign },
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });

    const begun = await beginBrowserPkceRedirect({
      issuerUrl: "https://id.moonwitness.biz.id",
      clientId: "moonwitness-web",
      redirectUri: "https://moonwitness.biz.id/auth/callback",
      storageKey: "test_pkce",
      nextPath: "/dock",
    });
    expect(assign).toHaveBeenCalledTimes(1);

    const envelope = consumeStoredPkceEnvelope("test_pkce", begun.state);
    expect(envelope.verifier).toBe(begun.verifier);
    expect(envelope.nextPath).toBe("/dock");
    expect(store.size).toBe(0);
  });

  it("deduplicates concurrent callback invocations by key", async () => {
    const dedupe = createCallbackDeduplicator<string>();
    const work = vi.fn(async () => "ok");
    const [a, b] = await Promise.all([dedupe("k1", work), dedupe("k1", work)]);
    expect(a).toBe("ok");
    expect(b).toBe("ok");
    expect(work).toHaveBeenCalledTimes(1);
  });
});
