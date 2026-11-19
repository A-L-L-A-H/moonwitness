import { createHash } from "node:crypto";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";

export interface Migration {
  id: string;
  up: string;
  owner?: string;
}

async function ensureMigrationsTable(executor?: LibSqlExecutor): Promise<void> {
  const db = getDb();
  const target = executor ?? db;
  await target.exec(`
    CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
      id TEXT PRIMARY KEY,
      owner TEXT,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const isPostgres = (db.kind ?? db.dialect) === "postgres";
  const columns = isPostgres
    ? await target.all<{ name: string }>(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '_orm_schema_migrations'",
      )
    : await target.all<{ name: string }>("PRAGMA table_info(_orm_schema_migrations)");
  const hasOwner = columns.some((col) => String(col.name).toLowerCase() === "owner");
  if (!hasOwner) {
    await target.exec("ALTER TABLE _orm_schema_migrations ADD COLUMN owner TEXT");
  }
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/**
 * Stable PostgreSQL advisory-lock key serializing `applyMigrations()` across every runtime
 * instance sharing one database. Distinct from the `syncModels()` lock key.
 */
export const PG_MIGRATION_ADVISORY_LOCK_KEY = 72491082;

const NON_TRANSACTIONAL_STATEMENT_RE =
  /\b(?:CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY|DROP\s+INDEX\s+CONCURRENTLY|REINDEX\s+(?:\([^)]*\)\s*)?(?:INDEX|TABLE|SCHEMA|DATABASE|SYSTEM)?\s*CONCURRENTLY|VACUUM|CREATE\s+DATABASE|DROP\s+DATABASE|CREATE\s+TABLESPACE|DROP\s+TABLESPACE|ALTER\s+SYSTEM|ALTER\s+TYPE\s+\S+\s+ADD\s+VALUE)\b/i;

function assertTransactionalMigration(migration: Migration): void {
  const match = NON_TRANSACTIONAL_STATEMENT_RE.exec(migration.up);
  if (match) {
    throw new Error(
      `Migration '${migration.id}' contains a statement that cannot run inside a PostgreSQL transaction ('${match[0].replace(/\s+/g, " ")}'). Migrations are atomic; split it out of the migration runner.`,
    );
  }
}

async function acquireMigrationLock(tx: LibSqlExecutor): Promise<void> {
  await tx.all(`SELECT pg_advisory_xact_lock(${PG_MIGRATION_ADVISORY_LOCK_KEY})`);
}

export async function applyMigrations(
  migrations: Migration[],
): Promise<{ applied: string[]; skipped: string[] }> {
  const handle = getDb();
  const isPostgres = (handle.kind ?? handle.dialect) === "postgres";
  if (isPostgres) {
    for (const migration of migrations) assertTransactionalMigration(migration);
    await handle.transaction(async (tx) => {
      await acquireMigrationLock(tx);
      await ensureMigrationsTable(tx);
    });
  } else {
    await ensureMigrationsTable();
  }
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    const hash = checksum(migration.up);
    const wasApplied = await getDb().transaction(async (tx) => {
      if (isPostgres) await acquireMigrationLock(tx);
      const existing = await tx.get<{ id: string; checksum: string }>(
        "SELECT id, checksum FROM _orm_schema_migrations WHERE id = ?",
        [migration.id],
      );
      if (existing) {
        if (existing.checksum !== hash) {
          throw new Error(
            `Migration '${migration.id}' checksum mismatch. Existing migrations must not be modified.`,
          );
        }
        return false;
      }
      await tx.exec(migration.up);
      await tx.run(
        "INSERT INTO _orm_schema_migrations (id, owner, checksum, applied_at) VALUES (?, ?, ?, ?)",
        [migration.id, migration.owner ?? null, hash, new Date().toISOString()],
      );
      return true;
    });
    (wasApplied ? applied : skipped).push(migration.id);
  }

  return { applied, skipped };
}
export async function listAppliedMigrations(
  owner?: string,
): Promise<Array<{ id: string; owner: string | null; checksum: string; applied_at: string }>> {
  await ensureMigrationsTable();
  if (owner !== undefined) {
    return getDb().all<{ id: string; owner: string | null; checksum: string; applied_at: string }>(
      "SELECT id, owner, checksum, applied_at FROM _orm_schema_migrations WHERE owner = ? ORDER BY applied_at, id",
      [owner],
    );
  }
  return getDb().all<{ id: string; owner: string | null; checksum: string; applied_at: string }>(
    "SELECT id, owner, checksum, applied_at FROM _orm_schema_migrations ORDER BY applied_at, id",
  );
}
