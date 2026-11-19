import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { z } from "zod";
import { closeDb, createActorContext, defineModel, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  CronRunner,
  defaultFailClosedAuthBridge,
  getConfigParam,
  irCronLogModel,
  irCronModel,
  irModelDataModel,
  mailMessageModel,
  nextSequenceByCode,
  postChatterMessage,
  registerBaseAddon,
  resCompanyModel,
  resCountryModel,
  resCurrencyModel,
  resGroupsModel,
  resLangModel,
  setConfigParam,
  type BaseAddonAuthBridge,
} from "./index.js";

describe("Odoo-grade __base (res.*/ir.*), declarative data, row-level ir.rule, read-group & action RPC", () => {
  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    await initDb("file::memory:?cache=shared");
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  it("seeds constitutional __base models (res.company, res.groups, res.lang) and supports ir.sequence + ir.config_parameter", async () => {
    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
    ]);

    const companies = await resCompanyModel.repository.find({ slug: "default" });
    expect(companies).toHaveLength(1);
    expect(companies[0]?.is_active).toBe(true);

    const groups = await resGroupsModel.repository.find({});
    expect(groups.map((g) => g.group_key)).toEqual(
      expect.arrayContaining([
        "base.group_public",
        "base.group_viewer",
        "base.group_editor",
        "base.group_system",
      ]),
    );

    const langs = await resLangModel.repository.find({});
    expect(langs.map((l) => l.code)).toEqual(expect.arrayContaining(["en", "id"]));

    const countries = await resCountryModel.repository.find({});
    expect(countries.map((c) => c.code)).toEqual(expect.arrayContaining(["ID", "MY", "SG", "US"]));

    const currencies = await resCurrencyModel.repository.find({});
    expect(currencies.map((c) => c.code)).toEqual(expect.arrayContaining(["IDR", "USD", "MYR"]));

    await setConfigParam("instance.title", "MoonWitness Prime");
    expect(await getConfigParam("instance.title")).toBe("MoonWitness Prime");

    const seq1 = await nextSequenceByCode("wf.seq", { prefix: "WF-", padding: 4 });
    const seq2 = await nextSequenceByCode("wf.seq", { prefix: "WF-", padding: 4 });
    expect(seq1).toBe("WF-0001");
    expect(seq2).toBe("WF-0002");

    // Chatter message + field tracking values + one2many hydration
    const msg = await postChatterMessage({
      resModel: "res.company",
      resId: companies[0]!.id,
      body: "Updated default locale",
      trackingValues: [{ fieldName: "default_locale", oldValue: "en", newValue: "id" }],
    });
    const hydratedMsg = await mailMessageModel.repository.findOne(msg.id, {
      with: ["tracking_values"],
    });
    const tracks = (hydratedMsg as unknown as Record<string, unknown>)?.$tracking_values as Array<
      Record<string, unknown>
    >;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.field_name).toBe("default_locale");
  });

  it("processes declarative addon.data with ir.model.data (noupdate=true) and syncs crons", async () => {
    const itemModel = defineModel({
      name: "demo.item",
      table: "demo_items",
      schema: z.object({ code: z.string(), label: z.string() }),
      indexes: [{ fields: ["tenant_id", "code"], unique: true }],
    });

    const addonDef = {
      manifest: {
        name: "demo-addon",
        version: "1.0.0",
        depends: ["__base"],
        autoInstall: true,
        defaultEnabled: true,
        provides: { routes: [], models: ["demo.item"], auditActions: [] },
      },
      models: [itemModel],
      data: [
        {
          id: "item_alpha",
          model: "demo.item",
          key: { code: "alpha" },
          noupdate: true,
          values: { code: "alpha", label: "Original Alpha" },
        },
      ],
      crons: [
        {
          cron_key: "demo.cleanup",
          name: "Demo Cleanup",
          model_name: "demo.item",
          action_name: "cleanup",
          interval_sec: 600,
        },
      ],
    };

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      addonDef,
    ]);

    const seeded = await itemModel.repository.find({ code: "alpha" });
    expect(seeded).toHaveLength(1);
    expect(seeded[0]?.label).toBe("Original Alpha");

    const xmlRows = await irModelDataModel.repository.find({
      module: "demo-addon",
      name: "item_alpha",
    });
    expect(xmlRows).toHaveLength(1);
    expect(xmlRows[0]?.res_id).toBe(seeded[0]?.id);

    const crons = await irCronModel.repository.find({ cron_key: "demo.cleanup" });
    expect(crons).toHaveLength(1);

    // Modify the noupdate=true record and re-run syncAll -> modification must survive!
    await itemModel.repository.update(seeded[0]!.id, { label: "Operator Custom Alpha" });
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      addonDef,
    ]);
    const afterResync = await itemModel.repository.find({ code: "alpha" });
    expect(afterResync[0]?.label).toBe("Operator Custom Alpha");
  });

  it("enforces row-level ir.rule domain, SQL searchFields, /m/:model/read-group, and /m/:model[/:id]/call/:action RPC", async () => {
    const ticketModel = defineModel({
      name: "ops.ticket",
      table: "ops_tickets",
      restEnabled: true,
      searchFields: ["title", "category"],
      schema: z.object({
        owner_id: z.string(),
        title: z.string(),
        category: z.string(),
        state: z.enum(["open", "closed"]).default("open"),
      }),
      defaults: {
        owner_id: (actor) => actor.actorId ?? "anon",
      },
      actions: {
        close_ticket: {
          scope: "record",
          roles: ["editor", "admin"],
          input: z.object({ note: z.string().optional() }).optional(),
          handler: async ({ record, repository, actor }) => {
            return repository.update(String(record!.id), { state: "closed" }, actor);
          },
        },
        bulk_ping: {
          scope: "model",
          roles: ["viewer", "editor", "admin"],
          input: z.object({ tag: z.string() }),
          handler: async ({ input, repository, actor }) => {
            const count = await repository.count({}, { tenantId: actor.tenantId });
            return { pong: (input as { tag: string }).tag, count };
          },
        },
      },
    });

    const app = Fastify({ logger: false });
    const runtime = new AddonRuntimeController();
    const auth: BaseAddonAuthBridge = {
      ...defaultFailClosedAuthBridge,
      authenticate: async () => undefined,
      requireRole: () => async () => undefined,
      getActorId: (req) => String(req.headers["x-actor-id"] ?? "user-1"),
      getActorRole: (req) =>
        (req.headers["x-actor-role"] as "admin" | "editor" | "viewer") ?? "editor",
      getActorTenant: () => "default",
      resolveActorContext: (req, source = "api") =>
        createActorContext(
          String(req.headers["x-actor-id"] ?? "user-1"),
          source,
          req.id,
          "default",
        ),
    };

    await runtime.syncAll(
      [
        {
          manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true },
          register: async () => {
            await registerBaseAddon(app, { runtime, auth, apiPrefix: "/api/v1" });
          },
        },
        {
          manifest: {
            name: "ops-tickets",
            version: "1.0.0",
            depends: ["__base"],
            autoInstall: true,
            defaultEnabled: true,
            provides: { routes: [], models: ["ops.ticket"], auditActions: [] },
          },
          models: [ticketModel],
          rules: [
            {
              model_name: "ops.ticket",
              role: "editor",
              can_read: true,
              can_create: true,
              can_update: true,
              domain: { owner_id: "$actor.id" },
            },
          ],
        },
      ],
      app,
    );
    await app.ready();

    try {
      // User 1 creates 2 tickets; User 2 creates 1 ticket
      const c1 = await app.inject({
        method: "POST",
        url: "/api/v1/m/ops.ticket",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
        payload: { title: "Router Down", category: "network" },
      });
      expect(c1.statusCode).toBe(201);
      const t1Id = c1.json().data.id as string;
      expect(c1.json().data.owner_id).toBe("user-1");

      await app.inject({
        method: "POST",
        url: "/api/v1/m/ops.ticket",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
        payload: { title: "Switch Reboot", category: "network" },
      });

      await app.inject({
        method: "POST",
        url: "/api/v1/m/ops.ticket",
        headers: { "x-actor-id": "user-2", "x-actor-role": "editor" },
        payload: { title: "User 2 Private Ticket", category: "storage" },
      });

      // Row-level ir.rule domain: user-1 only sees their 2 tickets!
      const listU1 = await app.inject({
        method: "GET",
        url: "/api/v1/m/ops.ticket",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
      });
      expect(listU1.statusCode).toBe(200);
      expect(listU1.json().total).toBe(2);

      // read-group respects row-level ir.rule domain
      const groupU1 = await app.inject({
        method: "GET",
        url: "/api/v1/m/ops.ticket/read-group?groupBy=category",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
      });
      expect(groupU1.statusCode).toBe(200);
      expect(groupU1.json().groups).toEqual([{ category: "network", count: 2 }]);

      // Record-level RPC action: user-2 cannot call close_ticket on user-1's ticket (404 by domain rule)
      const forbiddenCall = await app.inject({
        method: "POST",
        url: `/api/v1/m/ops.ticket/${t1Id}/call/close_ticket`,
        headers: { "x-actor-id": "user-2", "x-actor-role": "editor" },
        payload: {},
      });
      expect(forbiddenCall.statusCode).toBe(404);

      // User 1 calls close_ticket on their own ticket -> succeeds
      const okCall = await app.inject({
        method: "POST",
        url: `/api/v1/m/ops.ticket/${t1Id}/call/close_ticket`,
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
        payload: { note: "resolved" },
      });
      expect(okCall.statusCode).toBe(200);
      expect(okCall.json().data.state).toBe("closed");

      // Model-level RPC action
      const modelCall = await app.inject({
        method: "POST",
        url: "/api/v1/m/ops.ticket/call/bulk_ping",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
        payload: { tag: "hello" },
      });
      expect(modelCall.statusCode).toBe(200);
      expect(modelCall.json().data).toEqual({ pong: "hello", count: 3 });

      // Unified POST /api/v1/rpc endpoint (Odoo/Moon JSON-RPC style)
      const unifiedRpc = await app.inject({
        method: "POST",
        url: "/api/v1/rpc",
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
        payload: { model: "ops.ticket", method: "bulk_ping", kwargs: { tag: "rpc-ok" } },
      });
      expect(unifiedRpc.statusCode).toBe(200);
      expect(unifiedRpc.json().result).toEqual({ pong: "rpc-ok", count: 3 });

      // ?domain= Odoo tuple domain query on GET /m/:model
      const domainQuery = await app.inject({
        method: "GET",
        url: `/api/v1/m/ops.ticket?domain=${encodeURIComponent(JSON.stringify([["state", "=", "closed"]]))}`,
        headers: { "x-actor-id": "user-1", "x-actor-role": "editor" },
      });
      expect(domainQuery.statusCode).toBe(200);
      expect(domainQuery.json().total).toBe(1);

      // Auto-generated default view descriptor (__auto) when no explicit ir.view exists
      const viewDesc = await runtime.getViewDescriptor("ops.ticket", "editor");
      expect(viewDesc).not.toBeNull();
      expect(viewDesc?.views[0]?.addon).toBe("__auto");
      expect(await runtime.validateViewContracts()).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("executes due ir.cron jobs via CronRunner and logs execution telemetry in ir.cron.log", async () => {
    let ticks = 0;
    const jobModel = defineModel({
      name: "demo.cron.target",
      table: "demo_cron_targets",
      schema: z.object({ label: z.string() }),
      actions: {
        run_tick: {
          scope: "model",
          handler: async () => {
            ticks += 1;
            return { ticks };
          },
        },
      },
    });

    const runtime = new AddonRuntimeController();
    await runtime.syncAll([
      { manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } },
      {
        manifest: {
          name: "demo-cron-addon",
          version: "1.0.0",
          depends: ["__base"],
          autoInstall: true,
          defaultEnabled: true,
          provides: { routes: [], models: ["demo.cron.target"], auditActions: [] },
        },
        models: [jobModel],
        crons: [
          {
            cron_key: "demo.tick",
            name: "Demo Tick",
            model_name: "demo.cron.target",
            action_name: "run_tick",
            interval_sec: 300,
          },
        ],
      },
    ]);

    const runner = new CronRunner();
    const results = await runner.processDueCrons();
    expect(results.some((r) => r.cronKey === "demo.tick" && r.success)).toBe(true);
    expect(ticks).toBe(1);

    const logs = await irCronLogModel.repository.find({ cron_key: "demo.tick" });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.run_status).toBe("success");
  });
});
