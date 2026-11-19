import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, getDb, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon } from "../auth";
import { commandCenterAddon, createCommandCenterAddon, workflowModel } from "./index.js";

describe("../command-center", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-cc-"));
    dirs.push(dir);
    await initDb(join(dir, "cc.db"));
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

  it("backfills legacy workflows and publishes state-machine actionBindings", async () => {
    await getDb().run(
      `CREATE TABLE command_center_workflows (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        name TEXT NOT NULL,
        detail TEXT NOT NULL,
        status TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`,
    );
    await getDb().run(
      `INSERT INTO command_center_workflows (id, actor_id, name, detail, status, sort_order)
       VALUES ('wf-legacy-1', '1', 'Build Index', 'Syncing shards', 'Queued', 0)`,
    );

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      commandCenterAddon,
    ]);

    const rows = await workflowModel.repository.find({ workflow_key: "wf-legacy-1" });
    expect(rows).toHaveLength(1);
    const view = await runtime.getViewDescriptor("command.workflow", "editor");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/command-center/state");
    expect(view?.actionBindings.customActions?.[0]).toMatchObject({
      id: "toggle",
      method: "PATCH",
      urlTemplate: "/api/v1/command-center/workflows/{id}/toggle",
    });

    const alertView = await runtime.getViewDescriptor("command.alert", "editor");
    expect(alertView?.actionBindings.listUrl).toBe("/api/v1/command-center/state");
    expect(alertView?.actionBindings.createUrl).toBeUndefined();
    expect(alertView?.actionBindings.customActions?.[0]).toMatchObject({
      id: "dismiss",
      method: "DELETE",
      urlTemplate: "/api/v1/command-center/alerts/{id}",
    });
  });

  it("self-mounts /api/v1/command-center/* routes and isolates tenant workflows", async () => {
    const app = Fastify({ logger: false });
    app.addHook("preHandler", async (request) => {
      const tenant = request.headers["x-tenant-id"];
      (
        request as { user?: { id: string; role: string; tenantId?: string }; tenantId?: string }
      ).user = {
        id: "op-1",
        role: "editor",
        tenantId: typeof tenant === "string" ? tenant : "default",
      };
      (request as { tenantId?: string }).tenantId = typeof tenant === "string" ? tenant : "default";
    });

    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        auditAddon,
        authAddon,
        createCommandCenterAddon({ prefix: "/api/v1" }),
      ],
      app,
    );
    await app.ready();

    try {
      const createRes = await app.inject({
        method: "POST",
        url: "/api/v1/command-center/workflows",
        headers: { "x-tenant-id": "tenant-a" },
        payload: { name: "Alpha Workflow", detail: "isolated to tenant-a" },
      });
      expect(createRes.statusCode).toBe(201);

      const stateA = await app.inject({
        method: "GET",
        url: "/api/v1/command-center/state",
        headers: { "x-tenant-id": "tenant-a" },
      });
      expect(stateA.statusCode).toBe(200);
      expect(
        (stateA.json().workflows as Array<{ name: string }>).some(
          (w) => w.name === "Alpha Workflow",
        ),
      ).toBe(true);

      const stateB = await app.inject({
        method: "GET",
        url: "/api/v1/command-center/state",
        headers: { "x-tenant-id": "tenant-b" },
      });
      expect(stateB.statusCode).toBe(200);
      expect(
        (stateB.json().workflows as Array<{ name: string }>).some(
          (w) => w.name === "Alpha Workflow",
        ),
      ).toBe(false);
    } finally {
      await app.close();
    }
  });
});
