import { MikroORM } from "@mikro-orm/postgresql";
import config from "../mikro-orm.config.js";
import { loadDatabaseConfig } from "@moonwitness/config";

export async function createOrm(clientUrl = loadDatabaseConfig().databaseUrl) {
  if (!clientUrl) {
    throw new Error("DATABASE_URL is required to initialize the database");
  }

  return MikroORM.init({
    ...config,
    clientUrl
  });
}
