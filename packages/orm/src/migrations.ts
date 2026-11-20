import { createHash } from "node:crypto";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";

export interface Migration {
  id: string;
  up: string;
  owner?: string;
}

const POSTGRES_LEDGER_LOCK = "moonwitness:orm:migration-ledger";
const POSTGRES_MIGRATION_LOCK_PREFIX = "moonwitness:orm:migration:";

const POSTGRES_NON_TRANSACTIONAL_STATEMENT =
  /(?:^|;)\s*(?:CREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b|DROP\s+INDEX\s+CONCURRENTLY\b|REINDEX\b[^;]*\bCONCURRENTLY\b|VACUUM\b|CREATE\s+DATABASE\b|DROP\s+DATABASE\b|ALTER\s+SYSTEM\b|CHECKPOINT\b)/i;

async function acquirePostgresMigrationLock(
  tx: LibSqlExecutor,
  lockKey: string,
): Promise<void> {
  await tx.get(
    "SELECT pg_advisory_xact_lock(hashtextextended(?, 0::bigint))",
    [lockKey],
  );
}

function assertPostgresMigrationIsTransactional(migration: Migration): void {
  const withoutComments = migration.up
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\r\n]*/g, " ");
  const statement = POSTGRES_NON_TRANSACTIONAL_STATEMENT.exec(withoutComments)?.[0]?.trim();
  if (statement) {
    throw new Error(
      `Migration '${migration.id}' contains a PostgreSQL statement that cannot run inside a transaction (${statement}). Non-transactional migrations require a separately reviewed migration contract.`,
    );
  }
}

async function ensureMigrationsTable(): Promise<void> {
  const db = getDb();
  const isPostgres = (db.kind ?? db.dialect) === "postgres";
  if (isPostgres) {
    await db.transaction(async (tx) => {
      await acquirePostgresMigrationLock(tx, POSTGRES_LEDGER_LOCK);
      await tx.exec(`
        CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
          id TEXT PRIMARY KEY,
          owner TEXT,
          checksum TEXT NOT NULL,
          applied_at TEXT NOT NULL
        )
      `);
      const columns = await tx.all<{ name: string }>(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '_orm_schema_migrations'",
      );
      const hasOwner = columns.some((col) => String(col.name).toLowerCase() === "owner");
      if (!hasOwner) {
        await tx.exec("ALTER TABLE _orm_schema_migrations ADD COLUMN owner TEXT");
      }
    });
    return;
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
      id TEXT PRIMARY KEY,
      owner TEXT,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const columns = await db.all<{ name: string }>("PRAGMA table_info(_orm_schema_migrations)");
  const hasOwner = columns.some((col) => String(col.name).toLowerCase() === "owner");
  if (!hasOwner) {
    await db.exec("ALTER TABLE _orm_schema_migrations ADD COLUMN owner TEXT");
  }
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

export async function applyMigrations(
  migrations: Migration[],
): Promise<{ applied: string[]; skipped: string[] }> {
  await ensureMigrationsTable();
  const db = getDb();
  const isPostgres = (db.kind ?? db.dialect) === "postgres";
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    if (isPostgres) {
      assertPostgresMigrationIsTransactional(migration);
    }
    const hash = checksum(migration.up);
    const outcome = await db.transaction(async (tx) => {
      if (isPostgres) {
        await acquirePostgresMigrationLock(
          tx,
          `${POSTGRES_MIGRATION_LOCK_PREFIX}${migration.id}`,
        );
      }

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
        return "skipped" as const;
      }

      await tx.exec(migration.up);
      await tx.run(
        "INSERT INTO _orm_schema_migrations (id, owner, checksum, applied_at) VALUES (?, ?, ?, ?)",
        [migration.id, migration.owner ?? null, hash, new Date().toISOString()],
      );
      return "applied" as const;
    });

    if (outcome === "applied") {
      applied.push(migration.id);
    } else {
      skipped.push(migration.id);
    }
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