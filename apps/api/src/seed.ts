import { initDb, closeDb, getDb } from "@moonwitness/orm";
import { seedTimeline, timelineDdl } from "@moonwitness/addon-timeline";
import { env } from "./shared/env";
import { assertDemoSeedAllowed } from "./shared/seed-safety";

async function main() {
  assertDemoSeedAllowed({
    nodeEnv: env.NODE_ENV,
    allowDemoSeed: process.env.ALLOW_DEMO_SEED ?? "0",
  });
  const dbPath = process.env.DATABASE_URL ?? "./moonwitness.db";
  await initDb(dbPath);
  await getDb().exec(timelineDdl);
  await seedTimeline();
  console.log("Database seeded (idempotent)");
  closeDb();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  closeDb();
  process.exit(1);
});
