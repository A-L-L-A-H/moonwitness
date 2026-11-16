import { createClient, type Client } from "@libsql/client";
import { beforeAll, describe, expect, it } from "vitest";
import { sha256Base64Url, verifyEs256Jwt } from "./crypto";
import { createMidHandler } from "./index";
import type { D1DatabaseLike, D1PreparedStatementLike, MidEnv, PublicEs256Jwk } from "./types";

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
  });
});
