import { createHash } from "node:crypto";
import { getDb } from "./driver.js";

export interface Migration {
  id: string;
  up: string;
  owner?: string;
}

async function ensureMigrationsTable(): Promise<void> {
  const db = getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
      id TEXT PRIMARY KEY,
      owner TEXT,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const isPostgres = (db.kind ?? db.dialect) === "postgres";
  const columns = isPostgres
    ? await db.all<{ name: string }>(
        "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '_orm_schema_migrations'",
      )
    : await db.all<{ name: string }>("PRAGMA table_info(_orm_schema_migrations)");
  const hasOwner = columns.some((col) => String(col.name).toLowerCase() === "owner");
  if (!hasOwner) {
    await db.exec("ALTER TABLE _orm_schema_migrations ADD COLUMN owner TEXT");
  }
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/**
 * Deterministic 64-bit FNV-1a hash of a migration id, used as the
 * PostgreSQL transaction-scoped advisory-lock key. Stable across processes
 * and runtimes, so concurrent migration runners contend on the same lock.
 */
export function migrationLockKey(migrationId: string): bigint {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < migrationId.length; i += 1) {
    hash ^= BigInt(migrationId.charCodeAt(i));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash;
}

/**
 * Apply pending migrations.
 *
 * PostgreSQL: each migration runs inside a transaction that first takes a
 * transaction-scoped advisory lock (`pg_advisory_xact_lock`), then re-reads
 * the ledger, so concurrent runners serialize: exactly one applies, others
 * skip. Migration SQL and the ledger insert commit or roll back together.
 */
export async function applyMigrations(
  migrations: Migration[],
): Promise<{ applied: string[]; skipped: string[] }> {
  await ensureMigrationsTable();
  const applied: string[] = [];
  const skipped: string[] = [];
  const db = getDb();
  const isPostgres = (db.kind ?? db.dialect) === "postgres";

  for (const migration of migrations) {
    const hash = checksum(migration.up);

    await db.transaction(async (tx) => {
      if (isPostgres) {
        await tx.exec(`SELECT pg_advisory_xact_lock(${migrationLockKey(migration.id)}::bigint)`);
      }

      // Re-read the ledger inside the locked transaction to close the race window.
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
        skipped.push(migration.id);
        return;
      }

      await tx.exec(migration.up);
      await tx.run(
        "INSERT INTO _orm_schema_migrations (id, owner, checksum, applied_at) VALUES (?, ?, ?, ?)",
        [migration.id, migration.owner ?? null, hash, new Date().toISOString()],
      );
      applied.push(migration.id);
    });
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
