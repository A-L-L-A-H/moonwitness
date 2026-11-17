import { createClient } from "@libsql/client";
import { encodeBase64Url, type PublicEs256Jwk } from "@moonwitness/core";
import { describe, expect, it } from "vitest";
import { createIgateHandler } from "./app";
import type { D1DatabaseLike, D1PreparedStatementLike, IgateEnv } from "./types";

const TEXT_ENCODER = new TextEncoder();

function createMemoryD1(): D1DatabaseLike {
  const client = createClient({ url: ":memory:" });

  const makeStmt = (sql: string, bound: unknown[] = []): D1PreparedStatementLike => ({
    bind(...values: unknown[]) {
      return makeStmt(sql, values);
    },
    async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
      const res = await client.execute({ sql, args: bound as never[] });
      const row = res.rows[0] as Record<string, unknown> | undefined;
      if (!row) return null;
      if (column) return (row[column] as T) ?? null;
      return row as T;
    },
    async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
      const res = await client.execute({ sql, args: bound as never[] });
      return { results: res.rows as unknown as T[] };
    },
    async run(): Promise<{ success: boolean }> {
      await client.execute({ sql, args: bound as never[] });
      return { success: true };
    },
  });

  return {
    prepare(sql: string) {
      return makeStmt(sql);
    },
    async batch(statements: D1PreparedStatementLike[]) {
      const out: unknown[] = [];
      for (const stmt of statements) {
        out.push(await stmt.run());
      }
      return out;
    },
  };
}

async function createEs256Signer() {
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
    kid: "igate-test-k1",
    use: "sig",
    alg: "ES256",
  };

  const signJwt = async (payload: Record<string, unknown>) => {
    const header = encodeBase64Url(
      TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid: publicJwk.kid })),
    );
    const body = encodeBase64Url(TEXT_ENCODER.encode(JSON.stringify(payload)));
    const input = `${header}.${body}`;
    const sig = await globalThis.crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      pair.privateKey,
      TEXT_ENCODER.encode(input),
    );
    return `${input}.${encodeBase64Url(new Uint8Array(sig))}`;
  };

  return { publicJwk, signJwt };
}

