import type { z } from "zod";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { ConflictError, PolicyError } from "./errors.js";
import type { BaseMetadata, RecordStatus } from "./base-metadata.js";
import type { ActorContext } from "./actor-context.js";
import {
  DEFAULT_TENANT_ID,
  isSystemActor,
  normalizeTenantId,
  requireActorTenantId,
  SYSTEM_ACTOR,
} from "./actor-context.js";
import {
  assertIdentifier,
  fieldSpec,
  METADATA_NAMES,
  validateAttrsPayload,
  type Codec,
  type FieldSpec,
  type ModelIndex,
  type ZodObjectLike,
} from "./schema-utils.js";
import { modelRegistry, type RegisteredModelDescriptor } from "./registry.js";
import type { ModelFeatureOptions, ModelWriteAction } from "./model-meta.js";

export type { ZodObjectLike, Codec, FieldSpec, ModelIndex };

/** A persisted row: business fields plus framework metadata columns. */
export type ModelRecord<TBusiness extends ZodObjectLike> = z.infer<TBusiness> & BaseMetadata;

export interface QueryFilterOperators {
  $ne?: unknown;
  $gt?: unknown;
  $gte?: unknown;
  $lt?: unknown;
  $lte?: unknown;
  $in?: unknown[];
  $like?: string;
  $ilike?: string;
  $not?: unknown;
}

export interface WriteGuardOptions {
  ruleDomain?: Record<string, unknown> | null;
  createRuleDomain?: Record<string, unknown> | null;
}

export interface FindOptions {
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string | Array<{ field: string; direction?: "ASC" | "DESC" }>;
  tenantId?: string;
  /** Declarative full-text needle matched in SQL across the model's `searchFields`. */
  q?: string;
  /** Optional allowlist of columns eligible for `q` search (e.g. readable fields). */
  allowedSearchFields?: string[];
  /** Batch-hydrate `relations` without N+1 queries (attaches `$<relation>` onto each record). */
  with?: string[];
}

export interface DefineModelOptions<
  TBusiness extends ZodObjectLike = ZodObjectLike,
> extends ModelFeatureOptions {
  name: string;
  table: string;
  schema: TBusiness;
  softDelete?: boolean;
  extensible?: boolean;
  restEnabled?: boolean;
  publicFields?: string[];
  indexes?: ModelIndex[];
}

export type AuditAction = "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE";

export interface AuditEntry {
  id: string;
  model: string;
  entity_id: string;
  action: AuditAction;
  changed_by: string | null;
  changed_at: string;
  diff: string;
  entity_version: number;
  source: BaseMetadata["source"];
  request_id: string | null;
}

export interface DefineModelReturn<TBusiness extends ZodObjectLike = ZodObjectLike> {
  name: string;
  table: string;
  schema: TBusiness;
  readonly fullSchema: ZodObjectLike;
  type: z.infer<TBusiness>;
  repository: BaseRepository<TBusiness>;
  readonly ddl: string;
  readonly extensible: boolean;
  readonly restEnabled: boolean;
  readonly publicFields?: string[];
  auditHook: (
    record: Record<string, unknown>,
    action: AuditAction,
    before: Record<string, unknown> | null,
  ) => AuditEntry;
}

export const AUDIT_DDL = `
CREATE TABLE IF NOT EXISTS _orm_audit_log (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT,
  changed_at TEXT NOT NULL,
  diff TEXT NOT NULL,
  entity_version INTEGER NOT NULL,
  source TEXT NOT NULL,
  request_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_model_entity ON _orm_audit_log (model, entity_id, changed_at);
`.trim();

export const ormAuditMigrations = [
  {
    id: "orm_001_create_audit_log",
    owner: "__base",
    up: AUDIT_DDL,
  },
];

const auditedDrivers = new WeakSet<LibSqlExecutor>();

export async function ensureAuditTable(): Promise<void> {
  const db = getDb();
  if (auditedDrivers.has(db)) return;
  await db.exec(AUDIT_DDL);
  auditedDrivers.add(db);
}

/** UUID v7 (time-sortable) generated from crypto primitives. */
export function uuidv7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const ts = Date.now();
  bytes[0] = (ts / 2 ** 40) & 0xff;
  bytes[1] = (ts / 2 ** 32) & 0xff;
  bytes[2] = (ts / 2 ** 24) & 0xff;
  bytes[3] = (ts / 2 ** 16) & 0xff;
  bytes[4] = (ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b!.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function encodeValue(value: unknown, codec: Codec): unknown {
  if (value === undefined || value === null) return null;
  switch (codec) {
    case "date":
      return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
    case "boolean":
      return value ? 1 : 0;
    case "json":
      return JSON.stringify(value);
    case "integer":
    case "real":
      return Number(value);
    case "text":
    default:
      return String(value);
  }
}

function encodeFilterValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  return value;
}

function decodeValue(value: unknown, codec: Codec): unknown {
  if (value === undefined || value === null) return null;
  switch (codec) {
    case "date":
      return value instanceof Date ? value : new Date(String(value));
    case "boolean":
      return typeof value === "boolean" ? value : Boolean(Number(value));
    case "json":
      return typeof value === "string" ? JSON.parse(value) : value;
    case "integer":
    case "real":
      return Number(value);
    case "text":
    default:
      return String(value);
  }
}

const FILTER_OPERATOR_KEYS = new Set([
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$like",
  "$ilike",
  "$not",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)
  );
}

function isOperatorFilterObject(value: unknown): value is QueryFilterOperators {
  if (!isPlainObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => FILTER_OPERATOR_KEYS.has(key));
}

function likeToRegExp(pattern: string, caseInsensitive: boolean): RegExp {
  let regex = "^";
  for (const ch of pattern) {
    if (ch === "%") {
      regex += ".*";
    } else if (ch === "_") {
      regex += ".";
    } else {
      regex += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  regex += "$";
  return new RegExp(regex, caseInsensitive ? "is" : "s");
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return true;
  }
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  if (a instanceof Date || b instanceof Date) {
    const timeA = a instanceof Date ? a.getTime() : new Date(String(a)).getTime();
    const timeB = b instanceof Date ? b.getTime() : new Date(String(b)).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) return false;
    return timeA === timeB;
  }
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

function compareOrdered(actual: unknown, expected: unknown): number | null {
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return null;
  }
  if (actual instanceof Date || expected instanceof Date) {
    const timeA = actual instanceof Date ? actual.getTime() : new Date(String(actual)).getTime();
    const timeB =
      expected instanceof Date ? expected.getTime() : new Date(String(expected)).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) return null;
    return timeA - timeB;
  }
  if (typeof actual === "number" && typeof expected === "number") {
    return actual - expected;
  }
  const strA = String(actual);
  const strB = String(expected);
  return strA < strB ? -1 : strA > strB ? 1 : 0;
}

