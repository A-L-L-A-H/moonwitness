import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import pg from "pg";
import {
  RelationIntegrityError,
  SYSTEM_ACTOR,
  applyMigrations,
  closeDb,
  defineModel,
  getDb,
  initDb,
  isPostgresUrl,
  listAppliedMigrations,
  syncModels,
  withQueryBudget,
  withTransaction,
} from "../index.js";

const POSTGRES_URL =
  process.env.TEST_POSTGRES_URL?.trim() || process.env.POSTGRES_TEST_URL?.trim() || "";
if (POSTGRES_URL && !isPostgresUrl(POSTGRES_URL)) {
  throw new Error("Live PostgreSQL test URL must use postgres:// or postgresql:// protocol.");
}

function suffix(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

async function withSeparateConnection<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: POSTGRES_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function countRows(client: pg.Client, table: string, where = "TRUE"): Promise<number> {
  const res = await client.query(`SELECT count(*)::int AS n FROM ${table} WHERE ${where}`);
  return Number(res.rows[0].n);
}

describe.skipIf(!POSTGRES_URL)("PostgreSQL live: transaction context (#544)", () => {
  afterEach(() => {
    closeDb();
  });

  async function setup() {
    const id = suffix();
    const table = `live_tx_${id}`;
    const model = defineModel({
      name: `live.tx_${id}`,
      table,
      schema: z.object({ label: z.string().min(1), qty: z.number().int().default(0) }),
    });
    await initDb(POSTGRES_URL);
    await syncModels([model.name]);
    return { table, model };
  }

  async function cleanup(table: string) {
    await getDb()
      .exec(`DROP TABLE IF EXISTS ${table}`)
      .catch(() => {});
  }

  it("binds repository create/update/read/archive to the transaction, isolated until commit", async () => {
    const { table, model } = await setup();
    try {
      await withSeparateConnection(async (other) => {
        await withTransaction(async () => {
          const created = await model.repository.create({ label: "a", qty: 1 }, SYSTEM_ACTOR);
          await model.repository.update(created.id, { qty: 2 }, SYSTEM_ACTOR);
          const reread = await model.repository.findById(created.id);
          expect(reread?.qty).toBe(2);
          expect(await countRows(other, table)).toBe(0);
          expect(await countRows(other, "_orm_audit", `record_id = '${created.id}'`)).toBe(0);
          await model.repository.delete(created.id, SYSTEM_ACTOR);
          await model.repository.create({ label: "b" }, SYSTEM_ACTOR);
          expect(await countRows(other, table)).toBe(0);
        });
        expect(await countRows(other, table)).toBe(2);
      });
    } finally {
      await cleanup(table);
    }
  });

  it("rolls back business, audit and outbox rows together on exception", async () => {
    const { table, model } = await setup();
    try {
      let createdId = "";
      await expect(
        withTransaction(async () => {
          const created = await model.repository.create({ label: "rollback" }, SYSTEM_ACTOR);
          createdId = created.id;
          throw new Error("deliberate failure");
        }),
      ).rejects.toThrow("deliberate failure");
      await withSeparateConnection(async (other) => {
        expect(await countRows(other, table)).toBe(0);
        expect(await countRows(other, "_orm_audit", `record_id = '${createdId}'`)).toBe(0);
        const outboxTables = await other.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = '_orm_outbox'",
        );
        const outboxColumns = outboxTables.rows.map((r: { column_name: string }) => r.column_name);
        expect(outboxColumns.length).toBeGreaterThan(0);
        expect(await countRows(other, "_orm_outbox", `payload LIKE '%${createdId}%'`)).toBe(0);
      });
      expect(await model.repository.find({})).toHaveLength(0);
    } finally {
      await cleanup(table);
    }
  });

  it("keeps two concurrent async transactions on separate connections", async () => {
    const { table, model } = await setup();
    try {
      const pids: number[] = [];
      let releaseFirst: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      const flowA = withTransaction(async () => {
        await model.repository.create({ label: "flow-a" }, SYSTEM_ACTOR);
        const pid = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
        pids.push(Number(pid?.pid));
        await gate;
        const labels = (await model.repository.find({})).map((r) => r.label);
        expect(labels).toEqual(["flow-a"]);
        const again = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
        expect(Number(again?.pid)).toBe(pids[0]);
      });
      const flowB = withTransaction(async () => {
        await model.repository.create({ label: "flow-b" }, SYSTEM_ACTOR);
        const pid = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
        pids.push(Number(pid?.pid));
        const labels = (await model.repository.find({})).map((r) => r.label);
        expect(labels).toEqual(["flow-b"]);
        releaseFirst();
      });
      await Promise.all([flowA, flowB]);
      expect(new Set(pids).size).toBe(2);
      expect(await model.repository.find({})).toHaveLength(2);
    } finally {
      await cleanup(table);
    }
  });

  it("joins nested transactions, clears context afterwards and preserves query budget", async () => {
    const { table, model } = await setup();
    try {
      await withTransaction(async () => {
        const outerPid = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
        await withTransaction(async () => {
          const innerPid = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
          expect(innerPid?.pid).toBe(outerPid?.pid);
        });
      });
      const afterA = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
      const afterB = await getDb().get<{ pid: number }>("SELECT pg_backend_pid() AS pid");
      expect(afterA?.pid).toBeDefined();
      expect(afterB?.pid).toBeDefined();

      let leaked: Promise<unknown> = Promise.resolve();
      await expect(
        withTransaction(async () => {
          leaked = new Promise((resolve) => setTimeout(resolve, 20)).then(() =>
            model.repository.create({ label: "late" }, SYSTEM_ACTOR),
          );
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
      await leaked;
      expect(await model.repository.find({ label: "late" })).toHaveLength(1);

      await expect(
        withQueryBudget(2, () =>
          withTransaction(async () => {
            await getDb().get("SELECT 1 AS one");
            await getDb().get("SELECT 2 AS two");
            await getDb().get("SELECT 3 AS three");
          }),
        ),
      ).rejects.toThrow(/Query budget exceeded/);
    } finally {
      await cleanup(table);
    }
  });
});

describe.skipIf(!POSTGRES_URL)("PostgreSQL live: migration runner (#545)", () => {
  afterEach(() => {
    closeDb();
  });

  it("serializes two independent runners: applied once, other skipped, one ledger row", async () => {
    const id = suffix();
    const table = `live_mig_${id}`;
    const migrationId = `live-${id}-001`;
    const migrations = [
      {
        id: migrationId,
        owner: "live-test",
        up: `CREATE TABLE ${table} (id SERIAL PRIMARY KEY); SELECT pg_sleep(0.3); INSERT INTO ${table} DEFAULT VALUES;`,
      },
    ];
    // Runner A uses the ORM global handle; runner B is an independent pool through a fresh process-global swap.
    await initDb(POSTGRES_URL);
    const { PostgresDriver } = await import("../drivers/postgres.driver.js");
    const second = new PostgresDriver();
    await second.init(POSTGRES_URL);
    try {
      const results = await Promise.allSettled([
        applyMigrations(migrations),
        runWithHandle(second, () => applyMigrations(migrations)),
      ]);
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      const values = results.map(
        (r) => (r as PromiseFulfilledResult<{ applied: string[]; skipped: string[] }>).value,
      );
      expect(values.flatMap((v) => v.applied)).toEqual([migrationId]);
      expect(values.flatMap((v) => v.skipped)).toEqual([migrationId]);
      const rows = await listAppliedMigrations("live-test");
      expect(rows.filter((r) => r.id === migrationId)).toHaveLength(1);
      expect(Number((await getDb().get<{ n: number }>(`SELECT count(*) AS n FROM ${table}`))?.n)).toBe(1);
    } finally {
      await getDb().exec(`DROP TABLE IF EXISTS ${table}`).catch(() => {});
      await getDb().run("DELETE FROM _orm_schema_migrations WHERE id = ?", [migrationId]).catch(() => {});
      second.close();
    }
  });

  it("leaves no ledger row after a failed migration and fails closed on checksum mismatch", async () => {
    const id = suffix();
    const table = `live_migfail_${id}`;
    await initDb(POSTGRES_URL);
    const failingId = `live-${id}-fail`;
    try {
      await expect(
        applyMigrations([
          { id: failingId, up: `CREATE TABLE ${table} (id INT); SELECT 1/0;` },
        ]),
      ).rejects.toThrow();
      const ledger = await getDb().get(
        "SELECT id FROM _orm_schema_migrations WHERE id = ?",
        [failingId],
      );
      expect(ledger).toBeUndefined();
      const tableRow = await getDb().get(
        "SELECT 1 AS present FROM information_schema.tables WHERE table_name = ?",
        [table],
      );
      expect(tableRow).toBeUndefined();

      const okId = `live-${id}-ok`;
      await applyMigrations([{ id: okId, up: `CREATE TABLE ${table} (id INT)` }]);
      await expect(
        applyMigrations([{ id: okId, up: `CREATE TABLE ${table} (id BIGINT)` }]),
      ).rejects.toThrow(/checksum mismatch/);
      const kept = await getDb().get<{ checksum: string }>(
        "SELECT checksum FROM _orm_schema_migrations WHERE id = ?",
        [okId],
      );
      expect(kept?.checksum).toBeDefined();
      await getDb().run("DELETE FROM _orm_schema_migrations WHERE id = ?", [okId]);
    } finally {
      await getDb().exec(`DROP TABLE IF EXISTS ${table}`).catch(() => {});
    }
  });

  it("rejects statements that cannot run inside a transaction", async () => {
    await initDb(POSTGRES_URL);
    await expect(
      applyMigrations([
        { id: `live-${suffix()}-conc`, up: "CREATE INDEX CONCURRENTLY idx_none ON nowhere (x)" },
      ]),
    ).rejects.toThrow(/cannot run inside a PostgreSQL transaction/);
  });
});

async function runWithHandle<T>(
  handle: { transaction: unknown },
  fn: () => Promise<T>,
): Promise<T> {
  // A second runner on its own connection pool: swap the process-global handle for the call.
  closeDb();
  const { initPostgresDb } = await import("../index.js");
  void handle;
  await initPostgresDb(POSTGRES_URL);
  return fn();
}

describe.skipIf(!POSTGRES_URL)("PostgreSQL live: foreign key reconciliation (#546)", () => {
  afterEach(() => {
    closeDb();
  });

  async function defineParentChild(id: string, onDelete: "restrict" | "set null" = "restrict") {
    const parentTable = `live_fkp_${id}`;
    const childTable = `live_fkc_${id}`;
    const parent = defineModel({
      name: `live.fkp_${id}`,
      table: parentTable,
      schema: z.object({ code: z.string() }),
    });
    const child = defineModel({
      name: `live.fkc_${id}`,
      table: childTable,
      schema: z.object({ title: z.string(), parent_id: z.string().nullable().default(null) }),
      relations: {
        parent_id: { type: "many2one", model: parent.name, onDelete },
      },
    });
    return { parent, child, parentTable, childTable };
  }

  async function dropAll(...tables: string[]) {
    for (const table of tables) {
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${table} CASCADE`)
        .catch(() => {});
    }
  }

  async function fkRows(table: string) {
    return getDb().all<{ conname: string; def: string; convalidated: boolean }>(
      `SELECT con.conname AS conname, pg_get_constraintdef(con.oid) AS def, con.convalidated
       FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
       WHERE con.contype = 'f' AND rel.relname = ?`,
      [table],
    );
  }

  it("adds a missing FK to an existing table, is idempotent, and rejects orphans without modifying data", async () => {
    const id = suffix();
    const { parent, child, parentTable, childTable } = await defineParentChild(id);
    await initDb(POSTGRES_URL);
    try {
      const fresh = await syncModels([parent.name, child.name]);
      expect(fresh.addedForeignKeys).toEqual([]);
      expect((await fkRows(childTable)).length).toBe(1);

      // Drift: drop the constraint, plant an orphan.
      const [existing] = await fkRows(childTable);
      await getDb().exec(`ALTER TABLE ${childTable} DROP CONSTRAINT "${existing?.conname}"`);
      const realParent = await parent.repository.create({ code: "p" }, SYSTEM_ACTOR);
      const orphan = await child.repository.create(
        { title: "orphan", parent_id: "does-not-exist" },
        SYSTEM_ACTOR,
      ).catch(async () => {
        const rowId = randomUUID();
        await getDb().run(
          `INSERT INTO ${childTable} (id, title, parent_id, tenant_id, status, version, source, create_date, write_date) VALUES (?, 'orphan', 'does-not-exist', 'default', 'active', 1, 'api', '2026-01-01', '2026-01-01')`,
          [rowId],
        );
        return { id: rowId };
      });

      const error = await syncModels([parent.name, child.name]).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(RelationIntegrityError);
      const violations = (error as RelationIntegrityError).violations;
      expect(violations.map((v) => v.recordId)).toContain(orphan.id);
      expect(violations[0]).toMatchObject({ model: child.name, relation: "parent_id", kind: "orphan" });
      expect(await fkRows(childTable)).toHaveLength(0);
      const stillThere = await getDb().get(`SELECT id FROM ${childTable} WHERE id = ?`, [orphan.id]);
      expect(stillThere).toBeDefined();

      // Repair data, sync adds exactly one constraint, repeat is a no-op.
      await getDb().run(`UPDATE ${childTable} SET parent_id = ? WHERE id = ?`, [realParent.id, orphan.id]);
      const repaired = await syncModels([parent.name, child.name]);
      expect(repaired.addedForeignKeys).toHaveLength(1);
      const rows = await fkRows(childTable);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.def).toMatch(/FOREIGN KEY \(parent_id\) REFERENCES .*\(id\) ON DELETE RESTRICT/);
      expect(rows[0]?.convalidated).toBe(true);
      const again = await syncModels([parent.name, child.name]);
      expect(again.addedForeignKeys).toEqual([]);
      expect(again.foreignKeyDrift).toEqual([]);
      expect(await fkRows(childTable)).toHaveLength(1);
    } finally {
      await dropAll(childTable, parentTable);
    }
  });

  it("treats an equivalent constraint with another name as satisfied and reports conflicting ones as drift", async () => {
    const id = suffix();
    const { parent, child, parentTable, childTable } = await defineParentChild(id);
    await initDb(POSTGRES_URL);
    try {
      await syncModels([parent.name, child.name]);
      const [created] = await fkRows(childTable);
      await getDb().exec(`ALTER TABLE ${childTable} DROP CONSTRAINT "${created?.conname}"`);
      await getDb().exec(
        `ALTER TABLE ${childTable} ADD CONSTRAINT custom_name_${id} FOREIGN KEY (parent_id) REFERENCES ${parentTable}(id) ON DELETE RESTRICT`,
      );
      const same = await syncModels([parent.name, child.name]);
      expect(same.addedForeignKeys).toEqual([]);
      expect(same.foreignKeyDrift).toEqual([]);
      expect(await fkRows(childTable)).toHaveLength(1);

      await getDb().exec(`ALTER TABLE ${childTable} DROP CONSTRAINT custom_name_${id}`);
      await getDb().exec(
        `ALTER TABLE ${childTable} ADD CONSTRAINT weaker_${id} FOREIGN KEY (parent_id) REFERENCES ${parentTable}(id) ON DELETE CASCADE`,
      );
      const drift = await syncModels([parent.name, child.name]);
      expect(drift.addedForeignKeys).toEqual([]);
      expect(drift.foreignKeyDrift).toHaveLength(1);
      expect(drift.foreignKeyDrift[0]).toMatchObject({
        constraint: `weaker_${id}`,
        reason: "different_definition",
      });
      const rows = await fkRows(childTable);
      expect(rows.map((r) => r.conname)).toEqual([`weaker_${id}`]);
    } finally {
      await dropAll(childTable, parentTable);
    }
  });
});