describe("@moonwitness/igate worker", () => {
  it("preserves health endpoints, serves strict-CSP NOC console, and enforces ES256 RBAC", async () => {
    const db = createMemoryD1();
    const { publicJwk, signJwt } = await createEs256Signer();
    const env: IgateEnv = {
      DB: db,
      MID_ISSUER_URL: "https://id.moonwitness.biz.id",
      IGATE_CLIENT_ID: "igate-console",
      CORS_ORIGINS: "https://moonwitness.biz.id",
    };

    const handler = createIgateHandler({
      resolveJwkByKid: async (kid) => (kid === publicJwk.kid ? publicJwk : null),
      probeFetch: async (input) => {
        const target = typeof input === "string" ? input : input.toString();
        return new Response(JSON.stringify({ target, ok: true }), { status: 200 });
      },
    });

    const jsonRoot = await handler(
      new Request("https://igate.moonwitness.biz.id/", {
        headers: { "x-request-id": "req-123" },
      }),
      env,
    );
    expect(jsonRoot.status).toBe(200);
    expect(jsonRoot.headers.get("x-request-id")).toBe("req-123");
    expect(await jsonRoot.json()).toEqual({ service: "igate-worker", status: "ok" });

    const readyRes = await handler(
      new Request("https://igate.moonwitness.biz.id/health/ready"),
      env,
    );
    expect(readyRes.status).toBe(200);
    expect(await readyRes.json()).toMatchObject({
      service: "igate-worker",
      status: "ready",
      checks: { database: true },
    });

    const htmlConsole = await handler(
      new Request("https://igate.moonwitness.biz.id/", {
        headers: { accept: "text/html" },
      }),
      env,
    );
    expect(htmlConsole.status).toBe(200);
    expect(htmlConsole.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(await htmlConsole.text()).toContain("igate-console");

    const scriptRes = await handler(
      new Request("https://igate.moonwitness.biz.id/assets/igate.js"),
      env,
    );
    expect(scriptRes.status).toBe(200);
    expect(await scriptRes.text()).toContain("/oauth/token");

    const unauthStatus = await handler(
      new Request("https://igate.moonwitness.biz.id/api/status"),
      env,
    );
    expect(unauthStatus.status).toBe(401);

    const nowSec = Math.floor(Date.now() / 1000);
    const viewerJwt = await signJwt({
      iss: "https://id.moonwitness.biz.id",
      sub: "22",
      aud: "igate-console",
      exp: nowSec + 300,
      iat: nowSec,
      token_use: "access",
      preferred_username: "observer",
      role: "viewer",
    });

    const viewerStatus = await handler(
      new Request("https://igate.moonwitness.biz.id/api/status", {
        headers: { authorization: `Bearer ${viewerJwt}` },
      }),
      env,
    );
    expect(viewerStatus.status).toBe(200);
    const viewerPayload = (await viewerStatus.json()) as {
      actor: { username: string };
      nodes: Array<{ id: string }>;
    };
    expect(viewerPayload.actor.username).toBe("observer");
    expect(viewerPayload.nodes.length).toBeGreaterThanOrEqual(5);

    const viewerProbe = await handler(
      new Request("https://igate.moonwitness.biz.id/api/probe", {
        method: "POST",
        headers: { authorization: `Bearer ${viewerJwt}` },
        body: JSON.stringify({ nodeId: "id-provider" }),
      }),
      env,
    );
    expect(viewerProbe.status).toBe(403);

    const adminJwt = await signJwt({
      iss: "https://id.moonwitness.biz.id",
      sub: "1",
      aud: "igate-console",
      exp: nowSec + 300,
      iat: nowSec,
      token_use: "access",
      preferred_username: "mwadmin",
      role: "admin",
    });

    const adminProbe = await handler(
      new Request("https://igate.moonwitness.biz.id/api/probe", {
        method: "POST",
        headers: { authorization: `Bearer ${adminJwt}` },
        body: JSON.stringify({ nodeId: "id-provider" }),
      }),
      env,
    );
    expect(adminProbe.status).toBe(200);
    const probeBody = (await adminProbe.json()) as {
      probed: Array<{ nodeId: string; statusCode: number; ok: boolean }>;
    };
    expect(probeBody.probed).toHaveLength(1);
    expect(probeBody.probed[0]).toMatchObject({ nodeId: "id-provider", statusCode: 200, ok: true });

    const updatedStatus = await handler(
      new Request("https://igate.moonwitness.biz.id/api/status", {
        headers: { authorization: `Bearer ${adminJwt}` },
      }),
      env,
    );
    const updatedBody = (await updatedStatus.json()) as {
      recentEvents: Array<{ nodeId: string }>;
    };
    expect(updatedBody.recentEvents[0]?.nodeId).toBe("id-provider");
  });

  it("enforces IGATE_CLIENT_ID audience isolation and supports JWKS key rotation", async () => {
    const db = createMemoryD1();
    const signerV1 = await createEs256Signer();
    const signerV2 = await createEs256Signer();
    const jwkV2: PublicEs256Jwk = { ...signerV2.publicJwk, kid: "igate-test-k2" };
    let activeKeys: PublicEs256Jwk[] = [signerV1.publicJwk];
    let jwksFetches = 0;

    const env: IgateEnv = {
      DB: db,
      MID_ISSUER_URL: "https://id.moonwitness.biz.id",
      IGATE_CLIENT_ID: "igate-console",
    };

    const handler = createIgateHandler({
      probeFetch: async (input) => {
        const target = typeof input === "string" ? input : input.toString();
        if (target === "https://id.moonwitness.biz.id/.well-known/jwks.json") {
          jwksFetches += 1;
          return new Response(JSON.stringify({ keys: activeKeys }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });

    const nowSec = Math.floor(Date.now() / 1000);
    const makeToken = async (
      overrides: Record<string, unknown>,
      useRotatedKey = false,
    ): Promise<string> => {
      if (!useRotatedKey) {
        return signerV1.signJwt({
          iss: "https://id.moonwitness.biz.id",
          sub: "1",
          aud: "igate-console",
          exp: nowSec + 300,
          iat: nowSec,
          token_use: "access",
          preferred_username: "mwadmin",
          role: "admin",
          ...overrides,
        });
      }
      // Sign with signerV2 using jwkV2.kid.
      const pair = await globalThis.crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"],
      );
      const rawPub = (await globalThis.crypto.subtle.exportKey(
        "jwk",
        pair.publicKey,
      )) as PublicEs256Jwk;
      activeKeys = [
        signerV1.publicJwk,
        {
          kty: "EC",
          crv: "P-256",
          x: rawPub.x,
          y: rawPub.y,
          kid: jwkV2.kid,
          use: "sig",
          alg: "ES256",
        },
      ];
      const header = encodeBase64Url(
        TEXT_ENCODER.encode(JSON.stringify({ alg: "ES256", typ: "JWT", kid: jwkV2.kid })),
      );
      const body = encodeBase64Url(
        TEXT_ENCODER.encode(
          JSON.stringify({
            iss: "https://id.moonwitness.biz.id",
            sub: "1",
            aud: "igate-console",
            exp: nowSec + 300,
            iat: nowSec,
            token_use: "access",
            preferred_username: "mwadmin",
            role: "admin",
            ...overrides,
          }),
        ),
      );
      const input = `${header}.${body}`;
      const sig = await globalThis.crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        pair.privateKey,
        TEXT_ENCODER.encode(input),
      );
      return `${input}.${encodeBase64Url(new Uint8Array(sig))}`;
    };

    // Negative cross-client cases: moonwitness-web, moonwitness-memory, allah-sanctuary, missing aud, empty aud, ID token.
    for (const badOverrides of [
      { aud: "moonwitness-web" },
      { aud: "moonwitness-memory" },
      { aud: "allah-sanctuary" },
      { aud: ["moonwitness-web", "moonwitness-api"] },
      { aud: [] },
      { aud: "" },
      { token_use: "id", aud: "igate-console" },
    ]) {
      const badToken = await makeToken(badOverrides);
      const statusRes = await handler(
        new Request("https://igate.moonwitness.biz.id/api/status", {
          headers: { authorization: `Bearer ${badToken}` },
        }),
        env,
      );
      expect(statusRes.status).toBe(401);

      const probeRes = await handler(
        new Request("https://igate.moonwitness.biz.id/api/probe", {
          method: "POST",
          headers: { authorization: `Bearer ${badToken}` },
          body: JSON.stringify({ nodeId: "id-provider" }),
        }),
        env,
      );
      expect(probeRes.status).toBe(401);
    }

    const missingAudToken = await signerV1.signJwt({
      iss: "https://id.moonwitness.biz.id",
      sub: "1",
      exp: nowSec + 300,
      iat: nowSec,
      token_use: "access",
      role: "admin",
    });
    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${missingAudToken}` },
          }),
          env,
        )
      ).status,
    ).toBe(401);

    // Valid single-string and multi-audience tokens containing igate-console succeed & hit JWKS cache.
    const validSingle = await makeToken({ aud: "igate-console" });
    const validArray = await makeToken({ aud: ["igate-console", "rocksoul-igate-worker"] });

    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${validSingle}` },
          }),
          env,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${validArray}` },
          }),
          env,
        )
      ).status,
    ).toBe(200);
    expect(jwksFetches).toBe(1);

    // Rotated key within TTL refreshes JWKS and verifies igate-console token.
    const rotatedValid = await makeToken({ aud: "igate-console" }, true);
    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${rotatedValid}` },
          }),
          env,
        )
      ).status,
    ).toBe(200);
    expect(jwksFetches).toBe(2);

    // Custom IGATE_CLIENT_ID override rejects igate-console and accepts custom client ID.
    const customEnv: IgateEnv = { ...env, IGATE_CLIENT_ID: "igate-custom" };
    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${validSingle}` },
          }),
          customEnv,
        )
      ).status,
    ).toBe(401);
    const customToken = await makeToken({ aud: "igate-custom" });
    expect(
      (
        await handler(
          new Request("https://igate.moonwitness.biz.id/api/status", {
            headers: { authorization: `Bearer ${customToken}` },
          }),
          customEnv,
        )
      ).status,
    ).toBe(200);
  });
});