function matchesFieldCondition(actual: unknown, condition: unknown): boolean {
  if (isOperatorFilterObject(condition)) {
    for (const [op, opVal] of Object.entries(condition) as Array<
      [keyof QueryFilterOperators, unknown]
    >) {
      if (opVal === undefined) continue;
      if (op === "$ne") {
        if (opVal === null) {
          if (actual === null || actual === undefined) return false;
        } else if (valuesEqual(actual, opVal)) {
          return false;
        }
      } else if (op === "$gt") {
        const cmp = compareOrdered(actual, opVal);
        if (cmp === null || cmp <= 0) return false;
      } else if (op === "$gte") {
        const cmp = compareOrdered(actual, opVal);
        if (cmp === null || cmp < 0) return false;
      } else if (op === "$lt") {
        const cmp = compareOrdered(actual, opVal);
        if (cmp === null || cmp >= 0) return false;
      } else if (op === "$lte") {
        const cmp = compareOrdered(actual, opVal);
        if (cmp === null || cmp > 0) return false;
      } else if (op === "$in") {
        if (!Array.isArray(opVal) || !opVal.some((entry) => valuesEqual(actual, entry))) {
          return false;
        }
      } else if (op === "$like") {
        if (
          actual === null ||
          actual === undefined ||
          !likeToRegExp(String(opVal), false).test(String(actual))
        ) {
          return false;
        }
      } else if (op === "$ilike") {
        if (
          actual === null ||
          actual === undefined ||
          !likeToRegExp(String(opVal), true).test(String(actual))
        ) {
          return false;
        }
      } else if (op === "$not") {
        if (matchesFieldCondition(actual, opVal)) return false;
      }
    }
    return true;
  }
  if (condition === null) {
    return actual === null || actual === undefined;
  }
  return valuesEqual(actual, condition);
}

/** Evaluates an ORM filter AST in memory against a decoded record. */
export function matchesFilter(
  record: Record<string, unknown>,
  filter: Record<string, unknown> | null | undefined,
): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) continue;
    if (key === "$and") {
      if (!Array.isArray(value)) return false;
      if (!value.every((sub) => isPlainObject(sub) && matchesFilter(record, sub))) {
        return false;
      }
      continue;
    }
    if (key === "$or") {
      if (!Array.isArray(value) || value.length === 0) return false;
      if (!value.some((sub) => isPlainObject(sub) && matchesFilter(record, sub))) {
        return false;
      }
      continue;
    }
    if (key === "$not") {
      if (!isPlainObject(value)) return false;
      if (matchesFilter(record, value)) return false;
      continue;
    }
    if (!matchesFieldCondition(record[key], value)) {
      return false;
    }
  }
  return true;
}

export class BaseRepository<TBusiness extends ZodObjectLike = ZodObjectLike> {
  private readonly fallbackFields: Map<string, FieldSpec>;
  private readonly fallbackFullSchema: ZodObjectLike;

  constructor(
    public readonly name: string,
    public readonly table: string,
    fullSchema: ZodObjectLike,
    public readonly softDelete: boolean,
    businessFields: Map<string, FieldSpec> = new Map(),
  ) {
    assertIdentifier(table, "table");
    this.fallbackFullSchema = fullSchema;
    this.fallbackFields = businessFields;
  }

  private descriptor(): Pick<
    RegisteredModelDescriptor,
    "fields" | "fullSchema" | "extensible" | "customFields"
  > {
    const reg = modelRegistry.get(this.name);
    if (reg) return reg;
    return {
      fields: this.fallbackFields,
      fullSchema: this.fallbackFullSchema,
      extensible: false,
      customFields: [],
    };
  }

  get fullSchema(): ZodObjectLike {
    return this.descriptor().fullSchema;
  }

  private validateColumn(column: string): void {
    assertIdentifier(column, "column");
    const { fields } = this.descriptor();
    if (!METADATA_NAMES.has(column) && !fields.has(column)) {
      throw new Error(`Unknown column '${column}' on model '${this.name}'.`);
    }
  }

  private decodeRow<T>(row: Record<string, unknown>): T {
    const { fields } = this.descriptor();
    const record: Record<string, unknown> = { ...row };
    for (const key of ["create_date", "write_date", "deleted_date"]) {
      if (typeof record[key] === "string") record[key] = new Date(record[key] as string);
    }
    for (const [key, spec] of fields) {
      const lowerKey = key.toLowerCase();
      const rawKey = key in record ? key : lowerKey in record ? lowerKey : null;
      if (rawKey === null) continue;
      const decoded = decodeValue(record[rawKey], spec.codec);
      record[key] = decoded === null && spec.optional && !spec.nullable ? undefined : decoded;
      if (rawKey !== key) {
        delete record[rawKey];
      }
    }
    return record as T;
  }

