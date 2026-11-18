import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-base";
import { auditAddon } from "@moonwitness/addon-audit";
import { authAddon } from "@moonwitness/addon-auth";
import { witnessResearchAddon, witnessClaimModel } from "./index.js";

describe("@moonwitness/addon-witness-research", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-wr-"));
    dirs.push(dir);
    await initDb(join(dir, "wr.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("syncs ADR-006 research models cleanly and creates witness claims", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      witnessResearchAddon,
    ]);
    expect(syncReport.createdTables).toEqual(
      expect.arrayContaining([
        "wr_knowledge_sources",
        "wr_witness_claims",
        "wr_research_runs",
        "wr_sidra_edges",
      ]),
    );

    const claim = await witnessClaimModel.repository.create(
      {
        claim_key: "clm-001",
        statement: "Primary telemetry timestamp agrees with witness log",
        tier: "tier1",
        confidence: 0.92,
        verdict: "supported",
      },
      createActorContext("ed-1", "api"),
    );
    expect(claim.verdict).toBe("supported");
  });
});
