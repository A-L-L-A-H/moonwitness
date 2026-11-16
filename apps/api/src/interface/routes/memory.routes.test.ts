import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

async function loadMemoryApp(
  memoryApiUrl?: string,
  authenticated = true,
): Promise<FastifyInstance> {
  vi.unstubAllEnvs();
  if (memoryApiUrl === undefined) {
    vi.stubEnv("MEMORY_API_URL", "");
  } else {
    vi.stubEnv("MEMORY_API_URL", memoryApiUrl);
  }

  vi.doMock("../../middleware/auth", () => ({
    requireAuth: () => async (request: FastifyRequest, reply: FastifyReply) => {
      if (!authenticated) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      (request as { user?: unknown }).user = {
        id: 1,
        username: "operator",
        email: "operator@moonwitness.local",
        role: "admin",
        displayName: "Operator",
      };
    },
  }));

  vi.resetModules();
  const { memoryRoutes } = await import("./memory.routes");
  const app = Fastify({ logger: false });
  await app.register(memoryRoutes, { prefix: "/api/v1" });
  await app.ready();
  return app;
}

describe("memory bridge routes", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    await app?.close();
    app = null;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.doUnmock("../../middleware/auth");
  });

  it("rejects unauthenticated callers on all memory endpoints", async () => {
    app = await loadMemoryApp("http://127.0.0.1:8000", false);

    const status = await app.inject({ method: "GET", url: "/api/v1/memory/status" });
    const knowledge = await app.inject({ method: "GET", url: "/api/v1/memory/knowledge" });
    const exportRes = await app.inject({ method: "GET", url: "/api/v1/memory/export.ndjson" });

    expect(status.statusCode).toBe(401);
    expect(knowledge.statusCode).toBe(401);
    expect(exportRes.statusCode).toBe(401);
  });

  it("reports unconfigured status cleanly and returns 503 for knowledge and export", async () => {
    app = await loadMemoryApp(undefined);

    const status = await app.inject({ method: "GET", url: "/api/v1/memory/status" });
    expect(status.statusCode).toBe(200);
    expect(status.headers["cache-control"]).toBe("no-store");
    expect(status.json()).toEqual({
      configured: false,
      reachable: false,
      system: null,
      counts: null,
    });

    const knowledge = await app.inject({ method: "GET", url: "/api/v1/memory/knowledge" });
    expect(knowledge.statusCode).toBe(503);

    const exportRes = await app.inject({ method: "GET", url: "/api/v1/memory/export.ndjson" });
    expect(exportRes.statusCode).toBe(503);
  });

  it("blocks invalid non-loopback metadata URLs without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    app = await loadMemoryApp("http://169.254.169.254");

    const status = await app.inject({ method: "GET", url: "/api/v1/memory/status" });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({
      configured: true,
      reachable: false,
      system: null,
      counts: null,
    });
    expect((status.json() as { error?: string }).error).toContain("MEMORY_API_URL");

    const knowledge = await app.inject({ method: "GET", url: "/api/v1/memory/knowledge" });
    expect(knowledge.statusCode).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches status, queries search/list with clamped limits, and exports NDJSON", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/system")) {
        return new Response(
          JSON.stringify({
            mode: "local-first",
            gemini_configured: true,
            gemini_model: "gemini-2.5-flash",
            embeddings_enabled: true,
            embedding_model: "text-embedding-004",
            drive_configured: false,
            moonwitness_sync_configured: true,
            max_upload_gb: 15,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.endsWith("/api/dashboard")) {
        return new Response(
          JSON.stringify({
            archives: 2,
            messages: 1840,
            knowledge: 37,
            active_jobs: 0,
            failed_jobs: 0,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("/api/knowledge")) {
        return new Response(
          JSON.stringify([
            {
              id: "k-1",
              kind: "architecture",
              title: "Unified Monorepo Consolidation",
              summary: "Canonical 5-app port map",
              content: "apps/memory runs on web 3005 and backend 8000.",
              tags: ["architecture", "ports"],
              entities: ["moonwitness-memory"],
              source_message_ids: ["m-1"],
              confidence: 0.96,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.includes("/api/search")) {
        return new Response(
          JSON.stringify([
            {
              id: "k-2",
              kind: "decision",
              title: "ROCKSOUL Desktop Separation",
              summary: "Standalone Tauri v2 workspace",
              content: "SQLite local vault stays sovereign on desktop.",
              tags: ["rocksoul"],
              entities: ["rocksoul-dx"],
              source_message_ids: [],
              confidence: 0.92,
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.endsWith("/api/export.ndjson")) {
        return new Response('{"id":"k-1","title":"Unified Monorepo Consolidation"}\n', {
          status: 200,
          headers: { "content-type": "application/x-ndjson" },
        });
      }
      return new Response("Not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    app = await loadMemoryApp("http://127.0.0.1:8000");

    const status = await app.inject({ method: "GET", url: "/api/v1/memory/status" });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({
      configured: true,
      reachable: true,
      system: { mode: "local-first", gemini_model: "gemini-2.5-flash" },
      counts: { archives: 2, knowledge: 37 },
    });

    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/memory/knowledge?limit=999",
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json()).toMatchObject({
      configured: true,
      query: "",
      records: [{ id: "k-1", title: "Unified Monorepo Consolidation" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://127.0.0.1:8000/api/knowledge?limit=100" }),
      expect.anything(),
    );

    const searchRes = await app.inject({
      method: "GET",
      url: "/api/v1/memory/knowledge?q=ROCKSOUL&limit=5",
    });
    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.json()).toMatchObject({
      configured: true,
      query: "ROCKSOUL",
      records: [{ id: "k-2", title: "ROCKSOUL Desktop Separation" }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ href: "http://127.0.0.1:8000/api/search?q=ROCKSOUL&limit=5" }),
      expect.anything(),
    );

    const exportRes = await app.inject({
      method: "GET",
      url: "/api/v1/memory/export.ndjson",
    });
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.headers["cache-control"]).toBe("no-store");
    expect(exportRes.headers["content-type"]).toContain("application/x-ndjson");
    expect(exportRes.body).toContain("Unified Monorepo Consolidation");
  });

  it("degrades status and returns 502 on knowledge/export when upstream fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Upstream error", { status: 500 })),
    );
    app = await loadMemoryApp("http://127.0.0.1:8000");

    const status = await app.inject({ method: "GET", url: "/api/v1/memory/status" });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({
      configured: true,
      reachable: false,
      system: null,
      counts: null,
    });

    const knowledge = await app.inject({ method: "GET", url: "/api/v1/memory/knowledge" });
    expect(knowledge.statusCode).toBe(502);

    const exportRes = await app.inject({ method: "GET", url: "/api/v1/memory/export.ndjson" });
    expect(exportRes.statusCode).toBe(502);
  });
});