  private encodeRow(record: Record<string, unknown>): unknown[] {
    const { fields } = this.descriptor();
    return Object.entries(record).map(([key, value]) => {
      const spec = fields.get(key);
      if (spec) return encodeValue(value, spec.codec);
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "boolean") return value ? 1 : 0;
      if (Array.isArray(value) || (value !== null && typeof value === "object")) {
        return JSON.stringify(value);
      }
      return value ?? null;
    });
  }

  private buildOrderBy(orderBy?: FindOptions["orderBy"]): string {
    if (!orderBy) return " ORDER BY id";
    const specs: Array<{ field: string; direction: "ASC" | "DESC" }> = [];
    if (typeof orderBy === "string") {
      for (const rawPart of orderBy.split(",")) {
        const tokens = rawPart.trim().split(/\s+/).filter(Boolean);
        const field = tokens[0];
        if (!field) continue;
        this.validateColumn(field);
        const rawDir = (tokens[1] ?? "ASC").toUpperCase();
        if (rawDir !== "ASC" && rawDir !== "DESC") {
          throw new Error(`Invalid sort direction '${rawDir}' on model '${this.name}'.`);
        }
        specs.push({ field, direction: rawDir });
      }
    } else {
      for (const item of orderBy) {
        this.validateColumn(item.field);
        const rawDir = (item.direction ?? "ASC").toUpperCase();
        if (rawDir !== "ASC" && rawDir !== "DESC") {
          throw new Error(`Invalid sort direction '${rawDir}' on model '${this.name}'.`);
        }
        specs.push({ field: item.field, direction: rawDir as "ASC" | "DESC" });
      }
    }
    if (specs.length === 0) return " ORDER BY id";
    return ` ORDER BY ${specs.map((s) => `${s.field} ${s.direction}`).join(", ")}`;
  }

  private compileFilters(
    filters: Record<string, unknown>,
    clauses: string[],
    params: unknown[],
  ): void {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined) continue;
      if (key === "$or" || key === "$and") {
        if (!Array.isArray(value)) {
          throw new Error(
            `Operator '${key}' on model '${this.name}' requires an array of filters.`,
          );
        }
        const parts = value.map((sub) => {
          if (!sub || typeof sub !== "object" || Array.isArray(sub)) {
            throw new Error(`Operator '${key}' on model '${this.name}' requires filter objects.`);
          }
          const nested: string[] = [];
          this.compileFilters(sub as Record<string, unknown>, nested, params);
          return nested.length ? nested.join(" AND ") : "1 = 1";
        });
        if (parts.length === 0) {
          clauses.push(key === "$or" ? "1 = 0" : "1 = 1");
        } else {
          clauses.push(`(${parts.join(key === "$or" ? " OR " : " AND ")})`);
        }
        continue;
      }
      if (key === "$not") {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new Error(`Operator '$not' on model '${this.name}' requires a filter object.`);
        }
        const nested: string[] = [];
        this.compileFilters(value as Record<string, unknown>, nested, params);
        clauses.push(nested.length ? `NOT (${nested.join(" AND ")})` : "1 = 0");
        continue;
      }
      this.validateColumn(key);
      if (isOperatorFilterObject(value)) {
        for (const [op, opVal] of Object.entries(value) as Array<
          [keyof QueryFilterOperators, unknown]
        >) {
          if (opVal === undefined) continue;
          if (op === "$ne") {
            const encoded = encodeFilterValue(opVal);
            if (encoded === null) {
              clauses.push(`${key} IS NOT NULL`);
            } else {
              clauses.push(`${key} != ?`);
              params.push(encoded);
            }
          } else if (op === "$gt" || op === "$gte" || op === "$lt" || op === "$lte") {
            const sqlOp = op === "$gt" ? ">" : op === "$gte" ? ">=" : op === "$lt" ? "<" : "<=";
            clauses.push(`${key} ${sqlOp} ?`);
            params.push(encodeFilterValue(opVal));
          } else if (op === "$in") {
            if (!Array.isArray(opVal)) {
              throw new Error(`Operator '$in' on column '${key}' requires an array.`);
            }
            if (opVal.length === 0) {
              clauses.push("1 = 0");
            } else {
              clauses.push(`${key} IN (${opVal.map(() => "?").join(", ")})`);
              for (const entry of opVal) params.push(encodeFilterValue(entry));
            }
          } else if (op === "$like") {
            clauses.push(`${key} LIKE ?`);
            params.push(String(opVal));
          } else if (op === "$ilike") {
            clauses.push(`LOWER(${key}) LIKE LOWER(?)`);
            params.push(String(opVal));
          } else if (op === "$not") {
            const nested: string[] = [];
            this.compileFilters({ [key]: opVal }, nested, params);
            clauses.push(nested.length ? `NOT (${nested.join(" AND ")})` : "1 = 0");
          }
        }
        continue;
      }
      const encoded = encodeFilterValue(value);
      if (encoded === null) {
        clauses.push(`${key} IS NULL`);
      } else {
        clauses.push(`${key} = ?`);
        params.push(encoded);
      }
    }
  }

  private searchColumns(): string[] {
    const desc = modelRegistry.get(this.name);
    if (desc?.searchFields?.length) {
      desc.searchFields.forEach((column) => this.validateColumn(column));
      return desc.searchFields;
    }
    const { fields } = this.descriptor();
    return [...fields.entries()]
      .filter(([name, spec]) => spec.codec === "text" && name !== "_attrs")
      .map(([name]) => name);
  }

  private buildWhere(
    filters: Record<string, unknown> = {},
    opts: {
      includeDeleted?: boolean;
      tenantId?: string;
      q?: string;
      allowedSearchFields?: string[];
    } = {},
  ): { where: string; params: unknown[] } {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (this.softDelete && !opts.includeDeleted) {
      clauses.push("status != 'deleted'");
    }
    if (opts.tenantId !== undefined) {
      clauses.push("tenant_id = ?");
      params.push(normalizeTenantId(opts.tenantId));
    }
    this.compileFilters(filters, clauses, params);

    const needle = opts.q?.trim();
    if (needle) {
      let columns = this.searchColumns();
      if (opts.allowedSearchFields !== undefined) {
        const allowed = new Set(opts.allowedSearchFields);
        columns = columns.filter((col) => allowed.has(col));
      }
      if (columns.length === 0) {
        clauses.push("1 = 0");
      } else {
        const escaped = needle
          .toLowerCase()
          .replaceAll("\\", "\\\\")
          .replaceAll("%", "\\%")
          .replaceAll("_", "\\_");
        clauses.push(
          `(${columns.map((column) => `LOWER(${column}) LIKE ? ESCAPE '\\'`).join(" OR ")})`,
        );
        for (let i = 0; i < columns.length; i += 1) params.push(`%${escaped}%`);
      }
    }

    return { where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
  }

  async readGroup(opts: {
    filters?: Record<string, unknown>;
    groupBy: string[];
    aggregates?: Record<string, { fn: "count" | "sum" | "avg" | "min" | "max"; field?: string }>;
    tenantId?: string;
    includeDeleted?: boolean;
    q?: string;
    orderBy?: string;
    limit?: number;
  }): Promise<Array<Record<string, unknown>>> {
    if (opts.groupBy.length === 0) {
      throw new Error(`readGroup on model '${this.name}' requires at least one groupBy column.`);
    }
    opts.groupBy.forEach((column) => this.validateColumn(column));
    const aggregates = opts.aggregates ?? { count: { fn: "count" } };
    const selectParts: string[] = [...opts.groupBy];
    for (const [alias, spec] of Object.entries(aggregates)) {
      assertIdentifier(alias, "aggregate alias");
      if (spec.fn === "count" && !spec.field) {
        selectParts.push(`COUNT(*) AS ${alias}`);
        continue;
      }
      if (!spec.field) {
        throw new Error(`Aggregate '${alias}' (${spec.fn}) requires a field.`);
      }
      this.validateColumn(spec.field);
      selectParts.push(`${spec.fn.toUpperCase()}(${spec.field}) AS ${alias}`);
    }
    const { where, params } = this.buildWhere(opts.filters ?? {}, opts);
    const orderClause = opts.orderBy
      ? this.buildOrderBy(opts.orderBy)
      : ` ORDER BY ${opts.groupBy.join(", ")}`;
    const execParams = [...params];
    let limitClause = "";
    if (opts.limit !== undefined) {
      limitClause = " LIMIT ?";
      execParams.push(Math.max(0, Math.trunc(opts.limit)));
    }
    const rows = await getDb().all<Record<string, unknown>>(
      `SELECT ${selectParts.join(", ")} FROM ${this.table}${where} GROUP BY ${opts.groupBy.join(", ")}${orderClause}${limitClause}`,
      execParams,
    );
    const { fields } = this.descriptor();
    return rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const column of opts.groupBy) {
        const raw = row[column] ?? row[column.toLowerCase()];
        const spec = fields.get(column);
        out[column] = spec ? decodeValue(raw, spec.codec) : raw;
      }
      for (const alias of Object.keys(aggregates)) {
        const raw = row[alias] ?? row[alias.toLowerCase()];
        out[alias] = raw === null || raw === undefined ? null : Number(raw);
      }
      return out;
    });
  }

  async find(
    filters: Record<string, unknown> = {},
    opts: FindOptions = {},
  ): Promise<ModelRecord<TBusiness>[]> {
    const { where, params } = this.buildWhere(filters, opts);
    const orderClause = this.buildOrderBy(opts.orderBy);
    let paginationClause = "";
    const execParams = [...params];

    if (opts.limit !== undefined) {
      const limit = Math.max(0, Math.trunc(opts.limit));
      paginationClause += " LIMIT ?";
      execParams.push(limit);
    }
    if (opts.offset !== undefined) {
      const offset = Math.max(0, Math.trunc(opts.offset));
      if (opts.limit === undefined) {
        paginationClause += " LIMIT 2147483647";
      }
      paginationClause += " OFFSET ?";
      execParams.push(offset);
    }

    const rows = await getDb().all<Record<string, unknown>>(
      `SELECT * FROM ${this.table}${where}${orderClause}${paginationClause}`,
      execParams,
    );
    const decoded = rows.map((row) => this.decodeRow<ModelRecord<TBusiness>>(row));
    this.applyComputedFields(decoded as unknown as Array<Record<string, unknown>>);
    if (opts.with && opts.with.length > 0) {
      await this.hydrateRelations(
        decoded as unknown as Array<Record<string, unknown>>,
        opts.with,
        opts.tenantId,
      );
    }
    return decoded;
  }

  private applyComputedFields(rows: Array<Record<string, unknown>>): void {
    const computed = modelRegistry.get(this.name)?.computed;
    if (!computed || rows.length === 0) return;
    for (const row of rows) {
      for (const [field, fn] of Object.entries(computed)) {
        try {
          row[field] = fn(row);
        } catch {
          row[field] = null;
        }
      }
    }
  }

  private async hydrateRelations(
    rows: Array<Record<string, unknown>>,
    requested: string[],
    tenantId?: string,
  ): Promise<void> {
    if (rows.length === 0 || requested.length === 0) return;
    const relations = modelRegistry.get(this.name)?.relations;
    if (!relations) return;

    for (const relName of requested) {
      const relation = relations[relName];
      if (!relation) continue;
      const targetDesc = modelRegistry.get(relation.model);
      if (!targetDesc) continue;
      const targetRepo = new BaseRepository(
        targetDesc.name,
        targetDesc.table,
        targetDesc.fullSchema,
        targetDesc.softDelete,
        targetDesc.fields,
      );
      const rowTenants =
        tenantId === undefined
          ? [
              ...new Set(
                rows
                  .map((r) => r.tenant_id)
                  .filter((t): t is string => typeof t === "string" && t.length > 0),
              ),
            ]
          : [];
      const scopedFindOpts: FindOptions =
        tenantId !== undefined
          ? { tenantId }
          : rowTenants.length === 1
            ? { tenantId: rowTenants[0] }
            : {};
      const multiTenantFilter =
        tenantId === undefined && rowTenants.length > 1 ? { tenant_id: { $in: rowTenants } } : {};
      const compositeKey = tenantId === undefined && rowTenants.length > 1;

      if (relation.type === "one2many") {
        const inverseField = relation.inverseField;
        if (!inverseField) continue;
        const parentKeyField = relation.targetField ?? "id";
        const parentKeys = [
          ...new Set(
            rows
              .map((r) => r[parentKeyField])
              .filter((v): v is string | number => v !== null && v !== undefined),
          ),
        ];
        if (parentKeys.length === 0) {
          for (const row of rows) row[`$${relName}`] = [];
          continue;
        }
        const relatedRows = await targetRepo.find(
          { [inverseField]: { $in: parentKeys }, ...multiTenantFilter },
          scopedFindOpts,
        );
        const grouped = new Map<string, Array<Record<string, unknown>>>();
        for (const relRow of relatedRows as unknown as Array<Record<string, unknown>>) {
          const baseKey = String(relRow[inverseField] ?? "");
          const key = compositeKey
            ? `${String(relRow.tenant_id ?? DEFAULT_TENANT_ID)}\0${baseKey}`
            : baseKey;
          const list = grouped.get(key) ?? [];
          list.push(relRow);
          grouped.set(key, list);
        }
        for (const row of rows) {
          const baseKey = String(row[parentKeyField] ?? "");
          const key = compositeKey
            ? `${String(row.tenant_id ?? DEFAULT_TENANT_ID)}\0${baseKey}`
            : baseKey;
          row[`$${relName}`] = grouped.get(key) ?? [];
        }
      } else {
        const targetField = relation.targetField ?? "id";
        const fkValues = [
          ...new Set(
            rows
              .map((r) => r[relName])
              .filter((v): v is string | number => v !== null && v !== undefined),
          ),
        ];
        if (fkValues.length === 0) {
          for (const row of rows) row[`$${relName}`] = null;
          continue;
        }
        const relatedRows = await targetRepo.find(
          { [targetField]: { $in: fkValues }, ...multiTenantFilter },
          scopedFindOpts,
        );
        const map = new Map<string, Record<string, unknown>>();
        for (const relRow of relatedRows as unknown as Array<Record<string, unknown>>) {
          const baseKey = String(relRow[targetField] ?? "");
          const key = compositeKey
            ? `${String(relRow.tenant_id ?? DEFAULT_TENANT_ID)}\0${baseKey}`
            : baseKey;
          map.set(key, relRow);
        }
        for (const row of rows) {
          const fk = row[relName];
          if (fk === null || fk === undefined) {
            row[`$${relName}`] = null;
            continue;
          }
          const key = compositeKey
            ? `${String(row.tenant_id ?? DEFAULT_TENANT_ID)}\0${String(fk)}`
            : String(fk);
          row[`$${relName}`] = map.get(key) ?? null;
        }
      }
    }
  }

  async findOne(
    id: string,
    opts: { includeDeleted?: boolean; tenantId?: string; with?: string[] } = {},
  ): Promise<ModelRecord<TBusiness> | null> {
    const rows = await this.find({ id }, opts);
    return rows[0] ?? null;
  }

  async list(
    filters: Record<string, unknown> = {},
    opts: FindOptions = {},
  ): Promise<ModelRecord<TBusiness>[]> {
    return this.find(filters, opts);
  }

  async count(
    filters: Record<string, unknown> = {},
    opts: { includeDeleted?: boolean; tenantId?: string; q?: string } = {},
  ): Promise<number> {
    const { where, params } = this.buildWhere(filters, opts);
    const row = await getDb().get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ${this.table}${where}`,
      params,
    );
    return Number(row?.total ?? 0);
  }

  forActor(actor: ActorContext): ScopedRepository<TBusiness> {
    return new ScopedRepository<TBusiness>(this, actor);
  }

  async upsert(
    whereFilters: Record<string, unknown>,
    data: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>> {
    const existing = await this.find(whereFilters, {
      limit: 1,
      ...(actor.tenantId !== undefined ? { tenantId: actor.tenantId } : {}),
    });
    if (existing[0]) {
      const updated = await this.update(existing[0].id, data, actor, guard);
      if (updated) return updated;
    }
    return this.create({ ...whereFilters, ...data }, actor, guard);
  }

  async createMany(
    records: Record<string, unknown>[],
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>[]> {
    const created: ModelRecord<TBusiness>[] = [];
    for (const item of records) {
      created.push(await this.create(item, actor, guard));
    }
    return created;
  }

  private applyDefaults(
    data: Record<string, unknown>,
    actor: ActorContext,
  ): Record<string, unknown> {
    const defaults = modelRegistry.get(this.name)?.defaults;
    if (!defaults) return data;
    const merged = { ...data };
    for (const [key, value] of Object.entries(defaults)) {
      if (merged[key] !== undefined) continue;
      merged[key] =
        typeof value === "function" ? (value as (a: ActorContext) => unknown)(actor) : value;
    }
    return merged;
  }

  private async runConstrains(
    action: ModelWriteAction,
    before: Record<string, unknown> | null,
    after: Record<string, unknown>,
    actor: ActorContext,
  ): Promise<void> {
    const constrains = modelRegistry.get(this.name)?.constrains;
    if (!constrains) return;
    for (const constraint of constrains) {
      await constraint({ model: this.name, action, before, after, actor });
    }
  }

  private async assertRelations(
    tx: LibSqlExecutor,
    record: Record<string, unknown>,
  ): Promise<void> {
    const relations = modelRegistry.get(this.name)?.relations;
    if (!relations) return;
    for (const [field, relation] of Object.entries(relations)) {
      if (relation.type === "one2many") continue;
      const value = record[field];
      if (value === undefined || value === null) continue;
      const target = modelRegistry.get(relation.model);
      if (!target) {
        throw new Error(
          `Relation '${field}' on '${this.name}' targets unknown model '${relation.model}'.`,
        );
      }
      const targetField = relation.targetField ?? "id";
      assertIdentifier(targetField, "relation target column");
      if (!METADATA_NAMES.has(targetField) && !target.fields.has(targetField)) {
        throw new Error(
          `Relation '${field}' targets unknown column '${relation.model}.${targetField}'.`,
        );
      }
      const deletedClause = target.softDelete ? " AND status != 'deleted'" : "";
      const row = await tx.get<{ ok: number }>(
        `SELECT 1 AS ok FROM ${target.table} WHERE ${targetField} = ? AND tenant_id = ?${deletedClause}`,
        [
          encodeFilterValue(value),
          normalizeTenantId(String(record.tenant_id ?? DEFAULT_TENANT_ID)),
        ],
      );
      if (!row) {
        throw new Error(
          `Relation '${field}' on '${this.name}' references missing ${relation.model}.${targetField}='${String(value)}'.`,
        );
      }
    }
  }

  private async assertNotReferenced(
    tx: LibSqlExecutor,
    current: Record<string, unknown>,
  ): Promise<void> {
    for (const other of modelRegistry.list()) {
      for (const [field, relation] of Object.entries(other.relations ?? {})) {
        if (relation.type === "one2many") continue;
        if (relation.model !== this.name || relation.onDelete === "ignore") continue;
        const targetField = relation.targetField ?? "id";
        const value = current[targetField];
        if (value === undefined || value === null) continue;
        const deletedClause = other.softDelete ? " AND status != 'deleted'" : "";
        const row = await tx.get<{ ok: number }>(
          `SELECT 1 AS ok FROM ${other.table} WHERE ${field} = ? AND tenant_id = ?${deletedClause} LIMIT 1`,
          [encodeFilterValue(value), String(current.tenant_id)],
        );
        if (row) {
          throw new ConflictError(
            `Cannot delete '${this.name}' ${String(current.id)}: referenced by '${other.name}.${field}' (restrict).`,
          );
        }
      }
    }
  }

  private async applyRetention(tenantId: string): Promise<void> {
    const retention = modelRegistry.get(this.name)?.retention;
    if (!retention) return;
    const db = getDb();
    if (retention.maxRows !== undefined && retention.maxRows > 0) {
      const orderField = retention.orderField ?? "create_date";
      this.validateColumn(orderField);
      await db.run(
        `DELETE FROM ${this.table} WHERE tenant_id = ? AND id NOT IN (SELECT id FROM ${this.table} WHERE tenant_id = ? ORDER BY ${orderField} DESC, id DESC LIMIT ?)`,
        [tenantId, tenantId, Math.trunc(retention.maxRows)],
      );
    }
    if (retention.ttlDays !== undefined && retention.ttlDays > 0) {
      const dateField = retention.dateField ?? "create_date";
      this.validateColumn(dateField);
      const cutoff = new Date(Date.now() - retention.ttlDays * 86_400_000).toISOString();
      await db.run(`DELETE FROM ${this.table} WHERE tenant_id = ? AND ${dateField} < ?`, [
        tenantId,
        cutoff,
      ]);
    }
  }

  async create(
    rawData: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>> {
    await ensureAuditTable();
    if (
      actor.tenantId !== undefined &&
      rawData.tenant_id !== undefined &&
      normalizeTenantId(String(rawData.tenant_id)) !== normalizeTenantId(actor.tenantId)
    ) {
      throw new PolicyError("Cross-tenant create is forbidden", "TENANT_MISMATCH", 403);
    }
    const data = this.applyDefaults(rawData, actor);
    const hooks = modelRegistry.get(this.name)?.hooks;
    if (hooks?.beforeSave) {
      await hooks.beforeSave({
        model: this.name,
        action: "CREATE",
        before: null,
        values: data,
        actor,
      });
    }
    const { fullSchema, extensible, customFields } = this.descriptor();
    const now = new Date();
    const resolvedTenantId =
      actor.tenantId !== undefined
        ? normalizeTenantId(actor.tenantId)
        : normalizeTenantId(
            typeof data.tenant_id === "string" ? data.tenant_id : DEFAULT_TENANT_ID,
          );
    const record: Record<string, unknown> = {
      ...data,
      id: data.id ?? uuidv7(),
      create_uid: actor.actorId,
      create_date: now,
      write_uid: actor.actorId,
      write_date: now,
      status: "active" as RecordStatus,
      deleted_uid: null,
      deleted_date: null,
      version: 1,
      source: actor.source,
      source_ref: data.source_ref ?? null,
      tenant_id: resolvedTenantId,
    };
    if (extensible) {
      record._attrs = validateAttrsPayload(data._attrs, customFields);
    }
    const parsed = fullSchema.parse(record) as Record<string, unknown>;

    const cols = Object.keys(parsed);
    cols.forEach((column) => this.validateColumn(column));
    const placeholders = cols.map(() => "?").join(", ");
    const values = this.encodeRow(parsed);

    await getDb().transaction(async (tx) => {
      if (guard?.createRuleDomain && !matchesFilter(parsed, guard.createRuleDomain)) {
        throw new PolicyError(
          `Create on '${this.name}' violates record rule`,
          "RULE_FORBIDDEN",
          403,
        );
      }
      await this.assertRelations(tx, parsed);
      await this.runConstrains("CREATE", null, parsed, actor);
      await tx.run(
        `INSERT INTO ${this.table} (${cols.join(", ")}) VALUES (${placeholders})`,
        values,
      );
      await this.writeAudit(tx, parsed, "CREATE", null, actor);
    });
    await this.applyRetention(String(parsed.tenant_id));

    const decoded = this.decodeRow<ModelRecord<TBusiness>>(parsed);
    this.applyComputedFields([decoded as unknown as Record<string, unknown>]);
    if (hooks?.afterSave) {
      await hooks.afterSave({
        model: this.name,
        action: "CREATE",
        before: null,
        values: decoded as unknown as Record<string, unknown>,
        actor,
      });
    }
    await modelRegistry.emitWrite({
      model: this.name,
      entityId: String(parsed.id),
      action: "CREATE",
      record: decoded as Record<string, unknown>,
      before: null,
      actor,
      timestamp: now.toISOString(),
    });
    return decoded;
  }

  async update(
    id: string,
    rawData: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    await ensureAuditTable();
    const data = { ...rawData };
    const hooks = modelRegistry.get(this.name)?.hooks;
    const { fullSchema, extensible, customFields } = this.descriptor();

    let beforeSnapshot: Record<string, unknown> | null = null;
    const decoded = await getDb().transaction(async (tx) => {
      const currentRow = await tx.get<Record<string, unknown>>(
        `SELECT * FROM ${this.table} WHERE id = ?`,
        [id],
      );
      if (!currentRow) return null;

      const current = this.decodeRow<Record<string, unknown>>(currentRow);
      if (this.softDelete && current.status === "deleted") {
        return null;
      }
      if (actor.tenantId !== undefined && current.tenant_id !== normalizeTenantId(actor.tenantId)) {
        return null;
      }
      if (guard?.ruleDomain && !matchesFilter(current, guard.ruleDomain)) {
        return null;
      }
      if (
        rawData.tenant_id !== undefined &&
        normalizeTenantId(String(rawData.tenant_id)) !== String(current.tenant_id)
      ) {
        throw new PolicyError("Changing tenant_id is forbidden", "TENANT_MISMATCH", 403);
      }
      if (data.version !== undefined && Number(data.version) !== Number(current.version)) {
        throw new ConflictError(
          `Version conflict on '${this.name}' ${id}: expected version ${String(current.version)}, got ${String(data.version)}.`,
        );
      }
      beforeSnapshot = current;
      if (hooks?.beforeSave) {
        await hooks.beforeSave({
          model: this.name,
          action: "UPDATE",
          before: current,
          values: data,
          actor,
        });
      }

      const now = new Date();
      const updated: Record<string, unknown> = {
        ...current,
        ...data,
        id: current.id,
        create_uid: current.create_uid,
        create_date: current.create_date,
        write_uid: actor.actorId,
        write_date: now,
        status: current.status,
        deleted_uid: current.deleted_uid,
        deleted_date: current.deleted_date,
        version: Number(current.version) + 1,
        source: actor.source,
        source_ref: current.source_ref,
        tenant_id: current.tenant_id,
      };
      if (extensible) {
        const mergedAttrs = {
          ...((current._attrs as Record<string, unknown> | undefined) ?? {}),
          ...((data._attrs as Record<string, unknown> | undefined) ?? {}),
        };
        updated._attrs = validateAttrsPayload(mergedAttrs, customFields);
      }
      const parsed = fullSchema.parse(updated) as Record<string, unknown>;
      if (guard?.ruleDomain && !matchesFilter(parsed, guard.ruleDomain)) {
        throw new PolicyError(
          `Update on '${this.name}' violates record rule`,
          "RULE_FORBIDDEN",
          403,
        );
      }
      await this.assertRelations(tx, parsed);
      await this.runConstrains("UPDATE", current, parsed, actor);

      const cols = Object.keys(parsed).filter((column) => column !== "id");
      cols.forEach((column) => this.validateColumn(column));
      const setClause = cols.map((column) => `${column} = ?`).join(", ");
      const values = this.encodeRow(
        Object.fromEntries(cols.map((column) => [column, parsed[column]])),
      );

      const result = await tx.run(
        `UPDATE ${this.table} SET ${setClause} WHERE id = ? AND version = ?`,
        [...values, id, current.version],
      );
      if (result.rowsAffected !== 1) {
        throw new ConflictError(
          `Version conflict on '${this.name}' ${id}: record changed while updating.`,
        );
      }

      await this.writeAudit(tx, parsed, "UPDATE", current, actor);
      return this.decodeRow<ModelRecord<TBusiness>>(parsed);
    });

    if (decoded) {
      this.applyComputedFields([decoded as unknown as Record<string, unknown>]);
      if (hooks?.afterSave) {
        await hooks.afterSave({
          model: this.name,
          action: "UPDATE",
          before: beforeSnapshot,
          values: decoded as unknown as Record<string, unknown>,
          actor,
        });
      }
      await modelRegistry.emitWrite({
        model: this.name,
        entityId: id,
        action: "UPDATE",
        record: decoded as Record<string, unknown>,
        before: beforeSnapshot,
        actor,
        timestamp: new Date().toISOString(),
      });
    }
    return decoded;
  }

  async archive(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "archived", "ARCHIVE", actor, { guard });
  }

  async restore(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "active", "RESTORE", actor, { guard });
  }

  /** Soft delete — never issues a physical DELETE. */
  async delete(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
    guard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "deleted", "DELETE", actor, { setDeletedFields: true, guard });
  }

  async history(id: string, opts?: { limit?: number; offset?: number }): Promise<AuditEntry[]> {
    await ensureAuditTable();
    let pagination = "";
    const params: unknown[] = [this.name, id];
    if (opts?.limit !== undefined) {
      pagination += " LIMIT ?";
      params.push(Math.max(0, Math.trunc(opts.limit)));
    }
    if (opts?.offset !== undefined) {
      if (opts.limit === undefined) {
        pagination += " LIMIT 2147483647";
      }
      pagination += " OFFSET ?";
      params.push(Math.max(0, Math.trunc(opts.offset)));
    }
    return getDb().all<AuditEntry>(
      `SELECT * FROM _orm_audit_log WHERE model = ? AND entity_id = ? ORDER BY changed_at, rowid${pagination}`,
      params,
    );
  }

  private async setStatus(
    id: string,
    status: RecordStatus,
    action: AuditAction,
    actor: ActorContext,
    opts: { setDeletedFields?: boolean; guard?: WriteGuardOptions } = {},
  ): Promise<ModelRecord<TBusiness> | null> {
    await ensureAuditTable();
    const { fullSchema } = this.descriptor();

    let beforeSnapshot: Record<string, unknown> | null = null;
    const decoded = await getDb().transaction(async (tx) => {
      const currentRow = await tx.get<Record<string, unknown>>(
        `SELECT * FROM ${this.table} WHERE id = ?`,
        [id],
      );
      if (!currentRow) return null;

      const current = this.decodeRow<Record<string, unknown>>(currentRow);
      if (actor.tenantId !== undefined && current.tenant_id !== normalizeTenantId(actor.tenantId)) {
        return null;
      }
      if (opts.guard?.ruleDomain && !matchesFilter(current, opts.guard.ruleDomain)) {
        return null;
      }
      beforeSnapshot = current;
      const now = new Date();
      const updated = {
        ...current,
        status,
        write_uid: actor.actorId,
        write_date: now,
        version: Number(current.version) + 1,
        ...(opts.setDeletedFields
          ? { deleted_uid: actor.actorId, deleted_date: now }
          : { deleted_uid: null, deleted_date: null }),
      };
      const parsed = fullSchema.parse(updated) as Record<string, unknown>;
      if (action === "DELETE") await this.assertNotReferenced(tx, current);
      await this.runConstrains(action, current, parsed, actor);

      const cols = ["status", "write_uid", "write_date", "version", "deleted_uid", "deleted_date"];
      const setClause = cols.map((column) => `${column} = ?`).join(", ");
      const values = this.encodeRow(
        Object.fromEntries(cols.map((column) => [column, parsed[column]])),
      );

      const result = await tx.run(
        `UPDATE ${this.table} SET ${setClause} WHERE id = ? AND version = ?`,
        [...values, id, current.version],
      );
      if (result.rowsAffected !== 1) {
        throw new ConflictError(
          `Version conflict on '${this.name}' ${id}: record changed while updating status.`,
        );
      }

      await this.writeAudit(tx, parsed, action, current, actor);
      return this.decodeRow<ModelRecord<TBusiness>>(parsed);
    });

    if (decoded) {
      await modelRegistry.emitWrite({
        model: this.name,
        entityId: id,
        action,
        record: decoded as Record<string, unknown>,
        before: beforeSnapshot,
        actor,
        timestamp: new Date().toISOString(),
      });
    }
    return decoded;
  }

  private async writeAudit(
    tx: LibSqlExecutor,
    record: Record<string, unknown>,
    action: AuditAction,
    before: Record<string, unknown> | null,
    actor: ActorContext,
  ): Promise<void> {
    const entry = auditHookFor(this.name)(record, action, before, actor);
    await tx.run(
      `INSERT INTO _orm_audit_log (id, model, entity_id, action, changed_by, changed_at, diff, entity_version, source, request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.model,
        entry.entity_id,
        entry.action,
        entry.changed_by,
        entry.changed_at,
        entry.diff,
        entry.entity_version,
        entry.source,
        entry.request_id,
      ],
    );
  }
}

