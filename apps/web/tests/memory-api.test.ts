import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMemoryKnowledge,
  fetchMemoryStatus,
  formatMemoryContextPrompt,
  getMemoryExportUrl,
} from "../src/lib/api/memory";

describe("memory api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches status with credentials and no-store caching", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: true,
          reachable: true,
          system: {
            mode: "local-first",
            gemini_configured: false,
            gemini_model: "gemini-2.5-flash",
            embeddings_enabled: true,
            embedding_model: "text-embedding-004",
            drive_configured: false,
            moonwitness_sync_configured: true,
            max_upload_gb: 15,
          },
          counts: {
            archives: 1,
            messages: 120,
            knowledge: 8,
            active_jobs: 0,
            failed_jobs: 0,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const status = await fetchMemoryStatus();
    expect(status.reachable).toBe(true);
    expect(status.counts?.knowledge).toBe(8);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/memory/status",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("encodes search query and clamps limit when querying knowledge records", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: true,
          query: "port map",
          records: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchMemoryKnowledge({ q: "  port map  ", limit: 250 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/memory/knowledge?q=port+map&limit=100",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("throws status-annotated errors and formats prompt context cleanly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ error: "Archive memory bridge is not configured" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(fetchMemoryKnowledge()).rejects.toMatchObject({
      message: "Archive memory bridge is not configured",
      status: 503,
    });

    expect(getMemoryExportUrl()).toBe("/api/v1/memory/export.ndjson");
    expect(
      formatMemoryContextPrompt({
        id: "k-1",
        kind: "architecture",
        title: "Port Map",
        summary: "Five apps without port collisions.",
        content: "web:3000 api:3002 allah:3003 memory-web:3005 rocksoul:1420",
        tags: ["ports", "topology"],
        entities: [],
        source_message_ids: [],
        confidence: 0.9,
      }),
    ).toBe(
      "[Archive Knowledge: Port Map (architecture)]\nSummary: Five apps without port collisions.\nweb:3000 api:3002 allah:3003 memory-web:3005 rocksoul:1420\nTags: ports, topology",
    );
  });
});
