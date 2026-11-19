import { applyMigrations, type Migration } from "@moonwitness/orm";
import type { AddonRegistry, RegistryState } from "./registry.js";

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

/**
 * Executes addon registry validation/loading and runs addon migrations once,
 * returning structured lifecycle diagnostics.
 */
export async function runAddonLifecycle(
  registry: AddonRegistry,
  migrations: Migration[] = [],
): Promise<AddonLifecycleResult> {
  const startedAt = Date.now();
  const order = registry.resolveOrder();
  const state = await registry.load();
  const migrationResult =
    migrations.length > 0 ? await applyMigrations(migrations) : { applied: [], skipped: [] };

  return {
    state,
    diagnostics: {
      order,
      loaded: [...order],
      migrations: migrationResult,
      durationMs: Date.now() - startedAt,
    },
  };
}

export function registerBaseAddon(_target?: unknown): void {
  // Base system models and metadata are registered via AddonRegistry.
}

export const systemModels = ["users", "settings", "health_check"] as const;
