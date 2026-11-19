import { applyMigrations, getDb, type Migration } from "@moonwitness/orm";
import type { AddonRegistry, RegistryState } from "./registry.js";

type ApplyMigrationsWithOwner = (
  migrations: Migration[],
  options?: { expectedOwner?: string },
) => Promise<{ applied: string[]; skipped: string[] }>;

export interface AddonLifecycleDiagnostics {
  order: string[];
  loaded: string[];
  migrations: {
    applied: string[];
    skipped: string[];
  };
  durationMs: number;
}

export interface AddonLifecycleResult {
  state: RegistryState;
  diagnostics: AddonLifecycleDiagnostics;
}

async function verifyExistingMigrationOwners(
  migrations: Migration[],
  expectedOwner: string,
): Promise<void> {
  if (migrations.length === 0) return;
  const db = getDb();
  const tableExists =
    db.dialect === "postgres"
      ? Boolean(
          (
            await db.get<{ name: string | null }>(
              "SELECT to_regclass('_orm_schema_migrations') AS name",
            )
          )?.name,
        )
      : Boolean(
          await db.get<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_orm_schema_migrations'",
          ),
        );
  if (!tableExists) return;
  for (const m of migrations) {
    const existing = await db.get<{ id: string; owner: string | null }>(
      "SELECT id, owner FROM _orm_schema_migrations WHERE id = ?",
      [m.id],
    );
    if (existing && existing.owner !== null && existing.owner !== expectedOwner) {
      throw new Error(
        `Migration '${m.id}' is owned by '${existing.owner}', expected '${expectedOwner}'.`,
      );
    }
  }
}

export async function applyAddonOwnedMigrations(
  addonName: string,
  migrations: Migration[],
): Promise<{ applied: string[]; skipped: string[] }> {
  if (migrations.length === 0) {
    return { applied: [], skipped: [] };
  }
  const normalized: Migration[] = migrations.map((m) => {
    if (m.owner !== undefined && m.owner !== addonName) {
      throw new Error(
        `Addon '${addonName}' migration '${m.id}' has owner '${m.owner}' which does not match '${addonName}'.`,
      );
    }
    return { ...m, owner: addonName };
  });
  await verifyExistingMigrationOwners(normalized, addonName);
  return (applyMigrations as ApplyMigrationsWithOwner)(normalized, {
    expectedOwner: addonName,
  });
}

/**
 * Executes addon registry validation/loading and runs per-addon and shared
 * migrations in dependency order, returning structured lifecycle diagnostics.
 */
export async function runAddonLifecycle(
  registry: AddonRegistry,
  migrations: Migration[] = [],
): Promise<AddonLifecycleResult> {
  const startedAt = Date.now();
  const order = registry.resolveOrder();
  const state = await registry.load();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const addonName of order) {
    const addonMigrations = registry.getMigrations(addonName);
    if (addonMigrations.length > 0) {
      const res = await applyAddonOwnedMigrations(addonName, addonMigrations);
      applied.push(...res.applied);
      skipped.push(...res.skipped);
    }
  }

  if (migrations.length > 0) {
    const extraResult = await applyMigrations(migrations);
    applied.push(...extraResult.applied);
    skipped.push(...extraResult.skipped);
  }

  return {
    state,
    diagnostics: {
      order,
      loaded: [...order],
      migrations: { applied, skipped },
      durationMs: Date.now() - startedAt,
    },
  };
}

export function registerBaseAddon(_target?: unknown): void {
  // Base system models and metadata are registered via AddonRegistry.
}

export const systemModels = ["users", "settings", "health_check"] as const;
