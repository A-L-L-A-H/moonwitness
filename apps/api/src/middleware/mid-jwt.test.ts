import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { applyMigrations, closeDb, getDb, initDb } from "@moonwitness/orm";
import { authMigrations } from "../db/migrations";
import { createUser } from "../services/user";
import { resetMidJwksCacheForTests } from "./mid-jwt";

const ENCODER = new TextEncoder();

function encodeB64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function signEs256Jwt(
  claims: Record<string, unknown>,
  kid: string,
  privateKey: webcrypto.CryptoKey,
): Promise<string> {
  const headerSeg = encodeB64Url(ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid })));
  const claimSeg = encodeB64Url(ENCODER.encode(JSON.stringify(claims)));
  const input = `${headerSeg}.${claimSeg}`;
  const sig = await webcrypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    ENCODER.encode(input),
  );
  return `${input}.${encodeB64Url(new Uint8Array(sig))}`;
}

describe("moonwitness-id ES256 Bearer JWT auth", () => {
  const envBackup = { ...process.env };
  let app: FastifyInstance | null = null;

  beforeEach(async () => {
    process.env = { ...envBackup };
    process.env.NODE_ENV = "test";
    process.env.MID_ISSUER_URL = "https://id.moonwitness.biz.id";
    resetMidJwksCacheForTests();
    await initDb("file::memory:?cache=shared");
    await applyMigrations(Array.from(authMigrations));
    const tablesAfterMigrate = await getDb().all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    expect(tablesAfterMigrate.map((row) => row.name)).toContain("users");
    await getDb().run(
      `CREATE TABLE IF NOT EXISTS mid_signing_keys (
        kid TEXT PRIMARY KEY,
        public_jwk_json TEXT NOT NULL,
        encrypted_private_jwk TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )`,
    );
    const { buildFastify } = await import("../infrastructure/adapters/fastify.adapter");
    app = await buildFastify({ prefix: "/api/v1" });
    await app.ready();
    const tablesAfterReady = await getDb().all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    expect(tablesAfterReady.map((row) => row.name)).toContain("users");
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    await closeDb();
    process.env = { ...envBackup };
  });

  it("authenticates /api/v1/auth/me with signed ES256 access_token and rejects invalid tokens", async () => {
    const user = await createUser({
      username: "sso-operator",
      email: "sso@moonwitness.biz.id",
      password: "SsoPassword!2026",
      role: "admin",
      displayName: "SSO Operator",
    });

    const pair = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ]);
    const publicJwk = await webcrypto.subtle.exportKey("jwk", pair.publicKey);
    const kid = "mid-test-key-1";

    await getDb().run(
      `INSERT INTO mid_signing_keys (kid, public_jwk_json, encrypted_private_jwk, active, created_at)
       VALUES (?, ?, 'sealed', 1, ?)`,
      [
        kid,
        JSON.stringify({ ...publicJwk, kid, use: "sig", alg: "ES256" }),
        new Date().toISOString(),
      ],
    );

    const nowSec = Math.floor(Date.now() / 1000);
    const validAccessToken = await signEs256Jwt(
      {
        iss: "https://id.moonwitness.biz.id",
        sub: String(user.id),
        aud: "moonwitness-web",
        iat: nowSec,
        exp: nowSec + 300,
        token_use: "access",
      },
      kid,
      pair.privateKey,
    );

    const okRes = await app!.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${validAccessToken}` },
    });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.json()).toMatchObject({
      user: { username: "sso-operator", role: "admin" },
    });

    const wrongUseToken = await signEs256Jwt(
      {
        iss: "https://id.moonwitness.biz.id",
        sub: String(user.id),
        aud: "moonwitness-web",
        iat: nowSec,
        exp: nowSec + 300,
        token_use: "id",
      },
      kid,
      pair.privateKey,
    );
    const rejectedUse = await app!.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${wrongUseToken}` },
    });
    expect(rejectedUse.statusCode).toBe(401);

    const parts = validAccessToken.split(".");
    const forgedToken = `${parts[0]}.${parts[1]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    const rejectedSig = await app!.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${forgedToken}` },
    });
    expect(rejectedSig.statusCode).toBe(401);
  });
});
