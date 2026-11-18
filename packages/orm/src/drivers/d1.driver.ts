import type { ResultSet } from "@libsql/client";
import type { LibSqlExecutor } from "./sqlite.driver.js";

/** Structural subset of Cloudflare Workers `D1PreparedStatement`. */
export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }>;
  first?<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
}

/** Structural subset of Cloudflare Workers `D1Database`. */
export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

/** Normalize ORM parameters to D1-supported scalar bindings. */
function normalizeD1Params(params: unknown[]): unknown[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === "bigint") {
      return Number.isSafeInteger(Number(value)) ? Number(value) : String(value);
    }
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

/** Split multi-statement DDL/SQL strings cleanly without invoking D1 `exec()`. */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i]!;
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        current += "\n";
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingle) {
      current += ch;
      if (ch === "'" && next === "'") {
        current += next;
        i += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      current += ch;
      if (ch === '"' && next === '"') {
        current += next;
        i += 1;
      } else if (ch === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inBacktick) {
      current += ch;
      if (ch === "`") {
        inBacktick = false;
      }
      continue;
    }

    if (ch === "-" && next === "-") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      current += ch;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      current += ch;
      continue;
    }

    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

/**
 * Cloudflare D1 implementation of `@moonwitness/orm`'s `LibSqlExecutor` contract.
 * Keeps existing repository, migration, and audit-model code portable onto Workers.
 */
export class D1Driver implements LibSqlExecutor {
  readonly dialect = "d1" as const;
  private client: D1DatabaseLike | null;

  constructor(d1: D1DatabaseLike) {
    this.client = d1;
  }

  /** Rebind the active isolate's per-request Cloudflare D1 handle. */
  rebind(d1: D1DatabaseLike): void {
    this.client = d1;
  }

  close(): void {
    this.client = null;
  }

  private requireClient(): D1DatabaseLike {
    if (!this.client) {
      throw new Error("Database not initialized. Call initD1Db() first.");
    }
    return this.client;
  }

  private bindStatement(sql: string, params: unknown[]): D1PreparedStatementLike {
    const stmt = this.requireClient().prepare(sql);
    return params.length > 0 ? stmt.bind(...normalizeD1Params(params)) : stmt;
  }

  async run(sql: string, params: unknown[] = []): Promise<ResultSet> {
    const result = await this.bindStatement(sql, params).run();
    const lastInsert = result.meta?.last_row_id;
    const rowsAffected = result.meta?.changes ?? 0;
    const rowIdBigInt =
      lastInsert !== undefined && Number.isFinite(lastInsert) ? BigInt(lastInsert) : undefined;
    return {
      columns: [],
      columnTypes: [],
      rows: [],
      rowsAffected,
      lastInsertRowid: rowIdBigInt,
      toJSON: () => ({
        rowsAffected,
        lastInsertRowid: rowIdBigInt !== undefined ? Number(rowIdBigInt) : null,
      }),
    };
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.bindStatement(sql, params).all<Record<string, unknown>>();
    return (result.results ?? []) as T[];
  }

  async get<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | undefined> {
    const rows = await this.all<T>(sql, params);
    return rows[0];
  }

  async exec(sql: string): Promise<void> {
    const client = this.requireClient();
    const statements = splitSqlStatements(sql);
    if (statements.length === 0) return;
    await client.batch(statements.map((stmt) => client.prepare(stmt)));
  }

  async transaction<T>(fn: (tx: LibSqlExecutor) => Promise<T>): Promise<T> {
    // D1 auto-commits per prepared statement/batch; ORM models already guard updates with `WHERE id = ? AND version = ?`.
    return fn(this);
  }
}

/** Adapt an ORM `LibSqlExecutor` (e.g. local SQLite/libSQL driver) to structural `D1DatabaseLike`. */
export function createD1DatabaseFromOrm(executor: LibSqlExecutor): D1DatabaseLike {
  class PreparedStatement implements D1PreparedStatementLike {
    private params: unknown[] = [];
    constructor(private readonly query: string) {}

    bind(...values: unknown[]): D1PreparedStatementLike {
      this.params = values;
      return this;
    }

    async all<T = Record<string, unknown>>(): Promise<{ results?: T[] }> {
      const results = await executor.all<T>(this.query, this.params);
      return { results };
    }

    async run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }> {
      const res = await executor.run(this.query, this.params);
      return {
        meta: {
          last_row_id: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
          changes: res.rowsAffected,
        },
      };
    }

    async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
      const res = await executor.all<Record<string, unknown>>(this.query, this.params);
      const row = res[0];
      if (!row) return null;
      if (colName) {
        return (row[colName] as T) ?? null;
      }
      return row as T;
    }
  }

  return {
    prepare(query: string): D1PreparedStatementLike {
      return new PreparedStatement(query);
    },
    async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
      const results: unknown[] = [];
      for (const statement of statements) {
        results.push(await statement.run());
      }
      return results;
    },
  };
}
