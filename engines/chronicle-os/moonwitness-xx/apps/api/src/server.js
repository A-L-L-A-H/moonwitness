import { loadApiConfig } from "@moonwitness/config";
import Redis from "ioredis";
import { createOrm } from "@moonwitness/database";
import { buildApp } from "./app.js";

const config = loadApiConfig();
const orm = await createOrm(config.databaseUrl);
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: true
});

try {
  await redis.connect();
  await redis.ping();

  const app = await buildApp({ orm, redis, config, logger: true });

  app.addHook("onClose", async () => {
    await redis.quit();
    await orm.close(true);
  });

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, "graceful shutdown started");
    await app.close();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  await redis.quit().catch(() => {});
  await orm.close(true).catch(() => {});
  throw error;
}
