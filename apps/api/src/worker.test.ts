import { afterEach, describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatementLike } from "@moonwitness/orm";
import worker, { resetWorkerForTests, type ApiWorkerEnv } from "./worker";

async function createInMemorySqliteD1(): Promise<D1DatabaseLike> {
  const { createClient } = await import("@libsql/client");
  const client = createClient({ url: ":memory:" });

  const makeStmt = (query: string, bound: unknown[] = []): D1PreparedStatementLike => ({
    bind(...values: unknown[]) {
      return makeStmt(query, values);
    },
    async all<T = Record<string, unknown>>() {
      const res = await client.execute({ sql: query, args: bound as never });
      const rows = res.rows.map((row) => {
        const tuple = row as unknown as unknown[];
        const record: Record<string, unknown> = {};
        res.columns.forEach((col, i) => {
          record[col] = tuple[i];
        });
        return record;
      });
      return { results: rows as T[] };
    },
    async run() {
      const res = await client.execute({ sql: query, args: bound as never });
      return {
        meta: {
          last_row_id: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
          changes: res.rowsAffected,
        },
      };
    },
  });

  return {
    prepare(query: string) {
      return makeStmt(query);
    },
    async batch(statements) {
      const results = [];
      for (const stmt of statements) {
        results.push(await stmt.run());
      }
      return results;
    },
  };
}

const originalEnv = { ...process.env };

afterEach(async () => {
  await resetWorkerForTests();
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
});

describe("API Cloudflare Worker adapter", () => {
  it("serves health, metadata, timeline validation, auth cookie flow, and command-center routes over D1", async () => {
    const d1 = await createInMemorySqliteD1();
    const env: ApiWorkerEnv = {
      DB: d1,
      NODE_ENV: "production",
      API_PREFIX: "/api/v1",
      DATABASE_URL: "d1:rocksoul-auth-db",
      CORS_ORIGINS: "https://moonwitness.biz.id,https://a-l-l-a-h.com",
      TRUSTED_PROXY_COUNT: "1",
      STORAGE_ACCESS_KEY: "test-storage-access-key",
      STORAGE_SECRET_KEY: "test-storage-secret-key-for-worker-test",
      MW_BOOTSTRAP_ADMIN_USERNAME: "mwadmin",
      MW_BOOTSTRAP_ADMIN_EMAIL: "mwadmin@moonwitness.biz.id",
      MW_BOOTSTRAP_ADMIN_PASSWORD: "worker-test-admin-password-2026",
      MW_BOOTSTRAP_ADMIN_DISPLAY_NAME: "MoonWitness Admin",
    };

    const preflightRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/auth/login", {
        method: "OPTIONS",
        headers: { origin: "https://moonwitness.biz.id" },
      }),
      env,
    );
    expect(preflightRes.status).toBe(204);
    expect(preflightRes.headers.get("access-control-allow-origin")).toBe(
      "https://moonwitness.biz.id",
    );

    const healthRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/healthz", {
        headers: { origin: "https://moonwitness.biz.id" },
      }),
      env,
    );
    expect(healthRes.status).toBe(200);
    expect(await healthRes.json()).toEqual({ status: "ok" });
    expect(healthRes.headers.get("x-content-type-options")).toBe("nosniff");

    const readyRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/readyz"),
      env,
    );
    expect(readyRes.status).toBe(200);
    expect(await readyRes.json()).toEqual({ status: "ready", database: "ok" });

    const metaRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/_meta/models"),
      env,
    );
    expect(metaRes.status).toBe(200);
    expect(await metaRes.json()).toEqual({ models: ["timeline.event", "timeline.era"] });

    const invalidLimitRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/timeline/events?limit=999"),
      env,
    );
    expect(invalidLimitRes.status).toBe(400);

    const eventsRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/timeline/events"),
      env,
    );
    expect(eventsRes.status).toBe(200);
    expect(await eventsRes.json()).toEqual({ data: [], total: 0 });

    const unauthCc = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/command-center/state"),
      env,
    );
    expect(unauthCc.status).toBe(401);

    const loginRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
        body: JSON.stringify({
          identifier: "mwadmin",
          password: "worker-test-admin-password-2026",
        }),
      }),
      env,
    );
    expect(loginRes.status).toBe(200);
    const cookie = loginRes.headers.get("set-cookie");
    expect(cookie).toContain("mw_session=");

    const cookieHeader = cookie!.split(";")[0]!;
    const meRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/auth/me", {
        headers: { cookie: cookieHeader },
      }),
      env,
    );
    expect(meRes.status).toBe(200);
    const meJson = (await meRes.json()) as { user: { username: string; role: string } };
    expect(meJson.user.username).toBe("mwadmin");
    expect(meJson.user.role).toBe("admin");

    const authCc = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/command-center/state", {
        headers: { cookie: cookieHeader },
      }),
      env,
    );
    expect(authCc.status).toBe(200);

    for (const path of [
      "/api/v1/control/health",
      "/api/v1/radius/health",
      "/api/v1/storage/health",
      "/api/v1/syslog/health",
      "/api/v1/snmp/health",
    ]) {
      const edgeRes = await worker.fetch(
        new Request(`https://api.moonwitness.biz.id${path}`, {
          headers: { cookie: cookieHeader },
        }),
        env,
      );
      expect(edgeRes.status).toBe(503);
      const edgeJson = (await edgeRes.json()) as {
        reachable: boolean;
        configured: boolean;
        mode: string;
      };
      expect(edgeJson).toMatchObject({
        reachable: false,
        configured: false,
        mode: "cloudflare-edge",
      });
    }

    const memoryStatusRes = await worker.fetch(
      new Request("https://api.moonwitness.biz.id/api/v1/memory/status", {
        headers: { cookie: cookieHeader },
      }),
      env,
    );
    expect(memoryStatusRes.status).toBe(200);
    expect(await memoryStatusRes.json()).toMatchObject({
      configured: false,
      reachable: false,
    });

    const seenBridgeHeaders: string[] = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const targetUrl =
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (targetUrl.startsWith("https://memory-edge.example.invalid")) {
        const hdrs = new Headers(init?.headers);
        seenBridgeHeaders.push(hdrs.get("x-moonwitness-bridge-token") ?? "");
        if (targetUrl.endsWith("/api/system")) {
          return new Response(
            JSON.stringify({
              mode: "local-first",
              gemini_configured: true,
              gemini_model: "gemini-3.8-flash",
              embeddings_enabled: true,
              embedding_model: "miniLM",
              drive_configured: false,
              moonwitness_sync_configured: false,
              max_upload_gb: 500,
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            archives: 1,
            messages: 2,
            knowledge: 3,
            active_jobs: 0,
            failed_jobs: 0,
          }),
          { status: 200 },
        );
      }
      return origFetch(input, init);
    }) as typeof fetch;

    try {
      const configuredEnv: ApiWorkerEnv = {
        ...env,
        MEMORY_API_URL: "https://memory-edge.example.invalid",
        BRIDGE_SHARED_TOKEN: "test-bridge-token-abcdef",
      };
      const bridgedRes = await worker.fetch(
        new Request("https://api.moonwitness.biz.id/api/v1/memory/status", {
          headers: { cookie: cookieHeader },
        }),
        configuredEnv,
      );
      expect(bridgedRes.status).toBe(200);
      expect(await bridgedRes.json()).toMatchObject({
        configured: true,
        reachable: true,
        counts: { knowledge: 3 },
      });
      expect(seenBridgeHeaders).toEqual(["test-bridge-token-abcdef", "test-bridge-token-abcdef"]);
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
