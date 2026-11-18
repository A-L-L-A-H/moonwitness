import { createClient, type Client } from "@libsql/client";
import { beforeAll, describe, expect, it } from "vitest";
import { decodeJsonBase64Url, sha256Base64Url, verifyEs256Jwt } from "./crypto";
import { ensureMidSchema } from "./db";
import { createMidHandler } from "./index";
import type {
  D1DatabaseLike,
  D1PreparedStatementLike,
  MidEnv,
  MidTokenClaims,
  PublicEs256Jwk,
} from "./types";

function createInMemoryD1(libsql: Client): D1DatabaseLike {
  class PreparedStatement implements D1PreparedStatementLike {
    private params: unknown[] = [];

    constructor(private readonly query: string) {}

    bind(...values: unknown[]): D1PreparedStatementLike {
      this.params = values;
      return this;
    }

    async all<TRow = Record<string, unknown>>(): Promise<{ results?: TRow[] }> {
      const result = await libsql.execute({
        sql: this.query,
        args: this.params as (string | number | bigint | Uint8Array | null)[],
      });
      return { results: result.rows as unknown as TRow[] };
    }

    async run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }> {
      const result = await libsql.execute({
        sql: this.query,
        args: this.params as (string | number | bigint | Uint8Array | null)[],
      });
      return {
        meta: {
          last_row_id: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0,
          changes: result.rowsAffected,
        },
      };
    }
  }

  return {
    prepare(query: string): D1PreparedStatementLike {
      return new PreparedStatement(query);
    },
    async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
      const results: unknown[] = [];
      for (const statement of statements) {
        results.push(await statement.run());
      }
      return results;
    },
  };
}

