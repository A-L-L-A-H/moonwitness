import { AsyncLocalStorage } from "node:async_hooks";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { isPostgresUrl, type PostgresDriver, type PoolLike } from "./drivers/postgres.driver.js";
import { D1Driver, type D1DatabaseLike } from "./drivers/d1.driver.js";

export interface OrmDriverHandle extends LibSqlExecutor {
  readonly kind?: "sqlite" | "postgres" | "d1";
  readonly dialect?: "sqlite" | "postgres" | "d1";
  getConnectionString?(): string | null;
  close(): void;
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

interface TransactionContext {
  readonly handle: OrmDriverHandle;
  active: boolean;
}

const transactionStorage = new AsyncLocalStorage<TransactionContext>();

const EXECUTOR_METHODS = new Set<PropertyKey>(["run", "all", "get", "exec"]);

function bindHandleToTransaction(base: OrmDriverHandle, tx: LibSqlExecutor): OrmDriverHandle {
  return new Proxy(base, {
    get(target, prop) {
      if (EXECUTOR_METHODS.has(prop)) {
        return (Reflect.get(tx, prop) as (...args: unknown[]) => unknown).bind(tx);
      }
      if (prop === "transaction") {
        // Nested transactions join the active transaction; savepoints are intentionally unsupported.
        return <R>(cb: (inner: LibSqlExecutor) => Promise<R>) => cb(tx);
      }
      if (prop === "close") {
        return () => {
          throw new Error("Cannot close the ORM driver from inside an active transaction.");
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

/** Wrap a driver so `transaction()` publishes the transaction-bound handle to the async context. */
function withTransactionContext(base: OrmDriverHandle): OrmDriverHandle {
  return new Proxy(base, {
    get(target, prop) {
      if (prop === "transaction") {
        return <R>(cb: (tx: LibSqlExecutor) => Promise<R>): Promise<R> =>
          target.transaction(async (tx) => {
            const context: TransactionContext = {
              handle: bindHandleToTransaction(target, tx),
              active: true,
            };
            try {
              return await transactionStorage.run(context, () => cb(tx));
            } finally {
              context.active = false;
            }
          });
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

/**
 * Run `fn` in one database transaction. Every `getDb()` call made inside `fn` (including ORM
 * repository operations, hooks, audit and outbox writes) is bound to the same transaction
 * connection through async-local context. Nested calls join the outer transaction; there are no
 * savepoints. The context is cleared on commit and rollback.
 */
export async function withTransaction<T>(fn: (tx: LibSqlExecutor) => Promise<T>): Promise<T> {
  return getDb().transaction(fn);
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

export function getDb(): OrmDriverHandle {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  const context = transactionStorage.getStore();
  const base = context?.active ? context.handle : withTransactionContext(db);
  rawHandleMap.set(base, db);
  const budget = queryBudgetStorage.getStore();
  if (!budget) return base;
  const wrapped = wrapExecutorWithBudget(base, budget);
  rawHandleMap.set(wrapped, db);
  return wrapped;
}
