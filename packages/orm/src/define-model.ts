import type { z } from "zod";
import { getDb } from "./driver.js";
import type { LibSqlExecutor } from "./drivers/sqlite.driver.js";
import { ConflictError } from "./errors.js";
import type { BaseMetadata, RecordStatus } from "./base-metadata.js";
import type { ActorContext } from "./actor-context.js";
import { DEFAULT_TENANT_ID, normalizeTenantId, SYSTEM_ACTOR } from "./actor-context.js";
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
}

export interface FindOptions {
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string | Array<{ field: string; direction?: "ASC" | "DESC" }>;
  tenantId?: string;
}

export interface DefineModelOptions<TBusiness extends ZodObjectLike = ZodObjectLike> {
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
]);

function isOperatorFilterObject(value: unknown): value is QueryFilterOperators {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    value instanceof Date
  ) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => FILTER_OPERATOR_KEYS.has(key));
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

  private buildWhere(
    filters: Record<string, unknown> = {},
    opts: { includeDeleted?: boolean; tenantId?: string } = {},
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
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined) continue;
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

    return { where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
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
    return rows.map((row) => this.decodeRow<ModelRecord<TBusiness>>(row));
  }

  async findOne(
    id: string,
    opts: { includeDeleted?: boolean; tenantId?: string } = {},
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
    opts: { includeDeleted?: boolean; tenantId?: string } = {},
  ): Promise<number> {
    const { where, params } = this.buildWhere(filters, opts);
    const row = await getDb().get<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ${this.table}${where}`,
      params,
    );
    return Number(row?.total ?? 0);
  }

  async upsert(
    whereFilters: Record<string, unknown>,
    data: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness>> {
    const existing = await this.find(whereFilters, {
      limit: 1,
      ...(actor.tenantId !== undefined ? { tenantId: actor.tenantId } : {}),
    });
    if (existing[0]) {
      const updated = await this.update(existing[0].id, data, actor);
      if (updated) return updated;
    }
    return this.create({ ...whereFilters, ...data }, actor);
  }

  async createMany(
    records: Record<string, unknown>[],
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness>[]> {
    const created: ModelRecord<TBusiness>[] = [];
    for (const item of records) {
      created.push(await this.create(item, actor));
    }
    return created;
  }

  async create(
    data: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness>> {
    await ensureAuditTable();
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
      await tx.run(
        `INSERT INTO ${this.table} (${cols.join(", ")}) VALUES (${placeholders})`,
        values,
      );
      await this.writeAudit(tx, parsed, "CREATE", null, actor);
    });

    const decoded = this.decodeRow<ModelRecord<TBusiness>>(parsed);
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
    data: Record<string, unknown>,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness> | null> {
    await ensureAuditTable();
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
      if (data.version !== undefined && Number(data.version) !== Number(current.version)) {
        throw new ConflictError(
          `Version conflict on '${this.name}' ${id}: expected version ${String(current.version)}, got ${String(data.version)}.`,
        );
      }
      beforeSnapshot = current;

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
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "archived", "ARCHIVE", actor);
  }

  async restore(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "active", "RESTORE", actor);
  }

  /** Soft delete — never issues a physical DELETE. */
  async delete(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<ModelRecord<TBusiness> | null> {
    return this.setStatus(id, "deleted", "DELETE", actor, { setDeletedFields: true });
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
    opts: { setDeletedFields?: boolean } = {},
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
