import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMemoryServiceArchives,
  fetchMemoryServiceDashboard,
  fetchMemoryServiceJobs,
  fetchMemoryServiceKnowledge,
  fetchMemoryServiceSources,
  fetchMemoryServiceSystem,
  getMemoryServiceExportUrl,
  resumeMemoryJob,
  triggerArchiveBackup,
  uploadMemoryArchive,
} from "../src/lib/api/memory";

function stubJsonFetch(payload: unknown, status = 200) {
  const fn = vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("memory companion service client (/api/memory)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queries system, dashboard, archives, jobs, knowledge, and search endpoints", async () => {
    const fetchMock = stubJsonFetch([]);
    await fetchMemoryServiceSystem();
    await fetchMemoryServiceDashboard();
    await fetchMemoryServiceArchives(50);
    await fetchMemoryServiceJobs(25);
    await fetchMemoryServiceKnowledge({ limit: 12 });
    await fetchMemoryServiceKnowledge({ q: "lunar relay", limit: 15 });
    await fetchMemoryServiceSources("k 1");

    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      "/api/memory/system",
      "/api/memory/dashboard",
      "/api/memory/archives?limit=50",
      "/api/memory/jobs?limit=25",
      "/api/memory/knowledge?limit=12",
      "/api/memory/search?q=lunar%20relay&limit=15",
      "/api/memory/knowledge/k%201/sources",
    ]);
    expect(getMemoryServiceExportUrl()).toBe("/api/memory/export.ndjson");
  });

  it("posts archive upload, drive backup, and checkpoint job resume", async () => {
    const fetchMock = stubJsonFetch({ status: "queued", job_id: "j1", archive_id: "a1" });
    await triggerArchiveBackup("a 1");
    await resumeMemoryJob("j 1");
    const file = new File(["{}"], "conversations.json", { type: "application/json" });
    await uploadMemoryArchive(file);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/memory/archives/a%201/backup");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/memory/jobs/j%201/resume");
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/memory/archives");
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe("POST");
  });
});
