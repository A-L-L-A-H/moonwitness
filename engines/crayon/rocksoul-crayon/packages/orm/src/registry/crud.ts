import { eq, like, or, and, desc, asc, count, inArray, type SQL } from 'drizzle-orm';
import type { Database } from '../client.js';
import type { ModelDefinition, FindOptions, PaginatedResult } from './types.js';

/** A Drizzle database or the transaction context supplied by db.transaction(). */
export type DatabaseContext = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

export interface ModelUpdateOptions {
  readonly expectedVersion?: string;
}

export class ModelConflictError extends Error {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(
    readonly model: string,
    readonly recordId: string,
    readonly expectedVersion: string,
    readonly actualVersion?: string,
  ) {
    super(`Record '${recordId}' in model '${model}' changed before this update was applied`);
    this.name = 'ModelConflictError';
  }
}

/**
 * Convert a single snake_case string to camelCase.
 * e.g. "project_id" -> "projectId"
 */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Normalize all top-level keys of a payload from snake_case to camelCase.
 * Drizzle ORM column accessors use camelCase (e.g. table.projectId),
 * but API clients commonly send snake_case (e.g. { project_id: 'x' }).
 */
function normalizePayloadKeys(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    normalized[snakeToCamel(k)] = v;
  }
  return normalized;
}


export class ModelCrud {
  static async findMany<T = Record<string, unknown>>(
    db: DatabaseContext,
    model: ModelDefinition,
    options: FindOptions = {}
  ): Promise<PaginatedResult<T>> {
    const table = model.table as any;
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    // Filter pencarian teks (search)
    if (options.search && model.searchableFields.length > 0) {
      const searchConditions = model.searchableFields
        .filter((field) => table[field])
        .map((field) => like(table[field], `%${options.search}%`));
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions)!);
      }
    }

    // Filter spesifik per field
    if (options.filter && typeof options.filter === 'object') {
      for (const [key, value] of Object.entries(options.filter)) {
        if (table[key] && Array.isArray(value) && value.length > 0) {
          conditions.push(inArray(table[key], value));
        } else if (table[key] && value !== undefined && value !== null && value !== '') {
          conditions.push(eq(table[key], value));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    const orderColumnName = options.order && table[options.order] ? options.order : model.defaultOrderField;
    const orderColumn = table[orderColumnName] || table[model.primaryKey];
    const orderDirection = options.direction === 'asc' ? asc(orderColumn) : desc(orderColumn);

    // Ambil items
    const items = await (db as any)
      .select()
      .from(table)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    // Hitung total records
    const countResult = await (db as any)
      .select({ total: count() })
      .from(table)
      .where(whereClause);

    const total = Number(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    return {
      items: items as T[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async findById<T = Record<string, unknown>>(
    db: DatabaseContext,
    model: ModelDefinition,
    id: string
  ): Promise<T | null> {
    const table = model.table as any;
    const pkColumn = table[model.primaryKey];

    const rows = await (db as any).select().from(table).where(eq(pkColumn, id)).limit(1);
    return (rows[0] as T) || null;
  }

  static async create<T = Record<string, unknown>>(
    db: DatabaseContext,
    model: ModelDefinition,
    data: Record<string, unknown>,
    user?: string
  ): Promise<T> {
    const table = model.table as any;
    const now = new Date().toISOString();
    // Normalize incoming snake_case keys to camelCase for Drizzle compatibility
    const payload = normalizePayloadKeys(data);

    // Auto-generate primary key jika belum ada
    if (!payload[model.primaryKey]) {
      const prefix = model.name.substring(0, 3);
      payload[model.primaryKey] = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    // Auto-inject timestamp & audit fields jika tabel memilikinya
    if (table.createdAt && !payload.createdAt) {
      payload.createdAt = now;
    }
    if (table.updatedAt && !payload.updatedAt) {
      payload.updatedAt = now;
    }
    if (table.createdBy && !payload.createdBy) {
      payload.createdBy = user || 'system';
    }

    await (db as any).insert(table).values(payload);

    // Ambil data yang baru saja dibuat
    const created = await this.findById<T>(db, model, String(payload[model.primaryKey]));
    return (created || payload) as T;
  }

  static async update<T = Record<string, unknown>>(
    db: DatabaseContext,
    model: ModelDefinition,
    id: string,
    data: Record<string, unknown>,
    user?: string,
    options: ModelUpdateOptions = {},
  ): Promise<T | null> {
    const table = model.table as any;
    const pkColumn = table[model.primaryKey];
    const existing = await this.findById<Record<string, unknown>>(db, model, id);
    if (!existing) return null;
    const currentVersion = typeof existing.updatedAt === 'string' ? existing.updatedAt : undefined;
    if (options.expectedVersion !== undefined && options.expectedVersion !== currentVersion) {
      throw new ModelConflictError(model.name, id, options.expectedVersion, currentVersion);
    }

    // Normalize incoming snake_case keys to camelCase for Drizzle compatibility
    const payload = normalizePayloadKeys(data);

    // expectedVersion is a transport-level optimistic-lock token, never a DB column.
    delete payload.expectedVersion;

    // Jangan izinkan update primary key
    delete payload[model.primaryKey];

    // Auto-update timestamp & audit fields jika tabel memilikinya
    if (table.updatedAt) {
      const currentTimestamp = currentVersion ? Date.parse(currentVersion) : Number.NaN;
      const nextTimestamp = Number.isFinite(currentTimestamp)
        ? Math.max(Date.now(), currentTimestamp + 1)
        : Date.now();
      payload.updatedAt = new Date(nextTimestamp).toISOString();
    }
    if (table.updatedBy) {
      payload.updatedBy = user || 'system';
    }

    const whereClause = options.expectedVersion !== undefined && table.updatedAt && currentVersion
      ? and(eq(pkColumn, id), eq(table.updatedAt, currentVersion))
      : eq(pkColumn, id);
    const result = await (db as any).update(table).set(payload).where(whereClause);

    if (options.expectedVersion !== undefined && table.updatedAt && currentVersion) {
      const rowsAffected = Number(result?.rowsAffected ?? result?.changes);
      if (rowsAffected === 0) {
        const latest = await this.findById<Record<string, unknown>>(db, model, id);
        throw new ModelConflictError(model.name, id, options.expectedVersion, typeof latest?.updatedAt === 'string' ? latest.updatedAt : undefined);
      }
    }

    return this.findById<T>(db, model, id);
  }

  static async delete(
    db: DatabaseContext,
    model: ModelDefinition,
    id: string
  ): Promise<boolean> {
    const table = model.table as any;
    const pkColumn = table[model.primaryKey];

    const existing = await this.findById(db, model, id);
    if (!existing) {
      return false;
    }

    await (db as any).delete(table).where(eq(pkColumn, id));
    return true;
  }
}
