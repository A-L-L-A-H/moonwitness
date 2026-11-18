import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { createProbesAddon, probeNodeModel, probesAddon } from "./index.js";

describe("../probes", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-probes-"));
    dirs.push(dir);
    await initDb(join(dir, "probes.db"));
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

  it("syncs probe models cleanly and imports legacy igate_nodes", async () => {
    await getDb().run(
      `CREATE TABLE igate_nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1
      )`,
    );
    await getDb().run(
      `INSERT INTO igate_nodes (id, name, target_url, category, enabled)
       VALUES ('edge-1', 'Edge API', 'https://api.moonwitness.biz.id/health', 'api', 1)`,
    );

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      probesAddon,
    ]);

    const rows = await probeNodeModel.repository.find({ node_key: "edge-1" });
    expect(rows).toHaveLength(1);
    const view = await runtime.getViewDescriptor("probe.node", "editor");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/probes/nodes");
    expect(view?.actionBindings.createUrl).toBe("/api/v1/m/probe.node");
    expect(view?.actionBindings.customActions?.[0]).toMatchObject({
      id: "run_probe",
      method: "POST",
      urlTemplate: "/api/v1/probes/run",
    });
  });

  it("self-mounts /api/v1/probes/* & /api/v1/igate/* routes and seeds DEFAULT_PROBE_NODES via seed()", async () => {
    const app = Fastify({ logger: false });
    app.addHook("preHandler", async (request) => {
      (request as { user?: { id: string; role: string } }).user = { id: "op-1", role: "editor" };
    });

    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        createProbesAddon({ prefix: "/api/v1" }),
      ],
      app,
      { runSeeds: true },
    );
    await app.ready();

    try {
      const nodesRes = await app.inject({ method: "GET", url: "/api/v1/probes/nodes" });
      expect(nodesRes.statusCode).toBe(200);
      expect((nodesRes.json().nodes as unknown[]).length).toBeGreaterThanOrEqual(5);

      const eventsRes = await app.inject({ method: "GET", url: "/api/v1/probes/events" });
      expect(eventsRes.statusCode).toBe(200);

      const igateRes = await app.inject({ method: "GET", url: "/api/v1/igate/status" });
      expect(igateRes.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