function isActorContextArg(value: unknown): value is ActorContext {
  return typeof value === "object" && value !== null && "actorId" in value && "source" in value;
}

/** Tenant- and actor-bound wrapper around `BaseRepository`. */
export class ScopedRepository<TBusiness extends ZodObjectLike = ZodObjectLike> {
  readonly name: string;
  readonly table: string;
  readonly softDelete: boolean;
  readonly resolvedTenantId: string | undefined;
  private readonly effectiveActor: ActorContext;

  constructor(
    private readonly repo: BaseRepository<TBusiness>,
    public readonly actor: ActorContext,
  ) {
    this.name = repo.name;
    this.table = repo.table;
    this.softDelete = repo.softDelete;

    if (isSystemActor(actor)) {
      this.resolvedTenantId =
        actor.tenantId !== undefined ? requireActorTenantId(actor) : undefined;
    } else {
      this.resolvedTenantId = requireActorTenantId(actor);
    }
    this.effectiveActor =
      this.resolvedTenantId !== undefined ? { ...actor, tenantId: this.resolvedTenantId } : actor;
  }

  get fullSchema(): ZodObjectLike {
    return this.repo.fullSchema;
  }

  forActor(actor: ActorContext): ScopedRepository<TBusiness> {
    if (this.resolvedTenantId !== undefined) {
      const nextTenant = requireActorTenantId(actor);
      if (nextTenant !== this.resolvedTenantId) {
        throw new PolicyError("Cross-tenant access is forbidden", "TENANT_MISMATCH", 403);
      }
    }
    return this.repo.forActor(actor);
  }

