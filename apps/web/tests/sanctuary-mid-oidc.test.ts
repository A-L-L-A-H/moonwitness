import { encodeBase64Url, type PublicEs256Jwk } from "@moonwitness/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALLAH_SANCTUARY_CLIENT_ID,
  SANCTUARY_MID_AUTH_EVENT,
  clearSanctuaryMidSession,
  completeSanctuaryMidCallback,
  getStoredSanctuaryMidSession,
  startSanctuaryMidLogin,
} from "@/lib/sanctuary-mid-oidc";

const TEXT_ENCODER = new TextEncoder();
const DEFAULT_ISSUER = "https://id.moonwitness.biz.id";

interface Es256TestSigner {
  readonly kid: string;
  readonly publicJwk: PublicEs256Jwk;
  readonly signJwt: (
    claims: Record<string, unknown>,
    headerOverrides?: Record<string, unknown>,
  ) => Promise<string>;
}

async function createEs256TestSigner(kid = "mid-sanctuary-k1"): Promise<Es256TestSigner> {
  const pair = await globalThis.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const rawPublic = (await globalThis.crypto.subtle.exportKey(
    "jwk",
    pair.publicKey,
  )) as PublicEs256Jwk;
  const publicJwk: PublicEs256Jwk = {
    kty: "EC",
    crv: "P-256",
    x: rawPublic.x,
    y: rawPublic.y,
    kid,
    use: "sig",
    alg: "ES256",
  };

  return {
    kid,
    publicJwk,
    async signJwt(claims, headerOverrides) {
      const header = { alg: "ES256", typ: "JWT", kid, ...headerOverrides };
      const headerB64 = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(header)));
      const payloadB64 = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(claims)));
      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = await globalThis.crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        pair.privateKey,
        TEXT_ENCODER.encode(signingInput),
      );
      return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
    },
  };
}

function buildValidIdClaims(
  nonce: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    iss: DEFAULT_ISSUER,
    sub: "9",
    aud: ALLAH_SANCTUARY_CLIENT_ID,
    iat: nowSec,
    exp: nowSec + 300,
    token_use: "id",
    preferred_username: "witness",
    name: "Sanctuary Steward",
    role: "admin",
    nonce,
    ...overrides,
  };
}

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
    store,
    getAssignedUrl: () => assignedUrl,
    getDispatched: () => dispatched,
  };
}

async function beginLogin(win: ReturnType<typeof installMockWindow>, nextPath = "/codex") {
  await startSanctuaryMidLogin(nextPath);
  const authUrlStr = win.getAssignedUrl();
  expect(authUrlStr).toBeTruthy();
  const authUrl = new URL(authUrlStr ?? "");
  return {
    authUrl,
    state: authUrl.searchParams.get("state") ?? "",
    nonce: authUrl.searchParams.get("nonce") ?? "",
  };
}

