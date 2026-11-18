import { describe, expect, it, vi } from "vitest";
import {
  PostgresDriver,
  isPostgresUrl,
  translateSqlForPostgres,
  type PgClientLike,
  type PoolLike,
} from "../drivers/postgres.driver.js";

describe("isPostgresUrl", () => {
  it("recognizes postgres:// and postgresql:// connection strings", () => {
    expect(isPostgresUrl("postgres://user:pass@localhost:5432/db")).toBe(true);
    expect(isPostgresUrl("  POSTGRESQL://moonwitness:secret@postgres:5432/moonwitness")).toBe(true);
    expect(isPostgresUrl("file:/data/moonwitness.db")).toBe(false);
    expect(isPostgresUrl(":memory:")).toBe(false);
  });
});

describe("translateSqlForPostgres", () => {
  it("translates SQLite AUTOINCREMENT, datetime('now'), INSERT OR IGNORE, PRAGMA, rowid, and positional placeholders", () => {
    const ddl = translateSqlForPostgres(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "imagePosition" TEXT,
        note TEXT DEFAULT 'keep ? inside string',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    expect(ddl.sql).toContain("SERIAL PRIMARY KEY");
    expect(ddl.sql).toContain("imagePosition TEXT");
    expect(ddl.sql).toContain("DEFAULT 'keep ? inside string'");
    expect(ddl.sql).toContain("DEFAULT (CURRENT_TIMESTAMP::text)");
    expect(ddl.isInsertWithoutReturning).toBe(false);

    const ignoreInsert = translateSqlForPostgres(
      "INSERT OR IGNORE INTO mid_clients (client_id, name) VALUES (?, ?)",
    );
    expect(ignoreInsert.sql).toBe(
      "INSERT INTO mid_clients (client_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    );
    expect(ignoreInsert.isInsertWithoutReturning).toBe(true);

    const pragmaInfo = translateSqlForPostgres("PRAGMA table_info(mid_auth_codes)");
    expect(pragmaInfo.sql).toBe(
      "SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mid_auth_codes'",
    );
    expect(pragmaInfo.isInsertWithoutReturning).toBe(false);

    const pragmaOther = translateSqlForPostgres("PRAGMA journal_mode = WAL");
    expect(pragmaOther.sql).toBe("SELECT 1 AS ok");

    expect(translateSqlForPostgres("PRAGMA integrity_check").sql).toBe(
      "SELECT 'ok' AS integrity_check",
    );
    expect(translateSqlForPostgres("PRAGMA foreign_key_check").sql).toBe(
      "SELECT 1 AS fk_violation WHERE 1 = 0",
    );

    const commentAndRowid = translateSqlForPostgres(
      "-- ? keep comment untouched\n/* ? also comment */\nSELECT * FROM logs WHERE note != '?literal' AND flag = ? ORDER BY rowid ASC",
    );
    expect(commentAndRowid.sql).toContain("-- ? keep comment untouched");
    expect(commentAndRowid.sql).toContain("/* ? also comment */");
    expect(commentAndRowid.sql).toContain("note != '?literal'");
    expect(commentAndRowid.sql).toContain("flag = $1");
    expect(commentAndRowid.sql).toContain("ORDER BY ctid ASC");
  });
});

describe("PostgresDriver", () => {
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

  it("handles run() RETURNING *, all(), get() integer coercion, and exec() statement splitting", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgres://user:pass@localhost:5432/moonwitness", mock.pool);

    const inserted = await driver.run("INSERT INTO users (username) VALUES (?)", ["rezza"]);
    expect(mock.calls[0]!.sql).toBe("INSERT INTO users (username) VALUES ($1) RETURNING *");
    expect(mock.calls[0]!.params).toEqual(["rezza"]);
    expect(inserted.rowsAffected).toBe(1);
    expect(inserted.lastInsertRowid).toBe(42n);

    const row = await driver.get<{ count: number; name: string }>(
      "SELECT COUNT(*) AS count, name FROM users WHERE id = ?",
      [42n],
    );
    expect(mock.calls[1]!.params).toEqual([42]);
    expect(row).toEqual({ count: 3, name: "alpha" });

    const list = await driver.all<{ id: number; username: string }>(
      "SELECT id, username FROM users",
    );
    expect(list).toEqual([{ id: 1, username: "rezza" }]);

    await driver.exec(
      "CREATE TABLE a (id INTEGER PRIMARY KEY AUTOINCREMENT); CREATE TABLE b (v TEXT);",
    );
    expect(mock.calls[3]!.sql).toContain("SERIAL PRIMARY KEY");
    expect(mock.calls[4]!.sql).toBe("CREATE TABLE b (v TEXT)");

    driver.close();
    expect(mock.pool.end).toHaveBeenCalledTimes(1);
  });

  it("manages BEGIN/COMMIT and ROLLBACK on transaction errors", async () => {
    const mock = createMockPool();
    const driver = new PostgresDriver();
    await driver.init("postgresql://localhost:5432/moonwitness", mock.pool);

    const result = await driver.transaction(async (tx) => {
      await tx.run("INSERT INTO items (name) VALUES (?)", ["ok"]);
      return "done";
    });
    expect(result).toBe("done");
    expect(mock.txCalls.map((c) => c.sql)).toEqual([
      "BEGIN",
      "INSERT INTO items (name) VALUES ($1) RETURNING *",
      "COMMIT",
    ]);
    expect(mock.client.release).toHaveBeenCalledTimes(1);

    mock.txCalls.length = 0;
    mock.setFailOnInsert(true);
    await expect(
      driver.transaction(async (tx) => {
        await tx.run("INSERT INTO tx_fail (name) VALUES (?)", ["bad"]);
      }),
    ).rejects.toThrow("boom");
    expect(mock.txCalls.map((c) => c.sql)).toEqual([
      "BEGIN",
      "INSERT INTO tx_fail (name) VALUES ($1) RETURNING *",
      "ROLLBACK",
    ]);
    expect(mock.client.release).toHaveBeenCalledTimes(2);
  });
});
