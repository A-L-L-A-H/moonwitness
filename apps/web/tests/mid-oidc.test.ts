import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredMidSession,
  completeMidCallback,
  getStoredMidAccessToken,
  startMidLogin,
} from "../src/lib/mid-oidc";

describe("mid-oidc PKCE helper", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
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

  it("initiates PKCE authorization redirect and exchanges callback code", async () => {
    await startMidLogin("/mission-control");
    const assignMock = window.location.assign as ReturnType<typeof vi.fn>;
    expect(assignMock).toHaveBeenCalledTimes(1);
    const redirectTarget = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(redirectTarget.origin).toBe("https://id.moonwitness.biz.id");
    expect(redirectTarget.pathname).toBe("/authorize");
    expect(redirectTarget.searchParams.get("client_id")).toBe("moonwitness-web");
    expect(redirectTarget.searchParams.get("code_challenge_method")).toBe("S256");

    const returnedState = redirectTarget.searchParams.get("state") ?? "";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ access_token: "at.jwt.sig", id_token: "id.jwt.sig", expires_in: 900 }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        ),
    );

    const destination = await completeMidCallback(
      new URLSearchParams({ code: "mwc_test", state: returnedState }),
    );
    expect(destination).toBe("/mission-control");
    expect(getStoredMidAccessToken()).toBe("at.jwt.sig");

    clearStoredMidSession();
    expect(getStoredMidAccessToken()).toBeNull();
  });
});
