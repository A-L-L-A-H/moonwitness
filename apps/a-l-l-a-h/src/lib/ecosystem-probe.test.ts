import { describe, expect, it } from "vitest";
import {
  probeEcosystemHealth,
  probeLocalGit,
  type FetchLike,
  type GitRunnerLike,
} from "./ecosystem-probe";

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

    expect(snapshot.services.map((s) => [s.id, s.status, s.httpStatus])).toEqual([
      ["web", "online", 200],
      ["api", "online", 200],
      ["arsy", "degraded", 401],
      ["memory", "offline", null],
    ]);

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
      throw new Error("connection refused");
    };

    const snapshot = await probeEcosystemHealth({
      fetchFn,
      gitRunner: async () => null,
      runtimeMode: "cloudflare-edge",
    });

    expect(snapshot.runtimeMode).toBe("cloudflare-edge");
    expect(snapshot.edges.map((e) => [e.id, e.status, e.httpStatus])).toEqual([
      ["codex-edge", "online", 200],
      ["community", "online", 200],
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
        "https://codex.a-l-l-a-h.com/",
        "https://community.moonwitness.biz.id/",
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
});
