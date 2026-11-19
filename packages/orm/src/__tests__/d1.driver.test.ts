import { describe, expect, it } from "vitest";
import { unwrapDriverHandle } from "../driver.js";
import {
  closeDb,
  D1Driver,
  getDb,
  initD1Db,
  splitSqlStatements,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
} from "../index.js";

function createFakeD1() {
  const preparedCalls: Array<{ query: string; bound: unknown[] }> = [];
  const batchCalls: Array<Array<{ query: string; bound: unknown[] }>> = [];
  let nextAllResults: Array<Record<string, unknown>> = [];
  let nextRunMeta: { last_row_id?: number; changes?: number } = { last_row_id: 7, changes: 1 };

  const makeStmt = (query: string, bound: unknown[] = []): D1PreparedStatementLike => ({
    bind(...values: unknown[]) {
      return makeStmt(query, values);
    },
    async all<T = Record<string, unknown>>() {
      preparedCalls.push({ query, bound });
      return { results: nextAllResults as T[] };
    },
    async run() {
      preparedCalls.push({ query, bound });
      return { meta: nextRunMeta };
    },
  });

  const client: D1DatabaseLike = {
    prepare(query: string) {
      return makeStmt(query);
    },
    async batch(statements) {
      const items: Array<{ query: string; bound: unknown[] }> = [];
      for (const stmt of statements) {
        const res = await stmt.run();
        void res;
        items.push(preparedCalls[preparedCalls.length - 1]!);
      }
      batchCalls.push(items);
      return [];
    },
  };

  return {
    client,
    preparedCalls,
    batchCalls,
    setNextAllResults(rows: Array<Record<string, unknown>>) {
      nextAllResults = rows;
    },
    setNextRunMeta(meta: { last_row_id?: number; changes?: number }) {
      nextRunMeta = meta;
    },
  };
}

describe("splitSqlStatements", () => {
  it("splits multi-statement DDL cleanly while preserving string literals and stripping comments", () => {
    const sql = `
      -- Leading SQL comment; ignored semicolon
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        note TEXT DEFAULT 'keep;inside;string'
      );
      /* Block comment with ; semicolon */
      CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
    `;
    expect(splitSqlStatements(sql)).toEqual([
      "CREATE TABLE IF NOT EXISTS users (\n        id INTEGER PRIMARY KEY,\n        note TEXT DEFAULT 'keep;inside;string'\n      )",
      "CREATE INDEX IF NOT EXISTS idx_users_id ON users(id)",
    ]);
  });
});

describe("D1Driver & initD1Db", () => {
  it("executes run, get, all, batch exec, and rebind cleanly", async () => {
    const first = createFakeD1();
    const driver = initD1Db(first.client);
    expect(unwrapDriverHandle(getDb())).toBe(driver);

    first.setNextRunMeta({ last_row_id: 42, changes: 1 });
    const runRes = await driver.run("INSERT INTO users (id) VALUES (?)", [BigInt(42)]);
    expect(runRes.rowsAffected).toBe(1);
    expect(runRes.lastInsertRowid).toBe(42n);
    expect(first.preparedCalls.at(-1)?.bound).toEqual([42]);

    first.setNextAllResults([{ id: 42, username: "admin" }]);
    const row = await driver.get<{ id: number; username: string }>(
      "SELECT * FROM users WHERE id = ?",
      [42],
    );
    expect(row).toEqual({ id: 42, username: "admin" });

    await driver.exec("CREATE TABLE a (id INT); CREATE TABLE b (id INT);");
    expect(first.batchCalls.at(-1)?.map((c) => c.query)).toEqual([
      "CREATE TABLE a (id INT)",
      "CREATE TABLE b (id INT)",
    ]);

    const second = createFakeD1();
    const rebound = initD1Db(second.client);
    expect(rebound).toBe(driver);
    second.setNextAllResults([{ ok: 1 }]);
    expect(await getDb().get("SELECT 1 AS ok")).toEqual({ ok: 1 });

    closeDb();
    expect(() => getDb()).toThrow("Database not initialized");
  });

  it("supports sequential transaction callback on D1", async () => {
    const fake = createFakeD1();
    const driver = new D1Driver(fake.client);
    const value = await driver.transaction(async (tx) => {
      await tx.run("UPDATE users SET username = ? WHERE id = ?", ["next", 1]);
      return "done";
    });
    expect(value).toBe("done");
    expect(fake.preparedCalls).toHaveLength(1);
  });
});
