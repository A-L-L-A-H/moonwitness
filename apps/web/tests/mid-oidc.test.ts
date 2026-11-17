import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredMidSession,
  completeMidCallback,
  getStoredMidAccessToken,
  startMidLogin,
} from "../src/lib/mid-oidc";

describe("mid-oidc PKCE BFF helper", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { origin: "https://moonwitness.biz.id", assign: vi.fn() },
        sessionStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, val: string) => {
            store.set(key, val);
          },
          removeItem: (key: string) => {
            store.delete(key);
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("initiates PKCE authorization redirect, exchanges code via BFF, and stores zero tokens in sessionStorage", async () => {
    await startMidLogin("/mission-control");
    const assignMock = window.location.assign as ReturnType<typeof vi.fn>;
    expect(assignMock).toHaveBeenCalledTimes(1);
    const redirectTarget = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(redirectTarget.origin).toBe("https://id.moonwitness.biz.id");
    expect(redirectTarget.pathname).toBe("/authorize");
    expect(redirectTarget.searchParams.get("client_id")).toBe("moonwitness-web");
    expect(redirectTarget.searchParams.get("code_challenge_method")).toBe("S256");
    expect(store.has("mw_mid_pkce")).toBe(true);

    const returnedState = redirectTarget.searchParams.get("state") ?? "";
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              id: 1,
              username: "admin",
              email: "admin@moonwitness.biz.id",
              role: "admin",
              displayName: "Admin",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const destination = await completeMidCallback(
      new URLSearchParams({ code: "mwc_test", state: returnedState }),
    );
    expect(destination).toBe("/mission-control");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] ?? [];
    expect(calledUrl).toBe("/api/v1/auth/bff/exchange");
    expect(calledInit?.method).toBe("POST");
    expect(calledInit?.credentials).toBe("include");
    const sentBody = JSON.parse(String(calledInit?.body)) as Record<string, string>;
    expect(sentBody).toMatchObject({
      code: "mwc_test",
      redirect_uri: "https://moonwitness.biz.id/auth/callback",
      client_id: "moonwitness-web",
    });
    expect(typeof sentBody.code_verifier).toBe("string");
    expect((sentBody.code_verifier ?? "").length).toBeGreaterThan(20);

    // Ephemeral PKCE state must be cleared and zero OAuth tokens stored in sessionStorage.
    expect(store.size).toBe(0);
    expect(getStoredMidAccessToken()).toBeNull();

    clearStoredMidSession();
    expect(getStoredMidAccessToken()).toBeNull();
  });

  it("fails closed when the BFF exchange rejects and sanitizes protocol-relative nextPath", async () => {
    await startMidLogin("//evil.example/steal");
    const assignMock = window.location.assign as ReturnType<typeof vi.fn>;
    const redirectTarget = new URL(assignMock.mock.calls[0]?.[0] as string);
    const returnedState = redirectTarget.searchParams.get("state") ?? "";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      completeMidCallback(new URLSearchParams({ code: "bad_code", state: returnedState })),
    ).rejects.toThrow(/invalid_grant/i);
    expect(store.size).toBe(0);

    // Verify open-redirect protection on nextPath even when BFF succeeds.
    await startMidLogin("//evil.example/steal");
    const redirectTarget2 = new URL(assignMock.mock.calls[1]?.[0] as string);
    const state2 = redirectTarget2.searchParams.get("state") ?? "";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            authenticated: true,
            user: { id: 1, username: "admin", role: "admin" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const destination = await completeMidCallback(
      new URLSearchParams({ code: "good_code", state: state2 }),
    );
    expect(destination).toBe("/mission-control");
    expect(store.size).toBe(0);
  });
});
