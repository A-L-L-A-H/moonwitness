import { encodeBase64Url } from "@moonwitness/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSanctuaryMidSession,
  completeSanctuaryMidCallback,
  getStoredSanctuaryMidSession,
  startSanctuaryMidLogin,
} from "./mid-oidc";

const TEXT_ENCODER = new TextEncoder();

function installMockWindow(initialHref = "https://a-l-l-a-h.com/scriptures") {
  const store = new Map<string, string>();
  const urlObj = new URL(initialHref);
  let assignedUrl: string | null = null;
  const dispatched: string[] = [];

  const mockWindow = {
    location: {
      origin: urlObj.origin,
      pathname: urlObj.pathname,
      search: urlObj.search,
      assign: vi.fn((next: string) => {
        assignedUrl = next;
      }),
    },
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
    dispatchEvent: (ev: Event) => {
      dispatched.push(ev.type);
      return true;
    },
  };

  Object.defineProperty(globalThis, "window", { value: mockWindow, configurable: true });
  return {
    getAssignedUrl: () => assignedUrl,
    getDispatched: () => dispatched,
  };
}

describe("allah-sanctuary mid-oidc", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    installMockWindow();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
  });

  it("initiates PKCE login, completes callback with nonce check, stores session, and clears cleanly", async () => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    await startSanctuaryMidLogin("/codex");

    const authUrlStr = win.getAssignedUrl();
    expect(authUrlStr).toBeTruthy();
    const authUrl = new URL(authUrlStr ?? "");
    expect(authUrl.origin).toBe("https://id.moonwitness.biz.id");
    expect(authUrl.searchParams.get("client_id")).toBe("allah-sanctuary");
    expect(authUrl.searchParams.get("redirect_uri")).toBe("https://a-l-l-a-h.com/auth/callback");

    const state = authUrl.searchParams.get("state") ?? "";
    const nonce = authUrl.searchParams.get("nonce") ?? "";

    const header = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256" })));
    const payload = encodeBase64Url(
      TEXT_ENCODER.encode(
        JSON.stringify({
          sub: "9",
          preferred_username: "witness",
          name: "Sanctuary Steward",
          role: "admin",
          nonce,
        }),
      ),
    );
    const idToken = `${header}.${payload}.sig`;

    let revokeCalled = false;
    const result = await completeSanctuaryMidCallback(
      new URLSearchParams({ code: "code_sanctuary_1", state }),
      async (input) => {
        const target = typeof input === "string" ? input : input.toString();
        if (target.endsWith("/oauth/token")) {
          return new Response(
            JSON.stringify({
              access_token: "acc_sanctuary",
              id_token: idToken,
              token_type: "Bearer",
              expires_in: 900,
              refresh_token: "rt_sanctuary",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(null, { status: 404 });
      },
    );

    expect(result.nextPath).toBe("/codex");
    expect(result.session.username).toBe("witness");
    expect(getStoredSanctuaryMidSession()?.accessToken).toBe("acc_sanctuary");

    await clearSanctuaryMidSession(async (input) => {
      const target = typeof input === "string" ? input : input.toString();
      if (target.endsWith("/oauth/revoke")) revokeCalled = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    expect(revokeCalled).toBe(true);
    expect(getStoredSanctuaryMidSession()).toBeNull();
  });
});