  private resolveQueryTenantId(requestedTenantId?: string): string | undefined {
    if (this.resolvedTenantId !== undefined) {
      if (
        requestedTenantId !== undefined &&
        normalizeTenantId(requestedTenantId) !== this.resolvedTenantId
      ) {
        throw new PolicyError("Cross-tenant access is forbidden", "TENANT_MISMATCH", 403);
      }
      return this.resolvedTenantId;
    }
    return requestedTenantId !== undefined ? normalizeTenantId(requestedTenantId) : undefined;
  }

  private resolveWriteArgs(
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): { actor: ActorContext; guard?: WriteGuardOptions } {
    if (isActorContextArg(guardOrActor)) {
      if (
        this.resolvedTenantId !== undefined &&
        guardOrActor.tenantId !== undefined &&
        normalizeTenantId(guardOrActor.tenantId) !== this.resolvedTenantId
      ) {
        throw new PolicyError("Cross-tenant access is forbidden", "TENANT_MISMATCH", 403);
      }
      return { actor: this.effectiveActor, guard: maybeGuard };
    }
    return { actor: this.effectiveActor, guard: guardOrActor };
  }

  async readGroup(opts: {
    filters?: Record<string, unknown>;
    groupBy: string[];
    aggregates?: Record<string, { fn: "count" | "sum" | "avg" | "min" | "max"; field?: string }>;
    tenantId?: string;
    includeDeleted?: boolean;
    q?: string;
    orderBy?: string;
    limit?: number;
  }): Promise<Array<Record<string, unknown>>> {
    const tenantId = this.resolveQueryTenantId(opts.tenantId);
    return this.repo.readGroup({
      ...opts,
      ...(tenantId !== undefined ? { tenantId } : {}),
    });
  }

