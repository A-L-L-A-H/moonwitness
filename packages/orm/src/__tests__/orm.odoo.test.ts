import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  closeDb,
  compileTupleDomainToFilter,
  createActorContext,
  defineModel,
  initDb,
  modelRegistry,
  syncModels,
} from "../index.js";

const actorA = createActorContext("u1", "api", undefined, "tenant-a");
const actorB = createActorContext("u2", "api", undefined, "tenant-b");

describe("ORM Odoo-grade engine: domains, readGroup, defaults, constrains, relations, retention", () => {
  beforeEach(async () => {
    modelRegistry.clearForTests();
    await initDb("file::memory:?cache=shared");
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearForTests();
  });

  it("supports $or/$and domains and declarative searchFields (q) fully in SQL", async () => {
    const note = defineModel({
      name: "t.note",
      table: "t_notes",
      schema: z.object({ title: z.string(), body: z.string().default(""), kind: z.string() }),
      searchFields: ["title", "body"],
    });
    await syncModels([note]);
    const repo = note.repository;
    await repo.create({ title: "Alpha", body: "red fox", kind: "a" }, actorA);
    await repo.create({ title: "Beta", body: "blue sky", kind: "b" }, actorA);
    await repo.create({ title: "Gamma", body: "green fox", kind: "b" }, actorA);

    const orRows = await repo.find(
      { $or: [{ kind: "a" }, { title: "Gamma" }] },
      { tenantId: "tenant-a", orderBy: "title ASC" },
    );
    expect(orRows.map((r) => r.title)).toEqual(["Alpha", "Gamma"]);

    const qRows = await repo.find({}, { tenantId: "tenant-a", q: "FOX", orderBy: "title ASC" });
    expect(qRows.map((r) => r.title)).toEqual(["Alpha", "Gamma"]);
    expect(await repo.count({}, { tenantId: "tenant-a", q: "fox" })).toBe(2);

    const andRows = await repo.find(
      { $and: [{ kind: "b" }, { $or: [{ title: "Beta" }, { title: "Zed" }] }] },
      { tenantId: "tenant-a" },
    );
    expect(andRows.map((r) => r.title)).toEqual(["Beta"]);
  });

  it("readGroup aggregates with GROUP BY, scoped by tenant", async () => {
    const metric = defineModel({
      name: "t.metric",
      table: "t_metrics",
      schema: z.object({ era: z.string(), amount: z.number().int() }),
    });
    await syncModels([metric]);
    await metric.repository.create({ era: "x", amount: 2 }, actorA);
    await metric.repository.create({ era: "x", amount: 5 }, actorA);
    await metric.repository.create({ era: "y", amount: 7 }, actorA);
    await metric.repository.create({ era: "x", amount: 100 }, actorB);

    const groups = await metric.repository.readGroup({
      groupBy: ["era"],
      aggregates: { total: { fn: "count" }, sum_amount: { fn: "sum", field: "amount" } },
      tenantId: "tenant-a",
      orderBy: "era ASC",
    });
    expect(groups).toEqual([
      { era: "x", total: 2, sum_amount: 7 },
      { era: "y", total: 1, sum_amount: 7 },
    ]);
  });

  it("applies defaults from the acting user and rejects unknown readGroup columns", async () => {
    const task = defineModel({
      name: "t.task",
      table: "t_tasks",
      schema: z.object({ owner_id: z.string(), name: z.string() }),
      defaults: { owner_id: (actor) => actor.actorId ?? "system" },
    });
    await syncModels([task]);
    const row = await task.repository.create({ name: "n1" }, actorA);
    expect(row.owner_id).toBe("u1");
    const explicit = await task.repository.create({ name: "n2", owner_id: "other" }, actorA);
    expect(explicit.owner_id).toBe("other");
    await expect(
      task.repository.readGroup({ groupBy: ["nope; DROP TABLE t_tasks"] }),
    ).rejects.toThrow();
  });

  it("runs constrains inside the write transaction and rolls back on violation", async () => {
    const flow = defineModel({
      name: "t.flow",
      table: "t_flows",
      schema: z.object({ state: z.enum(["draft", "run", "done"]).default("draft") }),
      constrains: [
        ({ before, after }) => {
          if (before?.state === "done" && after.state !== "done") {
            throw new Error("done is terminal");
          }
        },
      ],
    });
    await syncModels([flow]);
    const created = await flow.repository.create({ state: "run" }, actorA);
    const done = await flow.repository.update(created.id, { state: "done" }, actorA);
    expect(done?.state).toBe("done");
    await expect(flow.repository.update(created.id, { state: "run" }, actorA)).rejects.toThrow(
      "done is terminal",
    );
    const reread = await flow.repository.findOne(created.id, { tenantId: "tenant-a" });
    expect(reread?.state).toBe("done");
    expect(reread?.version).toBe(2);
  });

  it("validates many2one on write and restricts deleting referenced rows", async () => {
    const era = defineModel({
      name: "t.era",
      table: "t_eras",
      schema: z.object({ key: z.string() }),
    });
    const event = defineModel({
      name: "t.event",
      table: "t_events",
      schema: z.object({ era: z.string(), title: z.string() }),
      relations: { era: { model: "t.era", targetField: "key" } },
    });
    await syncModels([era, event]);
    await expect(event.repository.create({ era: "ghost", title: "e" }, actorA)).rejects.toThrow(
      /relation/i,
    );
    const parent = await era.repository.create({ key: "neon" }, actorA);
    await event.repository.create({ era: "neon", title: "ok" }, actorA);
    await expect(era.repository.delete(parent.id, actorA)).rejects.toThrow(/restrict|referenced/i);
    const otherTenantParent = await era.repository.create({ key: "solo" }, actorB);
    await expect(event.repository.create({ era: "solo", title: "x" }, actorA)).rejects.toThrow(
      /relation/i,
    );
    expect(otherTenantParent.tenant_id).toBe("tenant-b");
  });

  it("enforces declarative retention maxRows per tenant", async () => {
    const log = defineModel({
      name: "t.log",
      table: "t_logs",
      schema: z.object({ at: z.string(), msg: z.string() }),
      softDelete: false,
      retention: { maxRows: 3, orderField: "at" },
    });
    await syncModels([log]);
    for (let i = 1; i <= 5; i += 1) {
      await log.repository.create({ at: `2026-01-0${i}`, msg: `m${i}` }, actorA);
    }
    await log.repository.create({ at: "2026-01-01", msg: "b1" }, actorB);
    const rowsA = await log.repository.find({}, { tenantId: "tenant-a", orderBy: "at ASC" });
    expect(rowsA.map((r) => r.msg)).toEqual(["m3", "m4", "m5"]);
    expect(await log.repository.count({}, { tenantId: "tenant-b" })).toBe(1);
  });

  it("supports computed fields, beforeSave/afterSave hooks, batch relation hydration (with), and Polish-notation tuple domains", async () => {
    const afterSaved: string[] = [];
    const team = defineModel({
      name: "t.team",
      table: "t_teams",
      schema: z.object({ code: z.string(), name: z.string() }),
      relations: {
        members: {
          model: "t.member",
          type: "one2many",
          targetField: "code",
          inverseField: "team_code",
        },
      },
    });
    const member = defineModel({
      name: "t.member",
      table: "t_members",
      schema: z.object({
        team_code: z.string(),
        first_name: z.string(),
        last_name: z.string(),
        role: z.string().default("ops"),
      }),
      relations: {
        team_code: { model: "t.team", targetField: "code" },
      },
      computed: {
        full_name: (r) => `${String(r.first_name)} ${String(r.last_name)}`,
      },
      hooks: {
        beforeSave: ({ values }) => {
          if (typeof values.role === "string") {
            values.role = values.role.trim().toLowerCase();
          }
        },
        afterSave: ({ values }) => {
          afterSaved.push(String(values.full_name));
        },
      },
    });
    await syncModels([team, member]);

    await team.repository.create({ code: "alpha", name: "Alpha Squad" }, actorA);
    const m1 = await member.repository.create(
      { team_code: "alpha", first_name: "Ada", last_name: "Lovelace", role: "  LEAD  " },
      actorA,
    );
    expect(m1.role).toBe("lead");
    expect((m1 as unknown as Record<string, unknown>).full_name).toBe("Ada Lovelace");
    expect(afterSaved).toEqual(["Ada Lovelace"]);

    await member.repository.create(
      { team_code: "alpha", first_name: "Alan", last_name: "Turing", role: "CRYPTO" },
      actorA,
    );

    const hydratedMembers = await member.repository.find(
      compileTupleDomainToFilter([
        ["team_code", "=", "alpha"],
        "|",
        ["role", "=", "lead"],
        ["role", "=", "crypto"],
      ]),
      { tenantId: "tenant-a", with: ["team_code"], orderBy: "first_name ASC" },
    );
    expect(hydratedMembers).toHaveLength(2);
    expect(
      ((hydratedMembers[0] as unknown as Record<string, unknown>).$team_code as Record<string, unknown>)
        ?.name,
    ).toBe("Alpha Squad");

    const hydratedTeams = await team.repository.find(
      { code: "alpha" },
      { tenantId: "tenant-a", with: ["members"] },
    );
    const membersList = (hydratedTeams[0] as unknown as Record<string, unknown>)
      .$members as Array<Record<string, unknown>>;
    expect(membersList).toHaveLength(2);
    expect(membersList.map((m) => m.full_name).sort()).toEqual(["Ada Lovelace", "Alan Turing"]);
  });
});
