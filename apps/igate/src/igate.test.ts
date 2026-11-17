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
});