  async find(
    filters: Record<string, unknown> = {},
    opts: FindOptions = {},
  ): Promise<ModelRecord<TBusiness>[]> {
    const tenantId = this.resolveQueryTenantId(opts.tenantId);
    return this.repo.find(filters, {
      ...opts,
      ...(tenantId !== undefined ? { tenantId } : {}),
    });
  }

  async findOne(
    id: string,
    opts: { includeDeleted?: boolean; tenantId?: string; with?: string[] } = {},
  ): Promise<ModelRecord<TBusiness> | null> {
    const tenantId = this.resolveQueryTenantId(opts.tenantId);
    return this.repo.findOne(id, {
      ...opts,
      ...(tenantId !== undefined ? { tenantId } : {}),
    });
  }

  async list(
    filters: Record<string, unknown> = {},
    opts: FindOptions = {},
  ): Promise<ModelRecord<TBusiness>[]> {
    return this.find(filters, opts);
  }

  async count(
    filters: Record<string, unknown> = {},
    opts: {
      includeDeleted?: boolean;
      tenantId?: string;
      q?: string;
      allowedSearchFields?: string[];
    } = {},
  ): Promise<number> {
    const tenantId = this.resolveQueryTenantId(opts.tenantId);
    return this.repo.count(filters, {
      ...opts,
      ...(tenantId !== undefined ? { tenantId } : {}),
    });
  }

