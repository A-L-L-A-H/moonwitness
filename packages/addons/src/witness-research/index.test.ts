import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { createWitnessResearchAddon, witnessResearchAddon, witnessClaimModel } from "./index.js";

describe("../witness-research", () => {
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

  it("exposes OX-DX ontology zones and WSI frame evaluation via Fastify routes", async () => {
    const editorAuth: BaseAddonAuthBridge = {
      authenticate: async () => {},
      requireRole: () => async () => {},
      getActorId: () => "ed-1",
      getActorRole: () => "editor",
    };

    const app = Fastify();
    const addon = createWitnessResearchAddon({ prefix: "/api/v1", auth: editorAuth });
    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        addon,
      ],
      app,
    );

    const zonesRes = await app.inject({
      method: "GET",
      url: "/api/v1/witness/ontology/zones?q=UNIVERSE",
    });
    expect(zonesRes.statusCode).toBe(200);
    const zonesBody = zonesRes.json() as {
      contract: { valid: boolean; levelCount: number };
      levels: Array<{ level: string }>;
    };
    expect(zonesBody.contract).toEqual({ valid: true, levelCount: 49, mismatches: [] });
    expect(zonesBody.levels).toHaveLength(1);
    expect(zonesBody.levels[0]?.level).toBe("01 UNIVERSE");

    const frameRes = await app.inject({
      method: "POST",
      url: "/api/v1/witness/evaluate-frame",
      payload: {
        statement: "Sensor clock skew aligned across nodes",
        sourceRef: "log-anchor-1",
        agent: "op-1",
        recipient: "core-api",
        domain: "telemetry",
        scope: "cluster",
        genre: "audit",
        swingDepth: 2,
      },
    });
    expect(frameRes.statusCode).toBe(200);
    const frameBody = frameRes.json() as {
      frame: { frameStatus: string; rotations: unknown[] };
      contract: { valid: boolean };
    };
    expect(frameBody.frame.frameStatus).toBe("ONSIDE");
    expect(frameBody.frame.rotations).toHaveLength(2);
    expect(frameBody.contract.valid).toBe(true);
    await app.close();
  });
});
