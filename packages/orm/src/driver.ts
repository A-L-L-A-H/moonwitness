import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { D1Driver, type D1DatabaseLike } from "./drivers/d1.driver.js";

export interface OrmDriverHandle extends LibSqlExecutor {
  close(): void;
  transaction<T>(fn: (tx: LibSqlExecutor) => Promise<T>): Promise<T>;
}

let db: OrmDriverHandle | null = null;

/** Initialize the active ORM handle using local libSQL (`LibSqlDriver`). */
export async function initDb(dbPath: string): Promise<OrmDriverHandle> {
  if (db) {
    throw new Error("Database already initialized. Call closeDb() first.");
  }
  const { LibSqlDriver } = await import("./drivers/sqlite.driver.js");
  const driver = new LibSqlDriver();
  await driver.init(dbPath);
  db = driver;
  return driver;
}

/** Initialize or rebind the active ORM handle to a Cloudflare Workers D1 database. */
export function initD1Db(d1: D1DatabaseLike): D1Driver {
  if (db instanceof D1Driver) {
    db.rebind(d1);
    return db;
  }
  if (db) {
    db.close();
  }
  const driver = new D1Driver(d1);
  db = driver;
  return driver;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDb(): OrmDriverHandle {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}