  async upsert(
    whereFilters: Record<string, unknown>,
    data: Record<string, unknown>,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.upsert(whereFilters, data, actor, guard);
  }

  async createMany(
    records: Record<string, unknown>[],
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>[]> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.createMany(records, actor, guard);
  }

  async create(
    rawData: Record<string, unknown>,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness>> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    if (
      this.resolvedTenantId !== undefined &&
      rawData.tenant_id !== undefined &&
      normalizeTenantId(String(rawData.tenant_id)) !== this.resolvedTenantId
    ) {
      throw new PolicyError("Cross-tenant create is forbidden", "TENANT_MISMATCH", 403);
    }
    return this.repo.create(rawData, actor, guard);
  }

  async update(
    id: string,
    rawData: Record<string, unknown>,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.update(id, rawData, actor, guard);
  }

  async archive(
    id: string,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.archive(id, actor, guard);
  }

  async restore(
    id: string,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.restore(id, actor, guard);
  }

  async delete(
    id: string,
    guardOrActor?: WriteGuardOptions | ActorContext,
    maybeGuard?: WriteGuardOptions,
  ): Promise<ModelRecord<TBusiness> | null> {
    const { actor, guard } = this.resolveWriteArgs(guardOrActor, maybeGuard);
    return this.repo.delete(id, actor, guard);
  }