function createOidcFetchMock(options: {
  readonly idToken?: string;
  readonly keys?: readonly PublicEs256Jwk[];
  readonly jwksStatus?: number;
  readonly jwksError?: Error;
  readonly issuerBase?: string;
  readonly onTokenRequest?: (body: URLSearchParams) => void;
}): typeof fetch {
  const issuerBase = (options.issuerBase ?? DEFAULT_ISSUER).replace(/\/+$/g, "");
  return async (input, init) => {
    const target = typeof input === "string" ? input : input.toString();
    if (target === `${issuerBase}/oauth/token`) {
      if (options.onTokenRequest && typeof init?.body === "string") {
        options.onTokenRequest(new URLSearchParams(init.body));
      }
      const payload: Record<string, unknown> = {
        access_token: "acc_sanctuary",
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: "rt_sanctuary",
      };
      if (options.idToken !== undefined) {
        payload.id_token = options.idToken;
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (target === `${issuerBase}/.well-known/jwks.json`) {
      if (options.jwksError) {
        throw options.jwksError;
      }
      if (options.jwksStatus && options.jwksStatus >= 400) {
        return new Response(JSON.stringify({ error: "unavailable" }), {
          status: options.jwksStatus,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ keys: options.keys ?? [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(null, { status: 404 });
  };
}

describe("allah-sanctuary mid-oidc", () => {
  const originalWindow = globalThis.window;
  const originalIssuerEnv = process.env.NEXT_PUBLIC_MID_ISSUER_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_MID_ISSUER_URL;
    installMockWindow();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
    if (originalIssuerEnv === undefined) {
      delete process.env.NEXT_PUBLIC_MID_ISSUER_URL;
    } else {
      process.env.NEXT_PUBLIC_MID_ISSUER_URL = originalIssuerEnv;
    }
  });

  it("exchanges authorization code via BFF, stores only non-secret display metadata in sessionStorage, and logs out via BFF", async () => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    const { authUrl, state } = await beginLogin(win, "/codex");

    expect(authUrl.origin).toBe(DEFAULT_ISSUER);
    expect(authUrl.searchParams.get("client_id")).toBe(ALLAH_SANCTUARY_CLIENT_ID);
    expect(authUrl.searchParams.get("redirect_uri")).toBe("https://a-l-l-a-h.com/auth/callback");

    const requestedUrls: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const target = typeof input === "string" ? input : input.toString();
      requestedUrls.push(target);
      if (target === "/api/v1/auth/bff/exchange") {
        expect(init?.method).toBe("POST");
        expect(init?.credentials).toBe("include");
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              id: 9,
              username: "witness",
              displayName: "Sanctuary Steward",
              role: "admin",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (target === "/api/v1/auth/bff/logout") {
        expect(init?.method).toBe("POST");
        expect(init?.credentials).toBe("include");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    };

    const result = await completeSanctuaryMidCallback(
      new URLSearchParams({ code: "code_bff_1", state }),
      fetchMock,
    );

    expect(requestedUrls).toEqual(["/api/v1/auth/bff/exchange"]);
    expect(result.nextPath).toBe("/codex");
    expect(result.session).toMatchObject({
      sub: "9",
      username: "witness",
      displayName: "Sanctuary Steward",
      role: "admin",
    });
    expect(result.session).not.toHaveProperty("accessToken");
    expect(result.session).not.toHaveProperty("refreshToken");

    const rawStoredSession = win.store.get("allah_sanctuary_mid_session_v1") ?? "";
    expect(rawStoredSession).not.toContain("accessToken");
    expect(rawStoredSession).not.toContain("refreshToken");
    expect(rawStoredSession).not.toContain("access_token");
    expect(rawStoredSession).not.toContain("refresh_token");
    expect(getStoredSanctuaryMidSession()?.sub).toBe("9");
    expect(win.getDispatched()).toContain(SANCTUARY_MID_AUTH_EVENT);

    await clearSanctuaryMidSession(fetchMock);
    expect(requestedUrls).toEqual(["/api/v1/auth/bff/exchange", "/api/v1/auth/bff/logout"]);
    expect(getStoredSanctuaryMidSession()).toBeNull();
  });

  it("fails closed when BFF exchange returns an error without calling MID token endpoint directly", async () => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    const { state } = await beginLogin(win, "/codex");
    const requestedUrls: string[] = [];

    await expect(
      completeSanctuaryMidCallback(
        new URLSearchParams({ code: "code_bad", state }),
        async (input) => {
          const target = typeof input === "string" ? input : input.toString();
          requestedUrls.push(target);
          return new Response(JSON.stringify({ error: "invalid_grant" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        },
      ),
    ).rejects.toThrow(/invalid_grant/i);

    expect(requestedUrls).toEqual(["/api/v1/auth/bff/exchange"]);
    expect(getStoredSanctuaryMidSession()).toBeNull();
  });

  it("completes PKCE flow with ES256 JWKS verification fallback, omits tokens from sessionStorage, and revokes cleanly", async () => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    const signer = await createEs256TestSigner("mid-sanctuary-k1");
    const { authUrl, state, nonce } = await beginLogin(win, "/codex");

    expect(authUrl.origin).toBe(DEFAULT_ISSUER);
    expect(authUrl.searchParams.get("client_id")).toBe(ALLAH_SANCTUARY_CLIENT_ID);
    expect(authUrl.searchParams.get("redirect_uri")).toBe("https://a-l-l-a-h.com/auth/callback");

    const idToken = await signer.signJwt(buildValidIdClaims(nonce));
    const fetchMock = createOidcFetchMock({
      idToken,
      keys: [signer.publicJwk],
    });

    const result = await completeSanctuaryMidCallback(
      new URLSearchParams({ code: "code_sanctuary_1", state }),
      fetchMock,
    );

    expect(result.nextPath).toBe("/codex");
    expect(result.session).toMatchObject({
      sub: "9",
      username: "witness",
      displayName: "Sanctuary Steward",
      role: "admin",
    });
    expect(result.session).not.toHaveProperty("accessToken");
    expect(result.session).not.toHaveProperty("refreshToken");
    const rawStoredSession = win.store.get("allah_sanctuary_mid_session_v1") ?? "";
    expect(rawStoredSession).not.toContain("acc_sanctuary");
    expect(rawStoredSession).not.toContain("rt_sanctuary");
    expect(rawStoredSession).not.toContain("accessToken");
    expect(rawStoredSession).not.toContain("refreshToken");
    expect(getStoredSanctuaryMidSession()?.sub).toBe("9");
    expect(win.getDispatched()).toContain(SANCTUARY_MID_AUTH_EVENT);

    let bffLogoutCalled = false;
    await clearSanctuaryMidSession(async (input) => {
      const target = typeof input === "string" ? input : input.toString();
      if (target.endsWith("/api/v1/auth/bff/logout")) bffLogoutCalled = true;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    expect(bffLogoutCalled).toBe(true);
    expect(getStoredSanctuaryMidSession()).toBeNull();
  });

  it("supports JWKS key rotation and normalizes configured issuer trailing slashes", async () => {
    process.env.NEXT_PUBLIC_MID_ISSUER_URL = "https://auth.sanctuary.example/";
    const win = installMockWindow("https://a-l-l-a-h.com/scriptures");
    const key1 = await createEs256TestSigner("sanctuary-k1");
    const key2 = await createEs256TestSigner("sanctuary-k2");

    const login1 = await beginLogin(win, "/scriptures");
    const token1 = await key1.signJwt(
      buildValidIdClaims(login1.nonce, { iss: "https://auth.sanctuary.example", role: "editor" }),
    );
    const res1 = await completeSanctuaryMidCallback(
      new URLSearchParams({ code: "code_1", state: login1.state }),
      createOidcFetchMock({
        issuerBase: "https://auth.sanctuary.example",
        idToken: token1,
        keys: [key1.publicJwk],
      }),
    );
    expect(res1.session.role).toBe("editor");

    const login2 = await beginLogin(win, "/mtime");
    const token2 = await key2.signJwt(
      buildValidIdClaims(login2.nonce, { iss: "https://auth.sanctuary.example", role: "viewer" }),
    );
    const res2 = await completeSanctuaryMidCallback(
      new URLSearchParams({ code: "code_2", state: login2.state }),
      createOidcFetchMock({
        issuerBase: "https://auth.sanctuary.example",
        idToken: token2,
        keys: [key2.publicJwk],
      }),
    );
    expect(res2.session.role).toBe("viewer");
    expect(res2.nextPath).toBe("/mtime");
  });

  it("fails closed when id_token is missing or empty", async () => {
    for (const missingToken of [undefined, "", "   "]) {
      const win = installMockWindow("https://a-l-l-a-h.com/codex");
      const signer = await createEs256TestSigner();
      const { state } = await beginLogin(win);

      await expect(
        completeSanctuaryMidCallback(
          new URLSearchParams({ code: "code_missing", state }),
          createOidcFetchMock({
            idToken: missingToken,
            keys: [signer.publicJwk],
          }),
        ),
      ).rejects.toThrow(/id_token/i);

      expect(getStoredSanctuaryMidSession()).toBeNull();
      expect(win.getDispatched()).toEqual([]);
    }
  });

  it("fails closed on malformed tokens, alg=none, missing kid, wrong signing key, and tampered payloads", async () => {
    const signer = await createEs256TestSigner("mid-k1");
    const rogueSigner = await createEs256TestSigner("mid-k1");

    const buildInvalidTokenCases = async (nonce: string): Promise<string[]> => {
      const validSigned = await signer.signJwt(buildValidIdClaims(nonce));
      const [headerSeg, , sigSeg] = validSigned.split(".");
      const tamperedPayloadSeg = encodeBase64Url(
        TEXT_ENCODER.encode(JSON.stringify(buildValidIdClaims(nonce, { sub: "1", role: "admin" }))),
      );

      return [
        "not-a-jwt",
        "only.two",
        await signer.signJwt(buildValidIdClaims(nonce), { alg: "none" }),
        await signer.signJwt(buildValidIdClaims(nonce), { kid: "" }),
        await rogueSigner.signJwt(buildValidIdClaims(nonce)),
        `${headerSeg}.${tamperedPayloadSeg}.${sigSeg}`,
      ];
    };

    const probeWin = installMockWindow();
    const { nonce: probeNonce } = await beginLogin(probeWin);
    const malformedCount = (await buildInvalidTokenCases(probeNonce)).length;

    for (let idx = 0; idx < malformedCount; idx += 1) {
      const win = installMockWindow("https://a-l-l-a-h.com/codex");
      const { state, nonce } = await beginLogin(win);
      const tokens = await buildInvalidTokenCases(nonce);

      await expect(
        completeSanctuaryMidCallback(
          new URLSearchParams({ code: `code_bad_${idx}`, state }),
          createOidcFetchMock({
            idToken: tokens[idx],
            keys: [signer.publicJwk],
          }),
        ),
      ).rejects.toThrow();

      expect(getStoredSanctuaryMidSession()).toBeNull();
      expect(win.getDispatched()).toEqual([]);
    }
  });

  it.each([
    {
      label: "wrong issuer",
      override: () => ({ iss: "https://evil-idp.example" }),
    },
    {
      label: "wrong audience",
      override: () => ({ aud: "moonwitness-web" }),
    },
    {
      label: "untrusted multi-audience without azp",
      override: () => ({ aud: [ALLAH_SANCTUARY_CLIENT_ID, "other-client"] }),
    },
    {
      label: "wrong azp",
      override: () => ({ azp: "moonwitness-web" }),
    },
    {
      label: "wrong nonce",
      override: () => ({ nonce: "forged-nonce" }),
    },
    {
      label: "missing nonce claim",
      override: () => ({ nonce: undefined }),
    },
    {
      label: "expired token",
      override: () => ({ exp: Math.floor(Date.now() / 1000) - 30 }),
    },
    {
      label: "future nbf token",
      override: () => ({ nbf: Math.floor(Date.now() / 1000) + 300 }),
    },
    {
      label: "wrong token_use (access instead of id)",
      override: () => ({ token_use: "access" }),
    },
    {
      label: "missing token_use",
      override: () => ({ token_use: undefined }),
    },
    {
      label: "missing sub",
      override: () => ({ sub: "" }),
    },
  ])("rejects signed id_token with $label and keeps session empty", async ({ override }) => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    const signer = await createEs256TestSigner("mid-claims-k1");
    const { state, nonce } = await beginLogin(win);

    const claims = buildValidIdClaims(nonce, override());
    const idToken = await signer.signJwt(claims);

    await expect(
      completeSanctuaryMidCallback(
        new URLSearchParams({ code: "code_claim_fail", state }),
        createOidcFetchMock({
          idToken,
          keys: [signer.publicJwk],
        }),
      ),
    ).rejects.toThrow();

    expect(getStoredSanctuaryMidSession()).toBeNull();
    expect(win.getDispatched()).toEqual([]);
  });

  it("rejects callback when stored PKCE session is missing nonce", async () => {
    const win = installMockWindow("https://a-l-l-a-h.com/codex");
    const signer = await createEs256TestSigner();
    const { state, nonce } = await beginLogin(win);

    const pkceKey = "allah_sanctuary_mid_pkce_v1";
    const stored = JSON.parse(win.store.get(pkceKey) ?? "{}") as Record<string, unknown>;
    delete stored.nonce;
    win.store.set(pkceKey, JSON.stringify(stored));

    const idToken = await signer.signJwt(buildValidIdClaims(nonce));
    await expect(
      completeSanctuaryMidCallback(
        new URLSearchParams({ code: "code_no_pkce_nonce", state }),
        createOidcFetchMock({ idToken, keys: [signer.publicJwk] }),
      ),
    ).rejects.toThrow(/nonce/i);

    expect(getStoredSanctuaryMidSession()).toBeNull();
    expect(win.getDispatched()).toEqual([]);
  });

  it("fails closed when JWKS endpoint returns 503, rejects on network error, or omits kid", async () => {
    const signer = await createEs256TestSigner("mid-jwks-k1");
    const otherKey = await createEs256TestSigner("mid-other-k2");

    const jwksFailureModes: Array<{
      jwksStatus?: number;
      jwksError?: Error;
      keys?: readonly PublicEs256Jwk[];
    }> = [
      { jwksStatus: 503 },
      { jwksError: new Error("ECONNREFUSED") },
      { keys: [otherKey.publicJwk] },
    ];

    for (const mode of jwksFailureModes) {
      const win = installMockWindow("https://a-l-l-a-h.com/codex");
      const { state, nonce } = await beginLogin(win);
      const idToken = await signer.signJwt(buildValidIdClaims(nonce));

      await expect(
        completeSanctuaryMidCallback(
          new URLSearchParams({ code: "code_jwks_fail", state }),
          createOidcFetchMock({
            idToken,
            ...mode,
          }),
        ),
      ).rejects.toThrow(/verification failed/i);

      expect(getStoredSanctuaryMidSession()).toBeNull();
      expect(win.getDispatched()).toEqual([]);
    }
  });
});
