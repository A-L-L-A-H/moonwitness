import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTimelineEvents, fetchTimelineRelatedEvents } from "../src/lib/api/timeline";

describe("timeline API client bounds", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caps event page size at the API limit", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await fetchTimelineEvents({ limit: 500, offset: 20 }, "/api/v1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/timeline/events?limit=100&offset=20",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("returns available related records when a stale relationship is missing", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "evt-001", related: [] } }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "missing" }), { status: 404 }));
    vi.stubGlobal("fetch", fetch);

    await expect(fetchTimelineRelatedEvents(["evt-001", "stale-id"])).resolves.toEqual([
      { id: "evt-001", related: [] },
    ]);
  });
});
