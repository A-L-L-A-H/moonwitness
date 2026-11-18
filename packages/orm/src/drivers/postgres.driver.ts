import type { ResultSet } from "@libsql/client";
import type { OrmDriverHandle } from "../driver.js";
import type { LibSqlExecutor } from "./sqlite.driver.js";
import { splitSqlStatements } from "./d1.driver.js";

export interface PgQueryResultLike {
  rows: Record<string, unknown>[];
  rowCount: number | null;
  fields?: Array<{ name: string }>;
}

export interface PgClientLike {
  query(sql: string, params?: unknown[]): Promise<PgQueryResultLike>;
  release(): void;
}

export interface PoolLike {
  query(sql: string, params?: unknown[]): Promise<PgQueryResultLike>;
  connect(): Promise<PgClientLike>;
  end(): Promise<void>;
}

type PgQueryable = Pick<PoolLike, "query">;

const INTEGER_RESULT_KEYS = new Set([
  "count",
  "total",
  "c",
  "id",
  "user_id",
  "actor_user_id",
  "version",
  "entity_version",
  "revoked",
  "active",
  "first_party",
  "enabled",
  "ok",
  "status_code",
  "latency_ms",
  "sort_order",
  "dismissed",
  "sources",
  "notes",
  "duration_ms",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
]);

/** Returns true when a database connection string targets PostgreSQL. */
export function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

function isIdentChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}

/**
 * Single-pass SQL lexer rewriting `?` placeholders to `$1..$n`, standalone
 * `rowid` tokens to PostgreSQL `ctid`, and optionally unquoting simple
 * double-quoted identifiers inside `CREATE TABLE` DDL while preserving strings
 * and comments verbatim.
 */
function rewriteSqlTokens(sql: string, unquoteCreateColumns: boolean): string {
  let out = "";
  let paramIndex = 0;
  let inSingle = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i]!;
    const next = sql[i + 1];

    if (inLineComment) {
      out += ch;
      if (ch === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      out += ch;
      if (ch === "*" && next === "/") {
        out += "/";
        i += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (inSingle) {
      out += ch;
      if (ch === "'" && next === "'") {
        out += next;
        i += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }

    if (ch === "-" && next === "-") {
      out += "--";
      i += 1;
      inLineComment = true;
      continue;
    }

    if (ch === "/" && next === "*") {
      out += "/*";
      i += 1;
      inBlockComment = true;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      out += ch;
      continue;
    }

    if (ch === '"') {
      let end = i + 1;
      let inner = "";
      while (end < sql.length) {
        const cur = sql[end]!;
        if (cur === '"' && sql[end + 1] === '"') {
          inner += '""';
          end += 2;
        } else if (cur === '"') {
          break;
        } else {
          inner += cur;
          end += 1;
        }
      }
      if (end < sql.length && unquoteCreateColumns && /^[A-Za-z_][A-Za-z0-9_]*$/.test(inner)) {
        out += inner;
      } else if (end < sql.length) {
        out += `"${inner}"`;
      } else {
        out += sql.slice(i);
        break;
      }
      i = end;
      continue;
    }

    if (ch === "?") {
      paramIndex += 1;
      out += `$${paramIndex}`;
      continue;
    }

    if (
      (ch === "r" || ch === "R") &&
      sql.slice(i, i + 5).toLowerCase() === "rowid" &&
      !isIdentChar(sql[i - 1]) &&
      sql[i - 1] !== "." &&
      !isIdentChar(sql[i + 5])
    ) {
      out += "ctid";
      i += 4;
      continue;
    }

    out += ch;
  }

  return out;
}

/**
 * Translate MoonWitness SQLite/libSQL queries and DDL into PostgreSQL-compatible SQL.
 */
export function translateSqlForPostgres(sql: string): {
  sql: string;
  isInsertWithoutReturning: boolean;
} {
  const tableInfoMatch = sql.match(
    /^\s*PRAGMA\s+table_info\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;?\s*$/i,
  );
  if (tableInfoMatch) {
    const tableName = tableInfoMatch[1]!.toLowerCase();
    return {
      sql: `SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${tableName}'`,
      isInsertWithoutReturning: false,
    };
  }

  const indexListMatch = sql.match(
    /^\s*PRAGMA\s+index_list\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*;?\s*$/i,
  );
  if (indexListMatch) {
    const tableName = indexListMatch[1]!.toLowerCase();
    return {
      sql: `SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = '${tableName}'`,
      isInsertWithoutReturning: false,
    };
  }

  if (/^\s*PRAGMA\s+integrity_check\b/i.test(sql)) {
    return {
      sql: "SELECT 'ok' AS integrity_check",
      isInsertWithoutReturning: false,
    };
  }

  if (/^\s*PRAGMA\s+foreign_key_check\b/i.test(sql)) {
    return {
      sql: "SELECT 1 AS fk_violation WHERE 1 = 0",
      isInsertWithoutReturning: false,
    };
  }

  if (/^\s*PRAGMA\b/i.test(sql)) {
    return {
      sql: "SELECT 1 AS ok",
      isInsertWithoutReturning: false,
    };
  }

  let transformed = sql
    .replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, "SERIAL PRIMARY KEY")
    .replace(
      /\bDEFAULT\s*\(\s*datetime\(\s*'now'\s*\)\s*\)/gi,
      "DEFAULT (CURRENT_TIMESTAMP::text)",
    );

  const isCreateTable = /^\s*CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TABLE\b/i.test(transformed);
  transformed = rewriteSqlTokens(transformed, isCreateTable);

  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(transformed)) {
    const hasSemicolon = /;\s*$/.test(transformed);
    const body = transformed
      .replace(/^(\s*)INSERT\s+OR\s+IGNORE\s+INTO\b/i, "$1INSERT INTO")
      .replace(/;\s*$/, "");
    transformed = /\bON\s+CONFLICT\b/i.test(body)
      ? `${body}${hasSemicolon ? ";" : ""}`
      : `${body} ON CONFLICT DO NOTHING${hasSemicolon ? ";" : ""}`;
  }

  const trimmedNoSemi = transformed.replace(/;\s*$/, "");
  const isSingleInsert =
    /^\s*INSERT\s+INTO\b/i.test(trimmedNoSemi) && !/\bRETURNING\b/i.test(trimmedNoSemi);

  return {
    sql: transformed,
    isInsertWithoutReturning: isSingleInsert,
  };
}