  async history(
    id: string,
    opts?: { limit?: number; offset?: number; tenantId?: string },
  ): Promise<AuditEntry[]> {
    const tenantId = this.resolveQueryTenantId(opts?.tenantId);
    if (tenantId !== undefined) {
      const existing = await this.repo.findOne(id, { includeDeleted: true, tenantId });
      if (!existing) return [];
    }
    return this.repo.history(id, opts);
  }
}

function auditHookFor(model: string) {
  return (
    record: Record<string, unknown>,
    action: AuditAction,
    before: Record<string, unknown> | null,
    actor: ActorContext,
  ): AuditEntry => {
    const diff: Record<string, { before: unknown; after: unknown }> = {};
    if (before) {
      for (const key of Object.keys(record)) {
        if (JSON.stringify(before[key]) !== JSON.stringify(record[key])) {
          diff[key] = { before: before[key], after: record[key] };
        }
      }
    } else {
      for (const key of Object.keys(record)) {
        diff[key] = { before: null, after: record[key] };
      }
    }
    return {
      id: uuidv7(),
      model,
      entity_id: String(record.id),
      action,
      changed_by: actor.actorId,
      changed_at: new Date().toISOString(),
      diff: JSON.stringify(diff),
      entity_version: Number(record.version),
      source: actor.source,
      request_id: actor.requestId ?? null,
    };
  };
}

export function defineModel<TBusiness extends ZodObjectLike>(
  options: DefineModelOptions<TBusiness>,
): DefineModelReturn<TBusiness> {
  const {
    name,
    table,
    schema,
    softDelete = true,
    extensible = false,
    restEnabled = false,
    publicFields,
    indexes = [],
    searchFields,
    defaults,
    constrains,
    relations,
    retention,
    actions,
    computed,
    hooks,
    fieldPolicies,
  } = options;

  assertIdentifier(table, "table");

  for (const field of Object.keys(schema.shape)) {
    assertIdentifier(field, "column");
    fieldSpec(schema.shape[field] as z.ZodTypeAny, field);
  }

  const descriptor = modelRegistry.register({
    name,
    table,
    baseSchema: schema,
    softDelete,
    extensible,
    restEnabled,
    publicFields,
    indexes,
    searchFields,
    defaults,
    constrains,
    relations,
    retention,
    actions,
    computed,
    hooks,
    fieldPolicies,
  });

  const repo = new BaseRepository<TBusiness>(
    name,
    table,
    descriptor.fullSchema,
    softDelete,
    descriptor.fields,
  );

  return {
    name,
    table,
    schema,
    get fullSchema() {
      return modelRegistry.get(name)?.fullSchema ?? descriptor.fullSchema;
    },
    type: undefined as unknown as z.infer<TBusiness>,
    repository: repo,
    get ddl() {
      return modelRegistry.get(name)?.ddl ?? descriptor.ddl;
    },
    extensible,
    restEnabled,
    publicFields,
    auditHook: (record, action, before) => auditHookFor(name)(record, action, before, SYSTEM_ACTOR),
  };
}
