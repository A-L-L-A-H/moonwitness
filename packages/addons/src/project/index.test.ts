import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  defaultFailClosedAuthBridge,
  registerBaseAddon,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import {
  createProjectAddon,
  getProjectBoardSummary,
  projectProjectModel,
  projectSyncLogModel,
  projectTaskModel,
  syncGitHubIssuesToOrm,
} from "./index.js";

function createTestAuth(tenantId = "default"): BaseAddonAuthBridge {
  return {
    ...defaultFailClosedAuthBridge,
    authenticate: async () => undefined,
    requireRole: () => async () => undefined,
    getActorId: () => "project-admin",
    getActorRole: () => "admin",
    getActorTenant: (req) => String(req.headers["x-tenant-id"] ?? tenantId),
    resolveActorContext: (req, source = "api") =>
      createActorContext(
        "project-admin",
        source,
        req.id,
        String(req.headers["x-tenant-id"] ?? tenantId),
      ),
  };
}

describe("@moonwitness/addons/project centralized addon", () => {
  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    await initDb("file::memory:?cache=shared");
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  it("mounts in full mode with Fastify CRUD, RPC actions, GitHub sync, and tenant isolation", async () => {
    const app = Fastify({ logger: false });
    const runtime = new AddonRuntimeController();
    const auth = createTestAuth();

    await runtime.syncAll(
      [
        {
          manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true },
          register: async () => {
            await registerBaseAddon(app, { runtime, auth, apiPrefix: "/api/v1" });
          },
        },
        createProjectAddon({ prefix: "/api/v1", auth }),
      ],
      app,
    );
    await app.ready();

    try {
      const syncRes = await app.inject({
        method: "POST",
        url: "/api/v1/project/sync/github",
        headers: { "x-tenant-id": "tenant-alpha" },
        payload: {
          repo: "A-L-L-A-H/moonwitness",
          issues: [
            {
              number: 288,
              title: "PostgreSQL standardization",
              body: "Migrate services to PG",
              state: "open",
              url: "https://github.com/A-L-L-A-H/moonwitness/issues/288",
              labels: ["p1", "database"],
              assignee: "maintainer",
            },
            {
              number: 489,
              title: "Universal ORM Epic",
              state: "closed",
              labels: ["p0"],
            },
          ],
        },
      });
      expect(syncRes.statusCode).toBe(200);
      expect(syncRes.json()).toMatchObject({
        ok: true,
        repo: "A-L-L-A-H/moonwitness",
        projectCode: "a-l-l-a-h-moonwitness",
        synced: 2,
        created: 2,
        updated: 0,
      });

      const listTasks = await app.inject({
        method: "GET",
        url: "/api/v1/m/project.task",
        headers: { "x-tenant-id": "tenant-alpha" },
      });
      expect(listTasks.statusCode).toBe(200);
      expect(listTasks.json().total).toBe(2);

      const openTask = (listTasks.json().data as Array<Record<string, unknown>>).find(
        (task) => task.github_issue_number === 288,
      )!;
      expect(openTask.priority).toBe("high");
      expect(openTask.task_status).toBe("todo");
      expect(openTask.is_github_synced).toBe(true);

      // Move stage via centralized ORM record action RPC
      const moved = await app.inject({
        method: "POST",
        url: `/api/v1/m/project.task/${String(openTask.id)}/call/move_stage`,
        headers: { "x-tenant-id": "tenant-alpha" },
        payload: { task_status: "in_progress" },
      });
      expect(moved.statusCode).toBe(200);
      expect(moved.json().data.task_status).toBe("in_progress");

      // Re-sync preserves in_progress stage and updates idempotently
      const resync = await app.inject({
        method: "POST",
        url: "/api/v1/project/sync/github",
        headers: { "x-tenant-id": "tenant-alpha" },
        payload: {
          repo: "A-L-L-A-H/moonwitness",
          issues: [
            {
              number: 288,
              title: "PostgreSQL standardization updated",
              state: "open",
              labels: ["p0"],
            },
          ],
        },
      });
      expect(resync.statusCode).toBe(200);
      expect(resync.json()).toMatchObject({ created: 0, updated: 1 });

      const afterResync = await projectTaskModel.repository.findOne(String(openTask.id), {
        tenantId: "tenant-alpha",
      });
      expect(afterResync?.task_status).toBe("in_progress");
      expect(afterResync?.priority).toBe("critical");

      // Webhook closes issue #288 -> done
      const webhookRes = await app.inject({
        method: "POST",
        url: "/api/v1/project/webhooks/github",
        headers: { "x-tenant-id": "tenant-alpha", "x-github-event": "issues" },
        payload: {
          repository: { full_name: "A-L-L-A-H/moonwitness" },
          issue: {
            number: 288,
            title: "PostgreSQL standardization updated",
            state: "closed",
            labels: [{ name: "p0" }],
          },
        },
      });
      expect(webhookRes.statusCode).toBe(200);
      expect(webhookRes.json()).toMatchObject({ ok: true, webhook: true, updated: 1 });

      const summaryAlpha = await app.inject({
        method: "GET",
        url: "/api/v1/project/summary",
        headers: { "x-tenant-id": "tenant-alpha" },
      });
      expect(summaryAlpha.statusCode).toBe(200);
      expect(summaryAlpha.json()).toMatchObject({
        projects: 1,
        tasks: 2,
        syncLogs: 3,
        byStatus: { done: 2 },
      });

      // Tenant beta observes zero records
      const summaryBeta = await app.inject({
        method: "GET",
        url: "/api/v1/project/summary",
        headers: { "x-tenant-id": "tenant-beta" },
      });
      expect(summaryBeta.statusCode).toBe(200);
      expect(summaryBeta.json()).toMatchObject({ projects: 0, tasks: 0, syncLogs: 0 });
    } finally {
      await app.close();
    }
  });

  it("boots cleanly in headless edge mode without Fastify and persists ORM records", async () => {
    const runtime = new AddonRuntimeController();
    const { order } = await runtime.syncAll(
      [
        { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
        createProjectAddon(),
      ],
      undefined,
      { mode: "edge" },
    );

    expect(order).toEqual(["__base", "project"]);
    expect(runtime.isEnabled("project")).toBe(true);

    const actor = createActorContext("edge-user", "api", "req-edge-1", "edge-tenant");
    const syncRes = await syncGitHubIssuesToOrm(
      "A-L-L-A-H/moonwitness",
      [{ number: 192, title: "Backup drill", state: "open", labels: ["security"] }],
      actor,
    );
    expect(syncRes).toMatchObject({ created: 1, updated: 0, projectCode: "a-l-l-a-h-moonwitness" });

    const [projects, tasks, logs, summary] = await Promise.all([
      projectProjectModel.repository.forActor(actor).find({}),
      projectTaskModel.repository.forActor(actor).find({}),
      projectSyncLogModel.repository.forActor(actor).find({}),
      getProjectBoardSummary("edge-tenant"),
    ]);

    expect(projects).toHaveLength(1);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.priority).toBe("high");
    expect(logs).toHaveLength(1);
    expect(summary.byStatus).toEqual({ todo: 1 });
  });
});
