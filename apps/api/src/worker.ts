import { initD1Db, closeDb, type D1DatabaseLike } from "@moonwitness/orm";
import type { EdgeAppInstance } from "./infrastructure/adapters/edge-router";

export interface ApiWorkerEnv {
  DB: D1DatabaseLike;
  NODE_ENV?: string;
  API_PREFIX?: string;
  DATABASE_URL?: string;
  CORS_ORIGINS?: string;
  TRUSTED_PROXY_COUNT?: string;
  LOG_LEVEL?: string;
  RATE_LIMIT_MAX?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  STORAGE_URL?: string;
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  RADIUS_URL?: string;
  SYSLOG_URL?: string;
  SNMP_POLLER_URL?: string;
  RIOT_AI_BASE_URL?: string;
  RIOT_AI_MODEL?: string;
  MEMORY_API_URL?: string;
  MW_BOOTSTRAP_ADMIN_USERNAME?: string;
  MW_BOOTSTRAP_ADMIN_EMAIL?: string;
  MW_BOOTSTRAP_ADMIN_PASSWORD?: string;
  MW_BOOTSTRAP_ADMIN_DISPLAY_NAME?: string;
  SEED?: string;
  ALLOW_DEMO_SEED?: string;
  [key: string]: unknown;
}

let appPromise: Promise<EdgeAppInstance> | null = null;

function syncProcessEnv(workerEnv: ApiWorkerEnv): void {
  if (typeof process === "undefined" || !process.env) return;
  for (const [key, value] of Object.entries(workerEnv)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

async function getOrInitApp(workerEnv: ApiWorkerEnv): Promise<EdgeAppInstance> {
  syncProcessEnv(workerEnv);
  initD1Db(workerEnv.DB);

  if (!appPromise) {
    appPromise = (async () => {
      const [{ assertProductionEnv, env }, { buildEdgeApp }] = await Promise.all([
        import("./shared/env"),
        import("./bootstrap"),
      ]);
      assertProductionEnv(env);
      return buildEdgeApp({
        prefix: env.API_PREFIX,
        disableDocs: true,
      });
    })().catch((error: unknown) => {
      appPromise = null;
      throw error;
    });
  }

  return appPromise;
}

/** Reset cached isolate instance (used by test suites only). */
export async function resetWorkerForTests(): Promise<void> {
  if (appPromise) {
    try {
      const app = await appPromise;
      await app.close();
    } catch {
      // Ignore failed startup teardown in tests.
    }
    appPromise = null;
  }
  closeDb();
}

const workerHandler = {
  async fetch(request: Request, env: ApiWorkerEnv): Promise<Response> {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 database binding DB is missing" }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const app = await getOrInitApp(env);
    return app.fetch(request);
  },
};

export default workerHandler;
