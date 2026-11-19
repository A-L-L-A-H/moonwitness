import { AsyncLocalStorage } from "node:async_hooks";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { isPostgresUrl, type PostgresDriver, type PoolLike } from "./drivers/postgres.driver.js";
import { D1Driver, type D1DatabaseLike } from "./drivers/d1.driver.js";

export interface OrmDriverHandle extends LibSqlExecutor {
  readonly kind?: "sqlite" | "postgres" | "d1";
  readonly dialect?: "sqlite" | "postgres" | "d1";
  getConnectionString?(): string | null;
  close(): void;
  closeAsync?(): Promise<void>;
  transaction<T>(fn: (tx: LibSqlExecutor) => Promise<T>): Promise<T>;
}

interface QueryBudgetState {
  count: number;
  maxQueries: number;
  parent?: QueryBudgetState;
}

const queryBudgetStorage = new AsyncLocalStorage<QueryBudgetState>();
const rawHandleMap = new WeakMap<OrmDriverHandle, OrmDriverHandle>();

/** Unwrap any query-budget proxy around an ORM driver handle. */
export function unwrapDriverHandle(handle: OrmDriverHandle): OrmDriverHandle {
  return rawHandleMap.get(handle) ?? handle;
}

function recordBudgetQuery(state: QueryBudgetState): void {
  if (state.parent) {
    recordBudgetQuery(state.parent);
  }
  state.count += 1;
  if (state.count > state.maxQueries) {
    throw new Error(
      `Query budget exceeded: executed ${state.count} queries, limit is ${state.maxQueries}.`,
    );
  }
}

function wrapExecutorWithBudget<T extends LibSqlExecutor>(executor: T, state: QueryBudgetState): T {
  return new Proxy(executor, {
    get(target, prop, receiver) {
      if (prop === "run" || prop === "all" || prop === "get" || prop === "exec") {
        const fn = Reflect.get(target, prop, target) as (...args: unknown[]) => Promise<unknown>;
        return (...args: unknown[]) => {
          recordBudgetQuery(state);
          return fn.apply(target, args);
        };
      }
      if (prop === "transaction") {
        const txFn = Reflect.get(target, prop, target) as <R>(
          cb: (tx: LibSqlExecutor) => Promise<R>,
        ) => Promise<R>;
        return <R>(cb: (tx: LibSqlExecutor) => Promise<R>) =>
          txFn.call(target, (tx) => cb(wrapExecutorWithBudget(tx, state)));
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Execute `fn` while asserting that total ORM driver queries do not exceed `maxQueries`.
 */
export async function withQueryBudget<T>(maxQueries: number, fn: () => Promise<T>): Promise<T> {
  if (!Number.isInteger(maxQueries) || maxQueries < 0) {
    throw new Error("maxQueries must be a non-negative integer.");
  }
  const state: QueryBudgetState = {
    count: 0,
    maxQueries,
    parent: queryBudgetStorage.getStore(),
  };
  return queryBudgetStorage.run(state, fn);
}

let db: OrmDriverHandle | null = null;

/** Initialize the active ORM handle using PostgreSQL (`PostgresDriver`) or local libSQL (`LibSqlDriver`). */
export async function initDb(dbPathOrUrl: string): Promise<OrmDriverHandle> {
  if (db) {
    throw new Error("Database already initialized. Call closeDb() first.");
  }
  if (isPostgresUrl(dbPathOrUrl)) {
    const { PostgresDriver } = await import("./drivers/postgres.driver.js");
    const driver = new PostgresDriver();
    await driver.init(dbPathOrUrl);
    db = driver;
    return driver;
  }
  const { LibSqlDriver } = await import("./drivers/sqlite.driver.js");
  const driver = new LibSqlDriver();
  await driver.init(dbPathOrUrl);
  db = driver;
  return driver;
}

/** Initialize the active ORM handle using an explicit or overridden PostgreSQL pool. */
export async function initPostgresDb(
  connectionString: string,
  poolOverride?: PoolLike,
): Promise<PostgresDriver> {
  if (db) {
    throw new Error("Database already initialized. Call closeDb() first.");
  }
  const { PostgresDriver: PgDriver } = await import("./drivers/postgres.driver.js");
  const driver = new PgDriver();
  await driver.init(connectionString, poolOverride);
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

/** Close the active ORM handle and await asynchronous driver resource shutdown. */
export async function closeDbAsync(): Promise<void> {
  const current = db;
  db = null;
  if (!current) return;
  if (current.closeAsync) {
    await current.closeAsync();
    return;
  }
  current.close();
}

export function getDb(): OrmDriverHandle {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  const budget = queryBudgetStorage.getStore();
  if (!budget) return db;
  const wrapped = wrapExecutorWithBudget(db, budget);
  rawHandleMap.set(wrapped, db);
  return wrapped;
}
