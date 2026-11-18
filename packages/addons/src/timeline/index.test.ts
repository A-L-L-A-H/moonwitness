import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import { AddonRuntimeController, baseManifest } from "@moonwitness/addon-runtime";
import {
  createTimelineAddon,
  TimelineRepository,
  seedTimeline,
  timelineAddon,
  timelineManifest,
} from "./index.js";

describe("timeline addon (zero-migration Odoo++ pilot)", () => {
  const createdDirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-addon-timeline-"));
    createdDirs.push(dir);
    await initDb(join(dir, "timeline.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of createdDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("syncs timeline tables with zero migration files and registers actionBindings", async () => {
    expect(timelineManifest.name).toBe("timeline");
    expect(timelineManifest.provides.migrations).toEqual([]);

    const runtime = new AddonRuntimeController();
    const { order, syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      timelineAddon,
    ]);

    expect(order).toEqual(["__base", "timeline"]);
    expect(syncReport.createdTables).toContain("timeline_events");
    expect(syncReport.createdTables).toContain("timeline_eras");

    const view = await runtime.getViewDescriptor("timeline.event", "editor");
    expect(view?.extensible).toBe(true);
    expect(view?.actionBindings.createUrl).toBe("/api/v1/timeline/events");
    expect(view?.acl.canCreate).toBe(true);
    expect(view?.acl.canDelete).toBe(false);
  });

  it("supports full event CRUD, archive/restore, history, era upsert, and _attrs custom fields", async () => {
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      timelineAddon,
    ]);
    await runtime.registerCustomField("timeline.event", {
      field_name: "cust_verifier",
      field_type: "text",
      label: "Verifier",
    });

    await seedTimeline();
    const repo = new TimelineRepository();
    const actor = createActorContext("admin-1", "api", "req-tl-1");

    const era = await repo.upsertEra(
      {
        id: "origins",
        name: "Origins",
        years: "2020-2022",
        tagline: "Start",
        color: "#3b82f6",
      },
      actor,
    );
    expect(era.id).toBe("origins");

    const created = await repo.createEvent(
      {
        kind: "PROJECT",
        date: "2026-11-18",
        era: "origins",
        title: "Relay Activation",
        excerpt: "Relay came online.",
        body: "Full relay log.",
        location: "Bandung",
        tags: ["relay"],
        sources: 1,
        notes: 0,
        image: "hero-witness",
        related: [],
        _attrs: { cust_verifier: "witness-alpha" },
      } as Parameters<TimelineRepository["createEvent"]>[0],
      actor,
    );
    expect(created.id).toBeTruthy();
    expect((created as { _attrs?: Record<string, unknown> })._attrs).toEqual({
      cust_verifier: "witness-alpha",
    });

    const updated = await repo.updateEvent(created.id, { title: "Relay Activated" }, actor);
    expect(updated?.title).toBe("Relay Activated");

    await repo.archiveEvent(created.id, actor);
    await repo.restoreEvent(created.id, actor);
    await repo.deleteEvent(created.id, actor);
    expect(await repo.getEvent(created.id)).toBeNull();

    const history = await repo.getEventHistory(created.id);
    expect(history.map((h) => h.action)).toEqual([
      "CREATE",
      "UPDATE",
      "ARCHIVE",
      "RESTORE",
      "DELETE",
    ]);
  });

  it("mounts /api/v1/timeline/* from createTimelineAddon, isolates tenantId, avoids double listEvents, and fixes timeline.era actionBindings", async () => {
    const repo = new TimelineRepository();
    const listSpy = vi.spyOn(repo, "listEvents");
    const app = Fastify({ logger: false });
    app.addHook("preHandler", async (request) => {
      const tenantHeader = request.headers["x-tenant-id"];
      const roleHeader = request.headers["x-role"];
      (request as { user?: { id: string; role: string; tenantId?: string }; tenantId?: string }).user =
        roleHeader
          ? {
              id: "user-1",
              role: String(roleHeader),
              tenantId: typeof tenantHeader === "string" ? tenantHeader : "default",
            }
          : undefined;
      (request as { tenantId?: string }).tenantId =
        typeof tenantHeader === "string" ? tenantHeader : "default";
    });

    const runtime = new AddonRuntimeController();
    await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        createTimelineAddon({ prefix: "/api/v1", repository: repo, seedDemo: false }),
      ],
      app,
    );
    await app.ready();

    try {
      const eraView = await runtime.getViewDescriptor("timeline.era", "editor");
      expect(eraView?.actionBindings.listUrl).toBe("/api/v1/timeline/eras");
      expect(eraView?.actionBindings.createUrl).toBe("/api/v1/m/timeline.era");

      const createdA = await app.inject({
        method: "POST",
        url: "/api/v1/timeline/events",
        headers: { "x-role": "editor", "x-tenant-id": "tenant-a" },
        payload: {
          kind: "PROJECT",
          date: "2026-11-18",
          era: "origins",
          title: "Tenant A Event",
        },
      });
      expect(createdA.statusCode).toBe(201);

      const listA = await app.inject({
        method: "GET",
        url: "/api/v1/timeline/events",
        headers: { "x-role": "viewer", "x-tenant-id": "tenant-a" },
      });
      expect(listA.statusCode).toBe(200);
      expect(listA.json().total).toBe(1);
      expect(listSpy).toHaveBeenCalledTimes(1);

      const listB = await app.inject({
        method: "GET",
        url: "/api/v1/timeline/events",
        headers: { "x-role": "viewer", "x-tenant-id": "tenant-b" },
      });
      expect(listB.statusCode).toBe(200);
      expect(listB.json().total).toBe(0);
    } finally {
      await app.close();
    }
  });
});
