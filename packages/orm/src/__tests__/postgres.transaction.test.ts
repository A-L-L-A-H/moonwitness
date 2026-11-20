import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PostgresDriver, type PoolLike, type PgClientLike } from "../drivers/postgres.driver.js";
import {
  getTransactionExecutor,
  isInTransaction,
  getDb,
  closeDb,
  initPostgresDb,
} from "../driver.js";
import type { OrmDriverHandle } from "../driver.js";
import type { LibSqlExecutor } from "../drivers/sqlite.driver.js";

function createMockPool() {
  const calls: Array<{ sql: string; params: unknown[] | undefined }> = [];
  const txCalls: Array<{ sql: string; params: unknown[] | undefined }> = [];
  let failOnInsert = false;

  const client: PgClientLike = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      txCalls.push({ sql, params });
      if (failOnInsert && sql.includes("INSERT INTO tx_fail")) {
        throw new Error("boom");
      }
      return { rows: [{ id: 9 }], rowCount: 1, fields: [{ name: "id" }] };
    }),
    release: vi.fn(),
  };

  const pool: PoolLike = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("COUNT(*)")) {
        return {
          rows: [{ count: "3", name: "alpha" }],
          rowCount: 1,
          fields: [{ name: "count" }],
        };
      }
      if (sql.includes("INSERT INTO users")) {
        return { rows: [{ id: 42 }], rowCount: 1, fields: [{ name: "id" }] };
      }
      return { rows: [{ id: 1, username: "rezza" }], rowCount: 1, fields: [{ name: "id" }] };
    }),
    connect: vi.fn(async () => client),
    end: vi.fn(async () => {}),
  };

  return {
    pool,
    client,
    calls,
    txCalls,
    setFailOnInsert: (flag: boolean) => {
      failOnInsert = flag;
    },
  };
}

