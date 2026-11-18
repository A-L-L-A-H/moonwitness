import { createHash } from "node:crypto";
import { getDb } from "./driver.js";

export interface Migration {
  id: string;
  up: string;
  owner?: string;
}

async function ensureMigrationsTable(): Promise<void> {
  await getDb().exec(`
    CREATE TABLE IF NOT EXISTS _orm_schema_migrations (
      id TEXT PRIMARY KEY,
      owner TEXT,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  const columns = await getDb().all<{ name: string }>("PRAGMA table_info(_orm_schema_migrations)");
  const hasOwner = columns.some((col) => String(col.name).toLowerCase() === "owner");
  if (!hasOwner) {
    await getDb().exec("ALTER TABLE _orm_schema_migrations ADD COLUMN owner TEXT");
  }
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

export async function applyMigrations(
  migrations: Migration[],
): Promise<{ applied: string[]; skipped: string[] }> {
  await ensureMigrationsTable();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    const existing = await getDb().get<{ id: string; checksum: string }>(
      "SELECT id, checksum FROM _orm_schema_migrations WHERE id = ?",
      [migration.id],
    );
    const hash = checksum(migration.up);

    if (existing) {
      if (existing.checksum !== hash) {
        throw new Error(
          `Migration '${migration.id}' checksum mismatch. Existing migrations must not be modified.`,
        );
      }
      skipped.push(migration.id);
      continue;
    }

    await getDb().transaction(async (tx) => {
      await tx.exec(migration.up);
      await tx.run(
        "INSERT INTO _orm_schema_migrations (id, owner, checksum, applied_at) VALUES (?, ?, ?, ?)",
        [migration.id, migration.owner ?? null, hash, new Date().toISOString()],
      );
    });
    applied.push(migration.id);
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
