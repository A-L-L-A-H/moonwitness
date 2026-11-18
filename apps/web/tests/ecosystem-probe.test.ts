import { describe, expect, it } from "vitest";
import {
  probeEcosystemHealth,
  probeLocalGit,
  type FetchLike,
  type GitRunnerLike,
} from "@/lib/ecosystem-probe";

describe("ecosystem-probe", () => {
  it("summarizes live services, timeline metrics, and dirty git worktree state", async () => {
    const fetchFn: FetchLike = async (url) => {
      if (url.endsWith("/api/v1/healthz")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (url.endsWith("/api/v1/readyz")) {
        return new Response(JSON.stringify({ database: "ok" }), { status: 200 });
      }
      if (url.endsWith("/api/v1/timeline/stats")) {
        return new Response(JSON.stringify({ data: { total: 12 } }), { status: 200 });
      }
      if (url.endsWith("/api/v1/timeline/eras")) {
        return new Response(JSON.stringify({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }), {
          status: 200,
        });
      }
      if (url.includes(":3000")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.includes(":8787")) {
        return new Response("unauthorized", { status: 401 });
      }
      throw new Error("ECONNREFUSED");
    };

    const gitRunner: GitRunnerLike = async (args) => {
      const cmd = args.join(" ");
      if (cmd.includes("--abbrev-ref")) return "dev";
      if (cmd.includes("--short HEAD")) return "c5a873b";
      if (cmd.includes("status --porcelain")) return " M apps/rocksoul/src/App.tsx\n?? new.ts";
      if (cmd.includes("log -1")) return "feat: unify canon SSOT\x1f2 hours ago";
      return null;
    };

    const snapshot = await probeEcosystemHealth({ fetchFn, gitRunner });

    expect(snapshot.status).toBe("online");
    expect(snapshot.databaseStatus).toBe("ok");
    expect(snapshot.timelineTotal).toBe(12);
    expect(snapshot.erasCount).toBe(3);

    expect(snapshot.services.map((s) => [s.id, s.status, s.httpStatus, s.source])).toEqual([
      ["web", "online", 200, "live-http-probe"],
      ["api", "online", 200, "live-http-probe"],
      ["arsy", "degraded", 401, "live-http-probe"],
      ["memory", "offline", null, "unmeasured"],
    ]);
    expect(typeof snapshot.services[0]?.measuredAt).toBe("string");
    expect(snapshot.services[3]?.latencyMs).toBeNull();
    expect(snapshot.services[3]?.measuredAt).toBeNull();

    expect(snapshot.git).toEqual({
      available: true,
      branch: "dev",
      headShort: "c5a873b",
      dirtyCount: 2,
      lastCommitSubject: "feat: unify canon SSOT",
      lastCommitAge: "2 hours ago",
    });
  });

  it("handles offline API and absent git directory without throwing", async () => {
    const snapshot = await probeEcosystemHealth({
      fetchFn: async () => {
        throw new Error("connection refused");
      },
      gitRunner: async () => null,
    });

    expect(snapshot.status).toBe("offline");
    expect(snapshot.databaseStatus).toBeNull();
    expect(snapshot.timelineTotal).toBeNull();
    expect(snapshot.erasCount).toBeNull();
    expect(snapshot.services.every((s) => s.status === "offline")).toBe(true);
    expect(snapshot.git).toEqual({
      available: false,
      branch: null,
      headShort: null,
      dirtyCount: 0,
      lastCommitSubject: null,
      lastCommitAge: null,
    });
  });

  it("reports zero dirty files for a clean git worktree", async () => {
    const git = await probeLocalGit(async (args) => {
      const cmd = args.join(" ");
      if (cmd.includes("--abbrev-ref")) return "main";
      if (cmd.includes("--short HEAD")) return "abc1234";
      if (cmd.includes("status --porcelain")) return "";
      if (cmd.includes("log -1")) return "chore: release\x1fjust now";
      return null;
    });

    expect(git.available).toBe(true);
    expect(git.dirtyCount).toBe(0);
    expect(git.branch).toBe("main");
  });

  it("reports runtimeMode and probes public edge endpoints cleanly", async () => {
    const fetchFn: FetchLike = async (url) => {
      if (url.startsWith("https://codex.a-l-l-a-h.com")) {
        return new Response("ok", { status: 200 });
      }
      if (url.startsWith("https://community.moonwitness.biz.id")) {
        return new Response("ok", { status: 200 });
      }
      if (url.startsWith("https://moonwitness-radio.bjo163.workers.dev")) {
        return new Response("ok", { status: 200 });
      }
      if (url.startsWith("https://igate.moonwitness.biz.id")) {
        return new Response("ok", { status: 200 });
      }
      throw new Error("connection refused");
    };

    const snapshot = await probeEcosystemHealth({
      fetchFn,
      gitRunner: async () => null,
      runtimeMode: "cloudflare-edge",
    });

    expect(snapshot.healthContract).toBe("moonwitness.health/v1");
    expect(snapshot.runtimeMode).toBe("cloudflare-edge");
    expect(snapshot.edges.map((e) => [e.id, e.status, e.httpStatus])).toEqual([
      ["codex-edge", "online", 200],
      ["community", "online", 200],
      ["radio", "online", 200],
      ["igate", "online", 200],
    ]);
  });

  it("auto-detects cloudflare-edge via WebSocketPair and skips loopback probes", async () => {
    const requestedUrls: string[] = [];
    const originalFetch = globalThis.fetch;
    const globalObj = globalThis as { WebSocketPair?: unknown };
    const originalWebSocketPair = globalObj.WebSocketPair;

    globalObj.WebSocketPair = function MockWebSocketPair() {};
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      requestedUrls.push(url);
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    try {
      const snapshot = await probeEcosystemHealth();
      expect(snapshot.runtimeMode).toBe("cloudflare-edge");
      expect(snapshot.git.available).toBe(false);
      expect(requestedUrls.some((url) => url.includes("127.0.0.1"))).toBe(false);
      expect(requestedUrls).toEqual([
        "https://codex.a-l-l-a-h.com/health",
        "https://community.moonwitness.biz.id/",
        "https://moonwitness-radio.bjo163.workers.dev/health",
        "https://igate.moonwitness.biz.id/health",
      ]);
      expect(
        snapshot.services.every((svc) => svc.status === "offline" && svc.httpStatus === null),
      ).toBe(true);
      expect(
        snapshot.edges.every((edge) => edge.status === "online" && edge.httpStatus === 200),
      ).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalWebSocketPair === undefined) {
        delete globalObj.WebSocketPair;
      } else {
        globalObj.WebSocketPair = originalWebSocketPair;
      }
    }
  });

  it("queries live D1 governance counts, releases, and docs when DB binding is present", async () => {
    const mockDb = {
      prepare(sql: string) {
        return {
          async all<T>() {
            if (sql.includes("UNION ALL")) {
              return {
                results: [
                  { tbl: "milestones", cnt: 5 },
                  { tbl: "tasks", cnt: 18 },
                  { tbl: "docs", cnt: 7 },
                  { tbl: "releases", cnt: 2 },
                ] as T[],
              };
            }
            if (sql.includes("codex_releases")) {
              return {
                results: [
                  { tag_name: "v0.4.2", title: "Release v0.4.2", channel: "stable" },
                ] as T[],
              };
            }
            return {
              results: [
                { id: "doc-rule-01", category: "RULE", title: "RULE-01", version: "v0.4.0" },
              ] as T[],
            };
          },
        };
      },
    };

    const snapshot = await probeEcosystemHealth({
      fetchFn: async () => new Response("ok", { status: 200 }),
      gitRunner: async () => null,
      db: mockDb,
    });

    expect(snapshot.codexGovernance.source).toBe("cloudflare-d1");
    expect(snapshot.codexGovernance.milestonesCount).toBe(5);
    expect(snapshot.codexGovernance.releasesCount).toBe(2);
    expect(snapshot.codexGovernance.latestReleases[0]?.tag).toBe("v0.4.2");
  });

  it("uses cfEnv WEB_INTERNAL_URL and API_INTERNAL_URL in cloudflare-edge mode", async () => {
    const requestedUrls: string[] = [];
    const fetchFn: FetchLike = async (url) => {
      requestedUrls.push(url);
      if (url === "https://api.moonwitness.biz.id/api/v1/healthz") {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }
      if (url === "https://api.moonwitness.biz.id/api/v1/readyz") {
        return new Response(JSON.stringify({ status: "ok", database: "ok" }), { status: 200 });
      }
      if (url === "https://api.moonwitness.biz.id/api/v1/timeline/stats") {
        return new Response(JSON.stringify({ data: { total: 22 } }), { status: 200 });
      }
      if (url === "https://api.moonwitness.biz.id/api/v1/timeline/eras") {
        return new Response(
          JSON.stringify({ data: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }] }),
          { status: 200 },
        );
      }
      return new Response("ok", { status: 200 });
    };

    const snapshot = await probeEcosystemHealth({
      runtimeMode: "cloudflare-edge",
      fetchFn,
      gitRunner: async () => null,
      db: null,
      cfEnv: {
        WEB_INTERNAL_URL: "https://moonwitness.biz.id/",
        API_INTERNAL_URL: "https://api.moonwitness.biz.id/",
        ARSY_URL: "https://arsy.example.invalid/",
        MEMORY_API_URL: "https://memory.example.invalid/",
      },
    });

    expect(requestedUrls).toContain("https://moonwitness.biz.id");
    expect(requestedUrls).toContain("https://api.moonwitness.biz.id/api/v1/healthz");
    expect(requestedUrls).toContain("https://api.moonwitness.biz.id/api/v1/readyz");
    expect(requestedUrls).toContain("https://arsy.example.invalid/v1/health");
    expect(requestedUrls).toContain("https://memory.example.invalid/health");
    expect(snapshot.runtimeMode).toBe("cloudflare-edge");
    expect(snapshot.status).toBe("online");
    expect(snapshot.databaseStatus).toBe("ok");
    expect(snapshot.timelineTotal).toBe(22);
    expect(snapshot.erasCount).toBe(5);
    expect(snapshot.services.find((svc) => svc.id === "web")).toMatchObject({
      status: "online",
      httpStatus: 200,
    });
    expect(snapshot.services.find((svc) => svc.id === "api")).toMatchObject({
      status: "online",
      httpStatus: 200,
    });
    expect(snapshot.services.find((svc) => svc.id === "arsy")).toMatchObject({
      status: "online",
      url: "https://arsy.example.invalid",
      httpStatus: 200,
    });
    expect(snapshot.services.find((svc) => svc.id === "memory")).toMatchObject({
      status: "online",
      url: "https://memory.example.invalid",
      httpStatus: 200,
    });
  });
});
