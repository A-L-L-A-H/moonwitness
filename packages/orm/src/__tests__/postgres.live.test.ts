import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  SYSTEM_ACTOR,
  backupDatabase,
  closeDb,
  defineModel,
  extendModel,
  getDb,
  initDb,
  isPostgresUrl,
  listDatabaseTables,
  syncModels,
  verifyIntegrity,
} from "../index.js";

const execFileAsync = promisify(execFile);

function resolveLivePostgresUrl(): string {
  const candidates = [process.env.TEST_POSTGRES_URL?.trim(), process.env.POSTGRES_TEST_URL?.trim()];
  const requireConformance = process.env.MW_REQUIRE_POSTGRES_CONFORMANCE === "1";
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!isPostgresUrl(candidate)) {
      throw new Error("Live PostgreSQL test URL must use postgres:// or postgresql:// protocol.");
    }
    return candidate;
  }
  if (requireConformance) {
    throw new Error(
      "MW_REQUIRE_POSTGRES_CONFORMANCE=1 requires TEST_POSTGRES_URL or POSTGRES_TEST_URL.",
    );
  }
  return "";
}

const POSTGRES_TEST_URL = resolveLivePostgresUrl();

async function hasPgDumpBinary(): Promise<boolean> {
  try {
    await execFileAsync("pg_dump", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!POSTGRES_TEST_URL)("PostgreSQL live integration", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    closeDb();
  });

  afterAll(async () => {
    for (const dir of tempDirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("executes syncModels, extendModel, transactions, verifyIntegrity, and optional pg_dump against live PostgreSQL", async () => {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
    const modelName = `live.pg_widget_${suffix}`;
    const tableName = `live_pg_widget_${suffix}`;
    const childTableName = `live_pg_child_${suffix}`;
    const constraintName = `fk_live_pg_${suffix}`;
    const invalidIndexName = `idx_live_pg_bad_${suffix}`;

    const widgetModel = defineModel({
      name: modelName,
      table: tableName,
      schema: z.object({
        slug: z.string().min(1),
        weight: z.number().int().default(1),
      }),
      extensible: true,
      indexes: [{ fields: ["slug"], unique: true }],
    });

    extendModel(modelName, {
      addon: "live-pg-test",
      fields: z.object({
        pg_note: z.string().nullable().default(null),
      }),
    });

    await initDb(POSTGRES_TEST_URL);
    try {
      const report = await syncModels([modelName]);
      expect(report.createdTables).toContain(tableName);

      const created = await widgetModel.repository.create(
        {
          slug: "alpha-one",
          weight: 7,
          pg_note: "verified",
        },
        SYSTEM_ACTOR,
      );
      expect(created.slug).toBe("alpha-one");
      expect(created.weight).toBe(7);

      const listed = await widgetModel.repository.find({ slug: "alpha-one" });
      expect(listed).toHaveLength(1);
      expect((listed[0] as Record<string, unknown> | undefined)?.pg_note).toBe("verified");

      const tables = await listDatabaseTables();
      expect(tables).toContain(tableName);

      const integrity = await verifyIntegrity();
      expect(integrity).toEqual({ ok: true, errors: [] });

      // Unsupported PRAGMA statements fail closed on PostgreSQL
      await expect(getDb().all("PRAGMA integrity_check")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA: integrity_check/i,
      );
      await expect(getDb().all("PRAGMA foreign_key_check")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA: foreign_key_check/i,
      );
      await expect(getDb().exec("PRAGMA journal_mode = WAL")).rejects.toThrow(
        /Unsupported PostgreSQL PRAGMA statement/i,
      );

      // Verify PostgreSQL catalog integrity detection on real unvalidated constraint & invalid index
      await getDb().exec(
        `CREATE TABLE ${childTableName} (id TEXT PRIMARY KEY, widget_id TEXT, code TEXT)`,
      );
      await getDb().exec(
        `INSERT INTO ${childTableName} (id, widget_id, code) VALUES ('c1', '${created.id}', 'dup'), ('c2', '${created.id}', 'dup')`,
      );
      await getDb().exec(
        `ALTER TABLE ${childTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (widget_id) REFERENCES ${tableName}(id) NOT VALID`,
      );
      await expect(
        getDb().exec(
          `CREATE UNIQUE INDEX CONCURRENTLY ${invalidIndexName} ON ${childTableName} (code)`,
        ),
      ).rejects.toThrow();

      const brokenIntegrity = await verifyIntegrity();
      expect(brokenIntegrity.ok).toBe(false);
      expect(brokenIntegrity.errors).toContain(
        `unvalidated postgres constraint: ${constraintName}`,
      );
      expect(brokenIntegrity.errors).toContain(
        `invalid or unready postgres index: ${invalidIndexName}`,
      );

      await getDb().exec(`DROP INDEX IF EXISTS ${invalidIndexName}`);
      await getDb().exec(`ALTER TABLE ${childTableName} VALIDATE CONSTRAINT ${constraintName}`);
      const restoredIntegrity = await verifyIntegrity();
      expect(restoredIntegrity).toEqual({ ok: true, errors: [] });

      if (await hasPgDumpBinary()) {
        const dir = await mkdtemp(join(tmpdir(), "mw-pg-backup-"));
        tempDirs.push(dir);
        const dumpPath = join(dir, "live.pgdump");
        await backupDatabase(dumpPath);
        expect(existsSync(dumpPath)).toBe(true);
      }
    } finally {
      await getDb()
        .exec(`DROP INDEX IF EXISTS ${invalidIndexName}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${childTableName}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${tableName}`)
        .catch(() => {});
      closeDb();
    }
  });

  it("[MW-0830] syncModels adds missing FK on an existing model table", async () => {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
    const authorTable = `pg_830_author_${suffix}`;
    const bookTable = `pg_830_book_${suffix}`;

    const authorModel = defineModel({
      name: `pg_830.author_${suffix}`,
      table: authorTable,
      schema: z.object({
        name: z.string().min(1),
      }),
    });

    await initDb(POSTGRES_TEST_URL);
    try {
      // Sync author table first
      await syncModels([authorModel]);

      // Pre-create book table WITHOUT FK (simulating existing-table drift)
      await getDb().exec(
        `CREATE TABLE IF NOT EXISTS ${bookTable} (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT,
          tenant_id TEXT NOT NULL DEFAULT 'default',
          create_date TEXT NOT NULL,
          write_date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          version INTEGER NOT NULL DEFAULT 1,
          source TEXT NOT NULL DEFAULT 'api'
        )`,
      );

      const bookModel = defineModel({
        name: `pg_830.book_${suffix}`,
        table: bookTable,
        schema: z.object({
          title: z.string().min(1),
          author: z.string().optional(),
        }),
        relations: {
          author: {
            type: "many2one",
            model: `pg_830.author_${suffix}`,
            targetField: "id",
            onDelete: "set null",
          },
        },
      });

      const _report = await syncModels([authorModel, bookModel]);

      // Verify FK was added to pg_constraint
      const fkRows = await getDb().all<{ conname: string }>(
        `SELECT con.conname FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = rel.relnamespace
         WHERE n.nspname = 'public' AND rel.relname = $1 AND con.contype = 'f'`,
        [bookTable.toLowerCase()],
      );
      expect(fkRows.length).toBeGreaterThan(0);

      // Re-running sync is idempotent - no duplicate FKs
      const _report2 = await syncModels([authorModel, bookModel]);
      const fkRows2 = await getDb().all<{ conname: string }>(
        `SELECT con.conname FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = rel.relnamespace
         WHERE n.nspname = 'public' AND rel.relname = $1 AND con.contype = 'f'`,
        [bookTable.toLowerCase()],
      );
      expect(fkRows2.length).toBe(fkRows.length);
    } finally {
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${bookTable}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${authorTable}`)
        .catch(() => {});
      closeDb();
    }
  });

  it("[MW-0831] syncModels adds FKs on existing Many2many join tables", async () => {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
    const userTable = `pg_831_user_${suffix}`;
    const tagTable = `pg_831_tag_${suffix}`;
    const joinTable = `pg_831_user_tags_${suffix}`;

    const userModel = defineModel({
      name: `pg_831.user_${suffix}`,
      table: userTable,
      schema: z.object({
        name: z.string().min(1),
      }),
    });

    const tagModel = defineModel({
      name: `pg_831.tag_${suffix}`,
      table: tagTable,
      schema: z.object({
        name: z.string().min(1),
      }),
    });

    await initDb(POSTGRES_TEST_URL);
    try {
      await syncModels([userModel, tagModel]);

      // Pre-create join table WITHOUT FKs (simulating existing join table drift)
      await getDb().exec(
        `CREATE TABLE IF NOT EXISTS ${joinTable} (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL DEFAULT 'default',
          source_id TEXT NOT NULL,
          target_id TEXT NOT NULL
        )`,
      );

      const m2mModel = defineModel({
        name: `pg_831.tagged_${suffix}`,
        table: joinTable,
        schema: z.object({
          name: z.string().min(1).nullable(),
        }),
        relations: {
          users: { type: "many2many", model: `pg_831.user_${suffix}`, through: joinTable },
        },
      });

      await syncModels([m2mModel]);

      // Verify both FKs were added to pg_constraint
      const fkRows = await getDb().all<{ conname: string; confrelid: number }>(
        `SELECT con.conname, con.confrelid FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = rel.relnamespace
         WHERE n.nspname = 'public' AND rel.relname = $1 AND con.contype = 'f'`,
        [joinTable.toLowerCase()],
      );
      expect(fkRows.length).toBe(2);

      // Re-running sync is idempotent
      const _report2 = await syncModels([m2mModel]);
      const fkRows2 = await getDb().all<{ conname: string }>(
        `SELECT con.conname FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = rel.relnamespace
         WHERE n.nspname = 'public' AND rel.relname = $1 AND con.contype = 'f'`,
        [joinTable.toLowerCase()],
      );
      expect(fkRows2.length).toBe(fkRows.length);
    } finally {
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${joinTable}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${tagTable}`)
        .catch(() => {});
      await getDb()
        .exec(`DROP TABLE IF EXISTS ${userTable}`)
        .catch(() => {});
      closeDb();
    }
  });
});
