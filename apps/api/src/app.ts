import { initDb, closeDb } from "@moonwitness/orm";
import type { FastifyInstance } from "fastify";
import { env } from "./shared/env";
import { buildCoreApp } from "./bootstrap";

export interface BootstrapOptions {
  dbPath?: string;
  prefix?: string;
  /** Load the demo/story-world fixture rows. Off unless explicitly requested. */
  seed?: boolean;
}

export async function buildApp(options: BootstrapOptions = {}): Promise<FastifyInstance> {
  const dbPath = options.dbPath ?? env.DATABASE_URL ?? "./moonwitness.db";
  await initDb(dbPath);
  try {
    const fastify = await buildCoreApp({
      prefix: options.prefix,
      seed: options.seed,
    });
    fastify.addHook("onClose", async () => {
      closeDb();
    });
    return fastify;
  } catch (error) {
    closeDb();
    throw error;
  }
}