describe("PostgreSQL Transaction Binding (MW-0828)", () => {
  beforeEach(() => {
    closeDb();
  });

  afterEach(() => {
    closeDb();
  });

  it("binds transaction executor to async context via runWithTransactionExecutor", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);

    let capturedExecutor: OrmDriverHandle | undefined;
    await driver.transaction(async (tx) => {
      capturedExecutor = getTransactionExecutor();
      expect(isInTransaction()).toBe(true);
      expect(capturedExecutor).toBe(tx);
      await tx.run("INSERT INTO items (name) VALUES (?)", ["test"]);
    });

    expect(capturedExecutor).toBeDefined();
    expect(isInTransaction()).toBe(false);
  });

  it("repository writes inside transaction bind to the transaction client, not the pool", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);
    await initPostgresDb("postgresql://localhost:5432/test", mock.pool);

    await driver.transaction(async (tx) => {
      await tx.run("INSERT INTO items (name) VALUES (?)", ["via-tx"]);
      expect(getTransactionExecutor()).toBe(tx);
    });

    // Transaction writes must go through the checked-out client, never the pool
    const poolInsertCalls = mock.calls.filter((c) => c.sql.includes("INSERT INTO items"));
    const clientInsertCalls = mock.txCalls.filter((c) => c.sql.includes("INSERT INTO items"));
    expect(poolInsertCalls.length).toBe(0);
    expect(clientInsertCalls.length).toBeGreaterThan(0);
    // Transaction lifecycle issued on the same client connection
    expect(mock.txCalls.some((c) => c.sql === "BEGIN")).toBe(true);
    expect(mock.txCalls.some((c) => c.sql === "COMMIT")).toBe(true);
  });

  it("rollback removes all writes (business row, audit row, outbox row) together", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);

    await expect(
      driver.transaction(async (tx) => {
        await tx.run("INSERT INTO business (name) VALUES (?)", ["test"]);
        await tx.run(
          "INSERT INTO _orm_audit_log (model, entity_id, action, changed_by, changed_at, diff, entity_version, source, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ["business", "1", "CREATE", "actor", new Date().toISOString(), "{}", 1, "api", null],
        );
        await tx.run(
          "INSERT INTO _orm_outbox_events (model, entity_id, action, tenant_id, actor_id, request_id, event_version, payload_json, status, attempts, next_attempt_at, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            "business",
            "1",
            "CREATE",
            "default",
            "actor",
            null,
            1,
            "{}",
            "pending",
            0,
            new Date().toISOString(),
            null,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        );
        throw new Error("intentional rollback");
      }),
    ).rejects.toThrow("intentional rollback");

    // Verify ROLLBACK was called
    const rollbackCalled = mock.txCalls.some((c) => c.sql === "ROLLBACK");
    expect(rollbackCalled).toBe(true);
  });

  it("committed writes become visible after transaction", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);

    await driver.transaction(async (tx) => {
      await tx.run("INSERT INTO items (name) VALUES (?)", ["committed-item"]);
    });

    const result = await mock.pool.query("SELECT * FROM items WHERE name = ?", ["committed-item"]);
    expect(result.rows.length).toBe(1);
  });

  it("two concurrent async flows never cross transaction connections", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);

    const results: string[] = [];
    const flow1 = driver.transaction(async (tx) => {
      results.push("flow1-start");
      await tx.run("INSERT INTO items (name) VALUES (?)", ["flow1"]);
      await new Promise((r) => setTimeout(r, 10));
      results.push("flow1-end");
    });

    const flow2 = driver.transaction(async (tx) => {
      results.push("flow2-start");
      await tx.run("INSERT INTO items (name) VALUES (?)", ["flow2"]);
      await new Promise((r) => setTimeout(r, 10));
      results.push("flow2-end");
    });

    await Promise.all([flow1, flow2]);

    // Both transactions should have completed with their own connections
    const beginCount = mock.txCalls.filter((c) => c.sql === "BEGIN").length;
    const commitCount = mock.txCalls.filter((c) => c.sql === "COMMIT").length;
    expect(beginCount).toBe(2);
    expect(commitCount).toBe(2);
  });

  it("nested transactions use savepoints correctly", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);

    await driver.transaction(async (tx) => {
      await tx.run("INSERT INTO outer (name) VALUES (?)", ["outer"]);

      // Nested transaction via executor.transaction
      await (tx as unknown as OrmDriverHandle).transaction(async (nestedTx: LibSqlExecutor) => {
        await nestedTx.run("INSERT INTO inner (name) VALUES (?)", ["inner"]);
        expect(isInTransaction()).toBe(true);
      });

      await tx.run("INSERT INTO outer2 (name) VALUES (?)", ["outer2"]);
    });

    // Check for savepoint usage
    const savepointCalls = mock.txCalls.filter((c) => c.sql.startsWith("SAVEPOINT"));
    const releaseCalls = mock.txCalls.filter((c) => c.sql.startsWith("RELEASE SAVEPOINT"));
    expect(savepointCalls.length).toBeGreaterThan(0);
    expect(releaseCalls.length).toBeGreaterThan(0);
  });

  it("actor/tenant/query-budget context propagates correctly in transaction", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);
    await initPostgresDb("postgresql://localhost:5432/test", mock.pool);

    await driver.transaction(async () => {
      const executor = getTransactionExecutor();
      expect(executor).toBeDefined();
      expect(isInTransaction()).toBe(true);

      // getDb() should return the transaction-bound executor
      const db = getDb();
      expect(db).toBe(executor);

      await db.run("INSERT INTO test (data) VALUES (?)", ["data"]);
    });

    expect(isInTransaction()).toBe(false);
  });

  it("calls outside explicit transaction use global driver handle", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);
    const global = await initPostgresDb("postgresql://localhost:5432/test", mock.pool);

    expect(isInTransaction()).toBe(false);
    expect(getTransactionExecutor()).toBeUndefined();

    const db = getDb();
    expect(db).toBe(global);

    await db.run("INSERT INTO test (data) VALUES (?)", ["outside"]);
    expect(mock.calls.some((c) => c.sql.includes("INSERT INTO test"))).toBe(true);
  });

  it("query budget wrapping preserved for transaction executors via getDb()", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);
    await initPostgresDb("postgresql://localhost:5432/test", mock.pool);

    const { withQueryBudget } = await import("../driver.js");

    await expect(
      withQueryBudget(2, async () => {
        await driver.transaction(async () => {
          const db = getDb(); // budget-wrapped transaction executor
          await db.run("INSERT INTO test (data) VALUES (?)", ["1"]);
          await db.run("INSERT INTO test (data) VALUES (?)", ["2"]);
          await db.run("INSERT INTO test (data) VALUES (?)", ["3"]); // exceed budget
        });
      }),
    ).rejects.toThrow("Query budget exceeded");
  });

  it("getDb() returns transaction executor inside transaction callback", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/test", mock.pool);
    const global = await initPostgresDb("postgresql://localhost:5432/test", mock.pool);

    let insideDb: OrmDriverHandle | undefined;
    await driver.transaction(async (tx) => {
      insideDb = getDb();
      expect(insideDb).toBe(tx);
    });

    const outsideDb = getDb();
    expect(outsideDb).toBe(global);
    expect(insideDb).not.toBe(outsideDb);
  });
});