async function seedCoreSchema(libsql: Client): Promise<void> {
  await libsql.executeMultiple(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0
    );
  `);
}

describe("@moonwitness/mid OIDC & SSO Worker", () => {
  const libsql = createClient({ url: ":memory:" });
  const env: MidEnv = {
    DB: createInMemoryD1(libsql),
    MID_KEY_ENCRYPTION_SECRET: "unit-test-master-secret-32bytes-ok",
    ISSUER_URL: "https://id.moonwitness.biz.id",
    COOKIE_DOMAIN: ".moonwitness.biz.id",
    CORS_ORIGINS: "https://moonwitness.biz.id,https://a-l-l-a-h.com",
  };
  const handler = createMidHandler();

  beforeAll(async () => {
    await seedCoreSchema(libsql);
    const { hashPassword } = await import("./crypto");
    const adminHash = await hashPassword("SovereignAdmin!2026");
    const viewerHash = await hashPassword("ViewerPass!2026");
    await libsql.execute({
      sql: `INSERT INTO users (username, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)`,
      args: ["mwadmin", "admin@moonwitness.biz.id", adminHash, "admin", "MoonWitness Admin"],
    });
    await libsql.execute({
      sql: `INSERT INTO users (username, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)`,
      args: ["viewer1", "viewer@moonwitness.biz.id", viewerHash, "viewer", "Viewer One"],
    });
  });

  it("exposes health, OIDC discovery document, and persistent ES256 JWKS", async () => {
    const healthRes = await handler(new Request("https://id.moonwitness.biz.id/health"), env);
    expect(healthRes.status).toBe(200);
    const healthBody = (await healthRes.json()) as { service: string; activeKid: string };
    expect(healthBody.service).toBe("moonwitness-id");
    expect(healthBody.activeKid).toMatch(/^mid-/);

    const discRes = await handler(
      new Request("https://id.moonwitness.biz.id/.well-known/openid-configuration"),
      env,
    );
    expect(discRes.status).toBe(200);
    const discBody = (await discRes.json()) as {
      issuer: string;
      code_challenge_methods_supported: string[];
    };
    expect(discBody.issuer).toBe("https://id.moonwitness.biz.id");
    expect(discBody.code_challenge_methods_supported).toEqual(["S256"]);

    const jwksRes = await handler(
      new Request("https://id.moonwitness.biz.id/.well-known/jwks.json"),
      env,
    );
    expect(jwksRes.status).toBe(200);
    const jwksBody = (await jwksRes.json()) as { keys: PublicEs256Jwk[] };
    expect(jwksBody.keys).toHaveLength(1);
    expect(jwksBody.keys[0]?.kid).toBe(healthBody.activeKid);
  });

  it("completes full PKCE OIDC flow, verifies ES256 JWTs, rotates refresh tokens, and stops replay", async () => {
    const codeVerifier = "moonwitness_pkce_verifier_with_sufficient_entropy_0123456789";
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const redirectUri = "https://moonwitness.biz.id/auth/callback";

    const authPageRes = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-web&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email%20offline_access&state=st_123&nonce=nc_456&code_challenge=${codeChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(authPageRes.status).toBe(200);
    expect(await authPageRes.text()).toContain("MoonWitness Web Console");

    const approveRes = await handler(
      new Request("https://id.moonwitness.biz.id/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://id.moonwitness.biz.id",
        },
        body: new URLSearchParams({
          client_id: "moonwitness-web",
          redirect_uri: redirectUri,
          scope: "openid profile email offline_access",
          state: "st_123",
          nonce: "nc_456",
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
          response_type: "code",
          decision: "approve",
          identifier: "mwadmin",
          password: "SovereignAdmin!2026",
        }),
      }),
      env,
    );
    expect(approveRes.status).toBe(302);
    const callbackUrl = new URL(approveRes.headers.get("location") ?? "");
    expect(callbackUrl.searchParams.get("state")).toBe("st_123");
    const authCode = callbackUrl.searchParams.get("code") ?? "";
    expect(authCode.startsWith("mwc_")).toBe(true);
    const ssoCookie = approveRes.headers.get("set-cookie") ?? "";
    expect(ssoCookie).toContain("mw_session=");
    expect(ssoCookie).toContain("Domain=.moonwitness.biz.id");

    // Wrong code_verifier must be rejected.
    const badPkceRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "moonwitness-web",
          code: authCode,
          redirect_uri: redirectUri,
          code_verifier: "wrong_verifier_012345678901234567890123456789012345",
        }),
      }),
      env,
    );
    expect(badPkceRes.status).toBe(400);

    // Issue a second code via active SSO session without re-entering password!
    const ssoAuthRes = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=allah-sanctuary&redirect_uri=${encodeURIComponent("https://a-l-l-a-h.com/auth/callback")}&response_type=code&scope=openid%20profile%20email%20offline_access&state=st_sso&nonce=nc_sso&code_challenge=${codeChallenge}&code_challenge_method=S256`,
        { headers: { cookie: ssoCookie.split(";")[0] ?? "" } },
      ),
      env,
    );
    expect(ssoAuthRes.status).toBe(302);
    const ssoCode =
      new URL(ssoAuthRes.headers.get("location") ?? "").searchParams.get("code") ?? "";

    const tokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "allah-sanctuary",
          code: ssoCode,
          redirect_uri: "https://a-l-l-a-h.com/auth/callback",
          code_verifier: codeVerifier,
        }),
      }),
      env,
    );
    expect(tokenRes.status).toBe(200);
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      id_token: string;
      refresh_token: string;
    };

    const jwksRes = await handler(
      new Request("https://id.moonwitness.biz.id/.well-known/jwks.json"),
      env,
    );
    const { keys } = (await jwksRes.json()) as { keys: PublicEs256Jwk[] };
    const verifiedId = await verifyEs256Jwt(tokens.id_token, keys, "https://id.moonwitness.biz.id");
    expect(verifiedId?.nonce).toBe("nc_sso");
    expect(verifiedId?.preferred_username).toBe("mwadmin");
    expect(verifiedId?.token_use).toBe("id");

    const userinfoRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/userinfo", {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      }),
      env,
    );
    expect(userinfoRes.status).toBe(200);
    expect(await userinfoRes.json()).toMatchObject({
      preferred_username: "mwadmin",
      role: "admin",
    });

    // Refresh token rotation + replay family revocation.
    const rotateRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "allah-sanctuary",
          refresh_token: tokens.refresh_token,
        }),
      }),
      env,
    );
    expect(rotateRes.status).toBe(200);
    const nextTokens = (await rotateRes.json()) as { refresh_token: string };
    expect(nextTokens.refresh_token).not.toBe(tokens.refresh_token);

    const replayRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "allah-sanctuary",
          refresh_token: tokens.refresh_token,
        }),
      }),
      env,
    );
    expect(replayRes.status).toBe(400);

    // Rotated descendant must now be revoked too because family was compromised.
    const blockedDescendant = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "allah-sanctuary",
          refresh_token: nextTokens.refresh_token,
        }),
      }),
      env,
    );
    expect(blockedDescendant.status).toBe(400);
  });

  it("enforces CSRF Origin checks and admin-only OIDC client registration", async () => {
    const csrfBlocked = await handler(
      new Request("https://id.moonwitness.biz.id/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://evil.example" },
        body: JSON.stringify({ identifier: "viewer1", password: "ViewerPass!2026" }),
      }),
      env,
    );
    expect(csrfBlocked.status).toBe(403);

    const viewerLogin = await handler(
      new Request("https://id.moonwitness.biz.id/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://moonwitness.biz.id" },
        body: JSON.stringify({ identifier: "viewer1", password: "ViewerPass!2026" }),
      }),
      env,
    );
    expect(viewerLogin.status).toBe(200);
    const viewerCookie = (viewerLogin.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

    const forbiddenAdminCall = await handler(
      new Request("https://id.moonwitness.biz.id/api/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://id.moonwitness.biz.id",
          cookie: viewerCookie,
        },
        body: JSON.stringify({
          client_id: "custom-app",
          name: "App",
          redirect_uris: "https://a.com/cb",
        }),
      }),
      env,
    );
    expect(forbiddenAdminCall.status).toBe(403);

    const adminLogin = await handler(
      new Request("https://id.moonwitness.biz.id/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://id.moonwitness.biz.id" },
        body: JSON.stringify({ identifier: "mwadmin", password: "SovereignAdmin!2026" }),
      }),
      env,
    );
    const adminCookie = (adminLogin.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    const createdClientRes = await handler(
      new Request("https://id.moonwitness.biz.id/api/clients", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://id.moonwitness.biz.id",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          client_id: "partner-app",
          name: "Partner Service",
          redirect_uris: "https://partner.moonwitness.biz.id/callback",
          client_type: "confidential",
        }),
      }),
      env,
    );
    expect(createdClientRes.status).toBe(201);
    const createdPayload = (await createdClientRes.json()) as { clientSecret: string };
    expect(createdPayload.clientSecret.startsWith("mws_")).toBe(true);

    // 7. RFC 8252 dynamic loopback port matching for moonwitness-cli while rejecting unregistered origins/paths
    const loopChallenge = await sha256Base64Url("cli_loopback_verifier_payload_at_least_43_chars");
    const dynamicLoopback = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-cli&redirect_uri=${encodeURIComponent("http://127.0.0.1:49152/callback")}&response_type=code&scope=openid%20profile&state=st_cli&nonce=nc_cli&code_challenge=${loopChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(dynamicLoopback.status).toBe(200);

    const rejectedLoopbackPath = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-cli&redirect_uri=${encodeURIComponent("http://127.0.0.1:49152/other")}&response_type=code&scope=openid%20profile&state=st_cli&nonce=nc_cli&code_challenge=${loopChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(rejectedLoopbackPath.status).toBe(400);

    // 8. First-party ROCKSOUL - DX client accepts dynamic loopback and web dev callback, rejects unregistered URIs
    const rocksoulVerifier = "rocksoul_dx_pkce_verifier_with_high_entropy_0123456789";
    const rocksoulChallenge = await sha256Base64Url(rocksoulVerifier);
    const rocksoulLoopbackUri = "http://127.0.0.1:53124/callback";
    const rocksoulAuthorize = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=rocksoul-dx&redirect_uri=${encodeURIComponent(rocksoulLoopbackUri)}&response_type=code&scope=openid%20profile%20email%20offline_access&state=st_rs_1&nonce=nc_rs_1&code_challenge=${rocksoulChallenge}&code_challenge_method=S256`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    expect(rocksoulAuthorize.status).toBe(302);
    const rocksoulRedirect = new URL(rocksoulAuthorize.headers.get("location") ?? "");
    expect(rocksoulRedirect.origin).toBe("http://127.0.0.1:53124");
    expect(rocksoulRedirect.pathname).toBe("/callback");
    expect(rocksoulRedirect.searchParams.get("state")).toBe("st_rs_1");
    const rocksoulCode = rocksoulRedirect.searchParams.get("code") ?? "";
    expect(rocksoulCode.startsWith("mwc_")).toBe(true);

    const rocksoulTokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "rocksoul-dx",
          code: rocksoulCode,
          redirect_uri: rocksoulLoopbackUri,
          code_verifier: rocksoulVerifier,
        }),
      }),
      env,
    );
    expect(rocksoulTokenRes.status).toBe(200);
    const rocksoulTokens = (await rocksoulTokenRes.json()) as {
      access_token: string;
      id_token: string;
      refresh_token?: string;
    };
    expect(rocksoulTokens.refresh_token).toBeTruthy();

    const rocksoulWebDev = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=rocksoul-dx&redirect_uri=${encodeURIComponent("http://localhost:1420/auth/callback")}&response_type=code&scope=openid%20profile&state=st_rs_web&nonce=nc_rs_web&code_challenge=${rocksoulChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(rocksoulWebDev.status).toBe(200);
    expect(await rocksoulWebDev.text()).toContain("ROCKSOUL - DX");

    const rocksoulRejectedUri = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=rocksoul-dx&redirect_uri=${encodeURIComponent("https://evil.example/auth/callback")}&response_type=code&scope=openid&state=st_bad&nonce=nc_bad&code_challenge=${rocksoulChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(rocksoulRejectedUri.status).toBe(400);
  });

  it("registers moonwitness-memory, isolates token audiences on /oauth/introspect, and enforces RFC 8707 resource policy", async () => {
    const adminLogin = await handler(
      new Request("https://id.moonwitness.biz.id/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://id.moonwitness.biz.id" },
        body: JSON.stringify({ identifier: "mwadmin", password: "SovereignAdmin!2026" }),
      }),
      env,
    );
    expect(adminLogin.status).toBe(200);
    const adminCookie = (adminLogin.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

    // 1. Registered first-party moonwitness-memory completes PKCE flow for prod & localhost:3005.
    const memoryVerifier = "moonwitness_memory_pkce_verifier_with_high_entropy_0123456789";
    const memoryChallenge = await sha256Base64Url(memoryVerifier);
    const memoryProdUri = "https://memory-edge.moonwitness.biz.id/auth/callback";
    const memoryAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-memory&redirect_uri=${encodeURIComponent(memoryProdUri)}&response_type=code&scope=openid%20profile%20email%20offline_access&state=st_mem&nonce=nc_mem&code_challenge=${memoryChallenge}&code_challenge_method=S256`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    expect(memoryAuth.status).toBe(302);
    const memoryCode =
      new URL(memoryAuth.headers.get("location") ?? "").searchParams.get("code") ?? "";
    const memoryTokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "moonwitness-memory",
          code: memoryCode,
          redirect_uri: memoryProdUri,
          code_verifier: memoryVerifier,
        }),
      }),
      env,
    );
    expect(memoryTokenRes.status).toBe(200);
    const memoryTokens = (await memoryTokenRes.json()) as {
      access_token: string;
      id_token: string;
    };
    expect(
      decodeJsonBase64Url<MidTokenClaims>(memoryTokens.access_token.split(".")[1] ?? "").aud,
    ).toBe("moonwitness-memory");

    const memoryLocalAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-memory&redirect_uri=${encodeURIComponent("http://localhost:3005/auth/callback")}&response_type=code&scope=openid%20profile&state=st_mem_local&nonce=nc_mem_local&code_challenge=${memoryChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(memoryLocalAuth.status).toBe(200);
    expect(await memoryLocalAuth.text()).toContain("MoonWitness Memory Deck");

    const memoryBadRedirect = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-memory&redirect_uri=${encodeURIComponent("https://evil.example/auth/callback")}&response_type=code&scope=openid&state=st_bad&nonce=nc_bad&code_challenge=${memoryChallenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(memoryBadRedirect.status).toBe(400);

    // 2. Mint real access + id tokens for moonwitness-web and igate-console via SSO.
    const webVerifier = "moonwitness_web_pkce_verifier_for_introspect_0123456789";
    const webChallenge = await sha256Base64Url(webVerifier);
    const webAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-web&redirect_uri=${encodeURIComponent("https://moonwitness.biz.id/auth/callback")}&response_type=code&scope=openid%20profile%20email%20offline_access&state=st_web&nonce=nc_web&code_challenge=${webChallenge}&code_challenge_method=S256`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    const webCode = new URL(webAuth.headers.get("location") ?? "").searchParams.get("code") ?? "";
    const webTokens = (await (
      await handler(
        new Request("https://id.moonwitness.biz.id/oauth/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: "moonwitness-web",
            code: webCode,
            redirect_uri: "https://moonwitness.biz.id/auth/callback",
            code_verifier: webVerifier,
          }),
        }),
        env,
      )
    ).json()) as { access_token: string; id_token: string };

    const igateVerifier = "igate_console_pkce_verifier_for_introspect_0123456789";
    const igateChallenge = await sha256Base64Url(igateVerifier);
    const igateAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=igate-console&redirect_uri=${encodeURIComponent("https://igate.moonwitness.biz.id/auth/callback")}&response_type=code&scope=openid%20profile&state=st_ig&nonce=nc_ig&code_challenge=${igateChallenge}&code_challenge_method=S256`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    const igateCode =
      new URL(igateAuth.headers.get("location") ?? "").searchParams.get("code") ?? "";
    const igateTokens = (await (
      await handler(
        new Request("https://id.moonwitness.biz.id/oauth/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: "igate-console",
            code: igateCode,
            redirect_uri: "https://igate.moonwitness.biz.id/auth/callback",
            code_verifier: igateVerifier,
          }),
        }),
        env,
      )
    ).json()) as { access_token: string; id_token: string };

    // 3. Register confidential callers: isolated partner-service, moonwitness-api, rocksoul-igate-worker.
    const createConfidential = async (clientId: string, redirectUri: string) => {
      const res = await handler(
        new Request("https://id.moonwitness.biz.id/api/clients", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://id.moonwitness.biz.id",
            cookie: adminCookie,
          },
          body: JSON.stringify({
            client_id: clientId,
            name: clientId,
            redirect_uris: redirectUri,
            client_type: "confidential",
          }),
        }),
        env,
      );
      expect(res.status).toBe(201);
      return ((await res.json()) as { clientSecret: string }).clientSecret;
    };

    const isolatedSecret = await createConfidential(
      "isolated-svc",
      "https://isolated.moonwitness.biz.id/callback",
    );
    const apiSecret = await createConfidential(
      "moonwitness-api",
      "https://api.moonwitness.biz.id/callback",
    );
    const igateWorkerSecret = await createConfidential(
      "rocksoul-igate-worker",
      "https://igate.moonwitness.biz.id/auth/callback",
    );

    // Issue real access + id token for isolated-svc via consent POST /authorize + Basic auth /oauth/token.
    const isoVerifier = "isolated_service_pkce_verifier_with_high_entropy_0123456789";
    const isoChallenge = await sha256Base64Url(isoVerifier);
    const isoApprove = await handler(
      new Request("https://id.moonwitness.biz.id/authorize", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://id.moonwitness.biz.id",
          cookie: adminCookie,
        },
        body: new URLSearchParams({
          client_id: "isolated-svc",
          redirect_uri: "https://isolated.moonwitness.biz.id/callback",
          scope: "openid profile",
          state: "st_iso",
          nonce: "nc_iso",
          code_challenge: isoChallenge,
          code_challenge_method: "S256",
          response_type: "code",
          decision: "approve",
        }),
      }),
      env,
    );
    expect(isoApprove.status).toBe(302);
    const isoCode =
      new URL(isoApprove.headers.get("location") ?? "").searchParams.get("code") ?? "";
    const isoTokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`isolated-svc:${isolatedSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: isoCode,
          redirect_uri: "https://isolated.moonwitness.biz.id/callback",
          code_verifier: isoVerifier,
        }),
      }),
      env,
    );
    expect(isoTokenRes.status).toBe(200);
    const isoTokens = (await isoTokenRes.json()) as { access_token: string; id_token: string };

    // 4. Introspection auth & caller binding checks.
    const unauthIntrospect = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: webTokens.access_token }),
      }),
      env,
    );
    expect(unauthIntrospect.status).toBe(401);

    const publicIntrospect = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: "moonwitness-web",
          token: webTokens.access_token,
        }),
      }),
      env,
    );
    expect(publicIntrospect.status).toBe(401);

    // isolated-svc accepts its own access token, rejects its own ID token, and rejects moonwitness-web token.
    const isoSelfAccess = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`isolated-svc:${isolatedSecret}`)}`,
        },
        body: new URLSearchParams({ token: isoTokens.access_token }),
      }),
      env,
    );
    expect(isoSelfAccess.status).toBe(200);
    expect(await isoSelfAccess.json()).toMatchObject({
      active: true,
      aud: "isolated-svc",
      client_id: "isolated-svc",
      token_use: "access",
    });

    const isoSelfId = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`isolated-svc:${isolatedSecret}`)}`,
        },
        body: new URLSearchParams({ token: isoTokens.id_token }),
      }),
      env,
    );
    expect(isoSelfId.status).toBe(200);
    expect(await isoSelfId.json()).toEqual({ active: false });

    const isoCrossClient = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`isolated-svc:${isolatedSecret}`)}`,
        },
        body: new URLSearchParams({
          token: webTokens.access_token,
          resource: "moonwitness-web",
        }),
      }),
      env,
    );
    expect(isoCrossClient.status).toBe(200);
    expect(await isoCrossClient.json()).toEqual({ active: false });

    // moonwitness-api accepts moonwitness-web access token, rejects igate-console, moonwitness-memory, and ID tokens.
    const apiWebCheck = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: "moonwitness-api",
          client_secret: apiSecret,
          token: webTokens.access_token,
        }),
      }),
      env,
    );
    expect(await apiWebCheck.json()).toMatchObject({ active: true, aud: "moonwitness-web" });

    for (const deniedToken of [
      igateTokens.access_token,
      memoryTokens.access_token,
      webTokens.id_token,
    ]) {
      const res = await handler(
        new Request("https://id.moonwitness.biz.id/oauth/introspect", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: "moonwitness-api",
            client_secret: apiSecret,
            token: deniedToken,
          }),
        }),
        env,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ active: false });
    }

    // rocksoul-igate-worker accepts igate-console access token, rejects moonwitness-web token and ID token.
    const igateOk = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`rocksoul-igate-worker:${igateWorkerSecret}`)}`,
        },
        body: new URLSearchParams({ token: igateTokens.access_token }),
      }),
      env,
    );
    expect(await igateOk.json()).toMatchObject({ active: true, aud: "igate-console" });

    const igateRejectedWeb = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/introspect", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization: `Basic ${btoa(`rocksoul-igate-worker:${igateWorkerSecret}`)}`,
        },
        body: new URLSearchParams({ token: webTokens.access_token }),
      }),
      env,
    );
    expect(await igateRejectedWeb.json()).toEqual({ active: false });

    // 5. Optional RFC 8707 resource / audience parameter validation on /authorize & /oauth/token.
    const rfcAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-web&redirect_uri=${encodeURIComponent("https://moonwitness.biz.id/auth/callback")}&response_type=code&scope=openid%20profile%20offline_access&state=st_rfc&nonce=nc_rfc&code_challenge=${webChallenge}&code_challenge_method=S256&resource=${encodeURIComponent("https://api.moonwitness.biz.id")}`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    expect(rfcAuth.status).toBe(302);
    const rfcCode = new URL(rfcAuth.headers.get("location") ?? "").searchParams.get("code") ?? "";

    const rfcTokenRes = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "moonwitness-web",
          code: rfcCode,
          redirect_uri: "https://moonwitness.biz.id/auth/callback",
          code_verifier: webVerifier,
        }),
      }),
      env,
    );
    expect(rfcTokenRes.status).toBe(200);
    const rfcTokens = (await rfcTokenRes.json()) as {
      access_token: string;
      id_token: string;
      refresh_token: string;
    };
    const rfcAccessClaims = decodeJsonBase64Url<MidTokenClaims>(
      rfcTokens.access_token.split(".")[1] ?? "",
    );
    const rfcIdClaims = decodeJsonBase64Url<MidTokenClaims>(rfcTokens.id_token.split(".")[1] ?? "");
    expect(rfcAccessClaims.aud).toEqual(["moonwitness-web", "moonwitness-api"]);
    expect(rfcAccessClaims.azp).toBe("moonwitness-web");
    expect(rfcIdClaims.aud).toBe("moonwitness-web");

    // Cross-boundary RFC 8707 target must fail with invalid_target.
    const forbiddenResourceAuth = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=moonwitness-web&redirect_uri=${encodeURIComponent("https://moonwitness.biz.id/auth/callback")}&response_type=code&scope=openid&state=st_evil&nonce=nc_evil&code_challenge=${webChallenge}&code_challenge_method=S256&resource=igate-console`,
        { headers: { cookie: adminCookie } },
      ),
      env,
    );
    expect(forbiddenResourceAuth.status).toBe(302);
    expect(
      new URL(forbiddenResourceAuth.headers.get("location") ?? "").searchParams.get("error"),
    ).toBe("invalid_target");

    const forbiddenRefresh = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "moonwitness-web",
          refresh_token: rfcTokens.refresh_token,
          resource: "moonwitness-memory",
        }),
      }),
      env,
    );
    expect(forbiddenRefresh.status).toBe(400);
    expect(await forbiddenRefresh.json()).toMatchObject({ error: "invalid_target" });

    // Valid refresh keeps the bound cross-resource audience.
    const validRefresh = await handler(
      new Request("https://id.moonwitness.biz.id/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "moonwitness-web",
          refresh_token: rfcTokens.refresh_token,
        }),
      }),
      env,
    );
    expect(validRefresh.status).toBe(200);
    const refreshedPayload = (await validRefresh.json()) as { access_token: string };
    expect(
      decodeJsonBase64Url<MidTokenClaims>(refreshedPayload.access_token.split(".")[1] ?? "").aud,
    ).toEqual(["moonwitness-web", "moonwitness-api"]);
  });

  it("migrates legacy mid_auth_codes and mid_refresh_tokens tables lacking the resource column", async () => {
    const legacyLibsql = createClient({ url: ":memory:" });
    await legacyLibsql.executeMultiple(`
      CREATE TABLE mid_auth_codes (
        code_hash TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        redirect_uri TEXT NOT NULL,
        scope TEXT NOT NULL,
        code_challenge TEXT NOT NULL,
        code_challenge_method TEXT NOT NULL,
        nonce TEXT,
        expires_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE mid_refresh_tokens (
        token_hash TEXT PRIMARY KEY,
        family_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        scope TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        replaced_by TEXT,
        created_at TEXT NOT NULL
      );
    `);
    const legacyDb = createInMemoryD1(legacyLibsql);
    await ensureMidSchema(legacyDb);

    const authCols = await legacyLibsql.execute("PRAGMA table_info(mid_auth_codes)");
    const refreshCols = await legacyLibsql.execute("PRAGMA table_info(mid_refresh_tokens)");
    expect(authCols.rows.map((row) => row.name)).toContain("resource");
    expect(refreshCols.rows.map((row) => row.name)).toContain("resource");
  });

  it("allows localhost:3000 and rejects retired localhost:3003 redirect_uri for allah-sanctuary", async () => {
    const challenge = await sha256Base64Url("allah_sanctuary_local_pkce_verifier_0123456789");
    const allowedLocal = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=allah-sanctuary&redirect_uri=${encodeURIComponent("http://localhost:3000/auth/callback")}&response_type=code&scope=openid%20profile&state=st_allah_local&nonce=nc_allah_local&code_challenge=${challenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(allowedLocal.status).toBe(200);
    const authorizeCsp = allowedLocal.headers.get("content-security-policy") ?? "";
    expect(authorizeCsp).toMatch(/style-src 'nonce-[0-9a-f]{32}'/);
    expect(authorizeCsp).not.toContain("'unsafe-inline'");
    const authorizeHtml = await allowedLocal.text();
    expect(authorizeHtml).toContain("ALLAH Sanctuary");
    const nonceMatch = authorizeCsp.match(/style-src 'nonce-([0-9a-f]{32})'/);
    expect(authorizeHtml).toContain(`<style nonce="${nonceMatch?.[1]}">`);

    const rejectedLegacyPort = await handler(
      new Request(
        `https://id.moonwitness.biz.id/authorize?client_id=allah-sanctuary&redirect_uri=${encodeURIComponent("http://localhost:3003/auth/callback")}&response_type=code&scope=openid%20profile&state=st_allah_old&nonce=nc_allah_old&code_challenge=${challenge}&code_challenge_method=S256`,
      ),
      env,
    );
    expect(rejectedLegacyPort.status).toBe(400);
  });
});
