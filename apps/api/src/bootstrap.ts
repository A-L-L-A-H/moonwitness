import { getDb, applyMigrations } from "@moonwitness/orm";
import { env } from "./shared/env";
import { AddonRegistry } from "@moonwitness/addon-base/registry";
import { registerBaseAddon } from "@moonwitness/addon-base";
import {
  registerTimelineAddon,
  seedTimeline,
  timelineDdl,
  timelineManifest,
  timelineRoutesPrefix,
} from "@moonwitness/addon-timeline";
import { authMigrations } from "./db/migrations";
import type { FastifyInstance } from "fastify";
import { assertDemoSeedAllowed } from "./shared/seed-safety";
import { riotAiRoutes } from "./interface/routes/riot-ai.routes";
import { commandCenterRoutes } from "./interface/routes/command-center.routes";
import { commandCenterMigrations } from "./interface/routes/command-center.persistence";
import { memoryRoutes } from "./interface/routes/memory.routes";

export interface CoreAppOptions {
  prefix?: string;
  /** Load the demo/story-world fixture rows. Off unless explicitly requested. */
  seed?: boolean;
  /** Skip Swagger UI registration. */
  disableDocs?: boolean;
}

const BASE_MANIFEST = {
  name: "__base",
  version: "0.1.0",
  depends: [] as string[],
  provides: { routes: ["health", "_meta"], models: [] as string[] },
};

async function migrateAndSeed(seed: boolean): Promise<void> {
  const db = getDb();
  await db.exec(timelineDdl);
  await applyMigrations([...authMigrations, ...commandCenterMigrations]);
  if (seed) {
    await seedTimeline();
  }
}

async function registerAddonTree(target: FastifyInstance, prefix: string): Promise<void> {
  const registry = new AddonRegistry();
  registry.add({
    manifest: BASE_MANIFEST,
    register: async () => {
      await registerBaseAddon(target);
    },
  });
  registry.add({
    manifest: timelineManifest,
    register: async () => {
      await registerTimelineAddon(target, { prefix: prefix + timelineRoutesPrefix });
    },
  });
  registry.add({
    manifest: {
      name: "riot-ai",
      version: "0.1.0",
      depends: [],
      provides: { routes: ["riot-ai"], models: [] as string[] },
    },
    register: async () => {
      await target.register(riotAiRoutes);
      await target.register(commandCenterRoutes);
      await target.register(memoryRoutes);
    },
  });
  await registry.load();
}

/**
 * Builds the Node.js Fastify application using whichever `@moonwitness/orm` driver is already initialized.
 */
export async function buildCoreApp(options: CoreAppOptions = {}): Promise<FastifyInstance> {
  const prefix = options.prefix ?? env.API_PREFIX ?? "/api/v1";
  const seed = options.seed ?? process.env.SEED === "1";
  if (seed) {
    assertDemoSeedAllowed({
      nodeEnv: env.NODE_ENV,
      allowDemoSeed: process.env.ALLOW_DEMO_SEED ?? "0",
    });
  }

  await migrateAndSeed(seed);

  const { buildFastify } = await import("./infrastructure/adapters/fastify.adapter");
  const fastify = await buildFastify({
    prefix,
    disableDocs: options.disableDocs,
  });

  await registerAddonTree(fastify, prefix);
  return fastify;
}
