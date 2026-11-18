import { createClient, type Client } from "@libsql/client";
import Fastify from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { midFastifyPlugin } from "./plugin";
import { hashPassword, sha256Base64Url, verifyEs256Jwt } from "./crypto";
import type { D1DatabaseLike, D1PreparedStatementLike, PublicEs256Jwk } from "./types";

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

describe("midFastifyPlugin integration", () => {
  let libsql: Client;
  let db: D1DatabaseLike;
  const masterSecret = "secret-key-encryption-32-bytes-long!";

  beforeAll(async () => {
    libsql = createClient({ url: ":memory:" });
    db = createInMemoryD1(libsql);

    // Create users table matching apps/api auth schema
    await libsql.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Create sessions table matching apps/api auth schema
    await libsql.execute(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    const adminHash = await hashPassword("super-secret-admin-pass-123!");
    await libsql.execute({
      sql: `INSERT INTO users (username, email, password_hash, role, display_name)
            VALUES (?, ?, ?, 'admin', 'Root Admin')`,
      args: ["admin", "admin@moonwitness.biz.id", adminHash],
    });
  });

  async function buildTestFastify() {
    const fastify = Fastify({ logger: false });
    await fastify.register(midFastifyPlugin, {
      db,
      keyEncryptionSecret: masterSecret,
      issuerUrl: "https://id.moonwitness.biz.id",
      identityHost: "id.moonwitness.biz.id",
    });
    await fastify.ready();
    return fastify;
  }

  it("serves OIDC discovery and JWKS at root endpoints", async () => {
    const app = await buildTestFastify();

    const discRes = await app.inject({
      method: "GET",
      url: "/.well-known/openid-configuration",
    });
    expect(discRes.statusCode).toBe(200);
    const discovery = discRes.json();
    expect(discovery.issuer).toBe("https://id.moonwitness.biz.id");
    expect(discovery.authorization_endpoint).toBe("https://id.moonwitness.biz.id/authorize");
    expect(discovery.token_endpoint).toBe("https://id.moonwitness.biz.id/oauth/token");
    expect(discovery.jwks_uri).toBe("https://id.moonwitness.biz.id/.well-known/jwks.json");

    const jwksRes = await app.inject({
      method: "GET",
      url: "/.well-known/jwks.json",
    });
    expect(jwksRes.statusCode).toBe(200);
    const jwks = jwksRes.json();
    expect(Array.isArray(jwks.keys)).toBe(true);
    expect(jwks.keys.length).toBeGreaterThan(0);
    expect(jwks.keys[0].kty).toBe("EC");
    expect(jwks.keys[0].crv).toBe("P-256");
  });

  it("executes complete Authorization Code + PKCE flow, userinfo, and token rotation via Fastify", async () => {
    const app = await buildTestFastify();

    const codeVerifier = "code-verifier-super-safe-random-long-string-12345678901234567890";
    const codeChallenge = await sha256Base64Url(codeVerifier);

    // 1. Authorize POST with credentials
    const authRes = await app.inject({
      method: "POST",
      url: "/authorize",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        host: "id.moonwitness.biz.id",
        origin: "https://id.moonwitness.biz.id",
      },
      payload: new URLSearchParams({
        client_id: "moonwitness-web",
        redirect_uri: "https://moonwitness.biz.id/auth/callback",
        response_type: "code",
        scope: "openid profile email offline_access",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: "test-state-xyz",
        identifier: "admin",
        password: "super-secret-admin-pass-123!",
      }).toString(),
    });

    expect(authRes.statusCode).toBe(302);
    const redirectLocation = authRes.headers.location as string;
    expect(redirectLocation).toBeDefined();
    const redirected = new URL(redirectLocation);
    expect(redirected.searchParams.get("state")).toBe("test-state-xyz");
    const authCode = redirected.searchParams.get("code");
    expect(authCode).toBeTruthy();

    // 2. Token POST exchange
    const tokenRes = await app.inject({
      method: "POST",
      url: "/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        host: "id.moonwitness.biz.id",
      },
      payload: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: "moonwitness-web",
        redirect_uri: "https://moonwitness.biz.id/auth/callback",
        code: authCode!,
        code_verifier: codeVerifier,
      }).toString(),
    });

    expect(tokenRes.statusCode).toBe(200);
    const tokens = tokenRes.json();
    expect(tokens.token_type).toBe("Bearer");
    expect(tokens.access_token).toBeTypeOf("string");
    expect(tokens.id_token).toBeTypeOf("string");
    expect(tokens.refresh_token).toBeTypeOf("string");

    // Verify access token
    const jwksRes = await app.inject({ method: "GET", url: "/.well-known/jwks.json" });
    const publicJwks = jwksRes.json().keys as PublicEs256Jwk[];
    const verifiedAccess = await verifyEs256Jwt(
      tokens.access_token,
      publicJwks,
      "https://id.moonwitness.biz.id",
      { expectedTokenUse: "access" },
    );
    expect(verifiedAccess).not.toBeNull();
    expect(verifiedAccess?.sub).toBe("1");

    // 3. Userinfo GET
    const userinfoRes = await app.inject({
      method: "GET",
      url: "/oauth/userinfo",
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
        host: "id.moonwitness.biz.id",
      },
    });
    expect(userinfoRes.statusCode).toBe(200);
    const userinfo = userinfoRes.json();
    expect(userinfo.sub).toBe("1");
    expect(userinfo.preferred_username).toBe("admin");
    expect(userinfo.email).toBe("admin@moonwitness.biz.id");
    expect(userinfo.role).toBe("admin");

    // 4. Refresh token rotation
    const refreshRes = await app.inject({
      method: "POST",
      url: "/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        host: "id.moonwitness.biz.id",
      },
      payload: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: "moonwitness-web",
        refresh_token: tokens.refresh_token,
      }).toString(),
    });
    expect(refreshRes.statusCode).toBe(200);
    const rotated = refreshRes.json();
    expect(rotated.access_token).toBeTypeOf("string");
    expect(rotated.refresh_token).toBeTypeOf("string");
    expect(rotated.refresh_token).not.toBe(tokens.refresh_token);

    // 5. Replay old refresh token -> fails closed
    const replayRes = await app.inject({
      method: "POST",
      url: "/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        host: "id.moonwitness.biz.id",
      },
      payload: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: "moonwitness-web",
        refresh_token: tokens.refresh_token,
      }).toString(),
    });
    expect(replayRes.statusCode).toBe(400);
    expect(replayRes.json().error).toBe("invalid_grant");
  });

  it("supports host-based routing for id.moonwitness.biz.id and prefixed aliases", async () => {
    const app = await buildTestFastify();

    // Host-based GET /health
    const healthRes = await app.inject({
      method: "GET",
      url: "/health",
      headers: { host: "id.moonwitness.biz.id" },
    });
    expect(healthRes.statusCode).toBe(200);
    expect(healthRes.json().service).toBe("moonwitness-id");

    // Alias route /api/v1/mid/.well-known/openid-configuration
    const aliasRes = await app.inject({
      method: "GET",
      url: "/api/v1/mid/.well-known/openid-configuration",
    });
    expect(aliasRes.statusCode).toBe(200);
    expect(aliasRes.json().issuer).toBe("https://id.moonwitness.biz.id");
  });
});
