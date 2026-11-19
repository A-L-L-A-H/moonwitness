import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Fastify from "fastify";
import { closeDb, createActorContext, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  defaultFailClosedAuthBridge,
  opsJobModel,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { auditAddon } from "../audit";
import { authAddon, createUser } from "../auth";
import {
  controlAddon,
  controlCommandModel,
  createControlAddon,
  createControlScheduler,
  processControlSchedulerJob,
} from "./index.js";

describe("../control", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-ctrl-"));
    dirs.push(dir);
    await initDb(join(dir, "ctrl.db"));
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

  it("syncs control_command_history without SQL migrations", async () => {
    const runtime = new AddonRuntimeController();
    const { syncReport } = await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      controlAddon,
    ]);
    expect(syncReport.createdTables).toContain("control_command_history");
    const view = await runtime.getViewDescriptor("control.command", "admin");
    expect(view?.actionBindings.listUrl).toBe("/api/v1/control/audit");
  });

  it("supports pluggable ARSY HTTP and durable queue control scheduler backends", async () => {
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      auditAddon,
      authAddon,
      controlAddon,
    ]);

    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    const arsyBackend = createControlScheduler({
      mode: "arsy",
      arsyBaseUrl: "http://127.0.0.1:8787",
      arsyAdminToken: "admin-tok",
      fetchImpl: async (url, init) => {
        calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
        return new Response(JSON.stringify({ planId: "p-1" }), { status: 200 });
      },
    });
    const arsyRes = await arsyBackend.dispatch({
      action: "plan",
      resourceKind: "systemd",
      payload: { unit: "moonwitness-api.service" },
      traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    });
    expect(arsyRes.accepted).toBe(true);
    expect(calls[0]?.url).toBe("http://127.0.0.1:8787/v1/plan");
    expect(calls[0]?.headers.authorization).toBe("Bearer admin-tok");

    const queueBackend = createControlScheduler({ mode: "queue" });
    const queued = await queueBackend.dispatch({
      action: "apply",
      resourceKind: "dockercompose",
      targetPath: "/srv/moonwitness",
      payload: { confirm: "abc123" },
    });
    expect(queued.accepted).toBe(true);
    expect(queued.statusCode).toBe(202);
    expect(queued.jobId).toBeTruthy();

    const executed: string[] = [];
    const processed = await processControlSchedulerJob("worker-1", async (req) => {
      executed.push(`${req.action}:${req.resourceKind}:${req.targetPath}`);
      return { applied: true };
    });
    expect(processed).toBe(true);
    expect(executed).toEqual(["apply:dockercompose:/srv/moonwitness"]);
  });

  it("dispatches POST /api/v1/control/plan into DurableQueueSchedulerAdapter (202 + ops.job) when CONTROL_SCHEDULER=queue", async () => {
    const prevScheduler = process.env.CONTROL_SCHEDULER;
    process.env.CONTROL_SCHEDULER = "queue";
    const app = Fastify({ logger: false });
    try {
      const testAuth: BaseAddonAuthBridge = {
        ...defaultFailClosedAuthBridge,
        authenticate: async (request) => {
          (request as { user?: { id: string; role: string } }).user = { id: "1", role: "admin" };
        },
        requireRole: () => async () => undefined,
        getActorId: () => "1",
        getActorRole: () => "admin",
        getActorTenant: (request) => String(request.headers["x-tenant-id"] ?? "default"),
        resolveActorContext: (request, source = "api") =>
          createActorContext(
            "1",
            source,
            request.id,
            String(request.headers["x-tenant-id"] ?? "default"),
          ),
      };

      const runtime = new AddonRuntimeController();
      await runtime.syncAll(
        [
          { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
          auditAddon,
          authAddon,
          createControlAddon({ prefix: "/api/v1", auth: testAuth }),
        ],
        app,
      );
      await app.ready();

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/control/plan",
        headers: { "x-tenant-id": "tenant-alpha" },
        payload: {
          version: 1,
          resources: [{ kind: "files", name: "hosts" }],
        },
      });
      expect(res.statusCode).toBe(202);
      const body = res.json();
      expect(body.backend).toBe("queue");
      expect(body.accepted).toBe(true);
      expect(body.jobId).toBeTruthy();

      const jobs = await opsJobModel.repository.find({ id: body.jobId });
      expect(jobs).toHaveLength(1);
      expect(jobs[0]?.job_type).toBe("control.plan");

      const commands = await controlCommandModel.repository.find({ tenant_id: "tenant-alpha" });
      expect(commands).toHaveLength(1);
      expect(commands[0]?.tenant_id).toBe("tenant-alpha");
      expect(commands[0]?.target_path).toBe("plan");
    } finally {
      await app.close();
      if (prevScheduler === undefined) delete process.env.CONTROL_SCHEDULER;
      else process.env.CONTROL_SCHEDULER = prevScheduler;
    }
  });

  it("checks setup status via authUserModel.repository in native setup mode", async () => {
    const prevNative = process.env.CONTROL_NATIVE_SETUP;
    process.env.CONTROL_NATIVE_SETUP = "1";
    const app = Fastify({ logger: false });
    try {
      const runtime = new AddonRuntimeController();
      await runtime.syncAll(
        [
          { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
          auditAddon,
          authAddon,
          createControlAddon({ prefix: "/api/v1" }),
        ],
        app,
      );
      await app.ready();

      const before = await app.inject({ method: "GET", url: "/api/v1/control/setup/status" });
      expect(before.statusCode).toBe(200);
      expect(before.json().initialized).toBe(false);

      await createUser({
        username: "native-admin",
        email: "native@example.com",
        password: "PasswordLongEnough123!",
        role: "admin",
        displayName: "Native Admin",
      });

      const after = await app.inject({ method: "GET", url: "/api/v1/control/setup/status" });
      expect(after.statusCode).toBe(200);
      expect(after.json().initialized).toBe(true);
      expect(after.json().instance.initialized_at).toBeTruthy();
    } finally {
      await app.close();
      if (prevNative === undefined) delete process.env.CONTROL_NATIVE_SETUP;
      else process.env.CONTROL_NATIVE_SETUP = prevNative;
    }
  });
});
