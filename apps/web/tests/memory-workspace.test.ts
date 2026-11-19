import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createWitnessClaim,
  fetchMemoryServiceArchives,
  fetchMemoryServiceDashboard,
  fetchMemoryServiceJobs,
  fetchMemoryServiceKnowledge,
  fetchMemoryServiceSources,
  fetchMemoryServiceSystem,
  fetchWitnessClaimLineage,
  fetchWitnessClaims,
  getMemoryServiceExportUrl,
  linkWitnessClaims,
  resumeMemoryJob,
  triggerArchiveBackup,
  uploadMemoryArchive,
  verifyWitnessClaim,
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

  it("queries and mutates Witness Ledger endpoints (/api/memory/witness/*)", async () => {
    const fetchMock = stubJsonFetch({ claims: [], epistemic_types: ["fact"] });
    await fetchWitnessClaims({ epistemicType: "fact", q: "relay", limit: 20 });
    await createWitnessClaim({ statement: "Node A active", epistemic_type: "testimony" });
    await fetchWitnessClaimLineage("claim 1");
    await verifyWitnessClaim({ claim_id: "claim-1", action: "verify", reason: "Verified" });
    await linkWitnessClaims({
      source_claim_id: "claim-1",
      target_claim_id: "claim-2",
      relation_type: "supports",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/memory/witness/claims?epistemic_type=fact&q=relay&limit=20",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/memory/witness/claims");
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/memory/witness/claims/claim%201/lineage");
    expect(fetchMock.mock.calls[3]?.[0]).toBe("/api/memory/witness/verify");
    expect(fetchMock.mock.calls[3]?.[1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[4]?.[0]).toBe("/api/memory/witness/relations");
    expect(fetchMock.mock.calls[4]?.[1]?.method).toBe("POST");
  });
});