function normalizePgParams(params: unknown[]): unknown[] {
  return params.map((value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "bigint") {
      return Number.isSafeInteger(Number(value)) ? Number(value) : String(value);
    }
    return value;
  });
}

function normalizePgRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const isIntKey =
      INTEGER_RESULT_KEYS.has(key) ||
      /(_count|_id|_sec|_ms|_bytes|_port|^min_|^max_|^total_)$/i.test(key);
    if (isIntKey && typeof value === "string" && /^-?\d+$/.test(value)) {
      const parsed = Number(value);
      normalized[key] = Number.isSafeInteger(parsed) ? parsed : value;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function extractLastInsertRowid(rows: Record<string, unknown>[]): bigint | undefined {
  const idVal = rows[0]?.id;
  if (typeof idVal === "number" && Number.isInteger(idVal)) {
    return BigInt(idVal);
  }
  if (typeof idVal === "bigint") {
    return idVal;
  }
  if (typeof idVal === "string" && /^\d+$/.test(idVal)) {
    return BigInt(idVal);
  }
  return undefined;
}

async function runWithQueryable(
  queryable: PgQueryable,
  sql: string,
  params: unknown[] = [],
): Promise<ResultSet> {
  const translated = translateSqlForPostgres(sql);
  const execSql = translated.isInsertWithoutReturning
    ? `${translated.sql.replace(/;\s*$/, "")} RETURNING *`
    : translated.sql;

  const res = await queryable.query(execSql, normalizePgParams(params));
  const rowsAffected = res.rowCount ?? 0;
  const lastInsertRowid = extractLastInsertRowid(res.rows);

  return {
    columns: res.fields?.map((field) => field.name) ?? [],
    columnTypes: [],
    rows: [],
    rowsAffected,
    lastInsertRowid,
    toJSON: () => ({
      rowsAffected,
      lastInsertRowid: lastInsertRowid !== undefined ? Number(lastInsertRowid) : null,
    }),
  };
}

async function allWithQueryable<T = Record<string, unknown>>(
  queryable: PgQueryable,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { sql: translatedSql } = translateSqlForPostgres(sql);
  const res = await queryable.query(translatedSql, normalizePgParams(params));
  return res.rows.map(normalizePgRow) as T[];
}

async function getWithQueryable<T = Record<string, unknown>>(
  queryable: PgQueryable,
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await allWithQueryable<T>(queryable, sql, params);
  return rows[0];
}

async function execWithQueryable(queryable: PgQueryable, sql: string): Promise<void> {
  const statements = splitSqlStatements(sql);
  for (const statement of statements) {
    const { sql: translatedSql } = translateSqlForPostgres(statement);
    if (translatedSql.trim().length > 0) {
      await queryable.query(translatedSql);
    }
  }
}

/**
 * Async PostgreSQL driver implementing `OrmDriverHandle`.
 */
export class PostgresDriver implements OrmDriverHandle {
  private pool: PoolLike | null = null;

  async init(connectionString: string, poolOverride?: PoolLike): Promise<void> {
    if (this.pool) {
      throw new Error("Database already initialized. Close it before re-initializing.");
    }
    if (poolOverride) {
      this.pool = poolOverride;
      return;
    }
    const pgMod = await import("pg");
    const PoolCtor = pgMod.Pool ?? pgMod.default?.Pool;
    if (!PoolCtor) {
      throw new Error("PostgreSQL Pool constructor is unavailable in 'pg' module.");
    }
    this.pool = new PoolCtor({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    }) as PoolLike;
  }

  close(): void {
    const current = this.pool;
    this.pool = null;
    if (current) {
      void current.end().catch(() => {});
    }
  }

  private requirePool(): PoolLike {
    if (!this.pool) {
      throw new Error("Database not initialized. Call initDb() first.");
    }
    return this.pool;
  }

  async run(sql: string, params: unknown[] = []): Promise<ResultSet> {
    return runWithQueryable(this.requirePool(), sql, params);
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return allWithQueryable<T>(this.requirePool(), sql, params);
  }

  async get<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | undefined> {
    return getWithQueryable<T>(this.requirePool(), sql, params);
  }

  async exec(sql: string): Promise<void> {
    return execWithQueryable(this.requirePool(), sql);
  }

  async transaction<T>(fn: (tx: LibSqlExecutor) => Promise<T>): Promise<T> {
    const client = await this.requirePool().connect();
    const executor: LibSqlExecutor = {
      run: (sql, params = []) => runWithQueryable(client, sql, params),
      all: <R = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
        allWithQueryable<R>(client, sql, params),
      get: <R = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
        getWithQueryable<R>(client, sql, params),
      exec: (sql) => execWithQueryable(client, sql),
    };

    try {
      await client.query("BEGIN");
      const result = await fn(executor);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
}
