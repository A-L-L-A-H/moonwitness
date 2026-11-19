import type { Era, TimelineEvent } from "@moonwitness/contracts/types";
import {
  normalizeTenantId,
  SYSTEM_ACTOR,
  uuidv7,
  type ActorContext,
  type AuditEntry,
  type FindOptions,
} from "@moonwitness/orm";
import { timelineEventModel, timelineEraModel } from "./model.js";

export type CreateTimelineEventInput = Omit<
  TimelineEvent,
  "id" | "excerpt" | "body" | "location" | "tags" | "sources" | "notes" | "image" | "related"
> & {
  id?: string;
  excerpt?: string;
  body?: string;
  location?: string;
  tags?: string[];
  sources?: number;
  notes?: number;
  image?: TimelineEvent["image"];
  related?: string[];
};
export type UpdateTimelineEventInput = Partial<Omit<TimelineEvent, "id">> & { version?: number };

export interface TimelineFilters {
  era?: string;
  kind?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
  tenantId?: string;
}

export interface TimelineStats {
  total: number;
  byEra: Record<string, number>;
  byKind: Record<string, number>;
}

export interface ITimelineRepository {
  listEvents(filters: TimelineFilters): Promise<{ data: TimelineEvent[]; total: number }>;
  getEvent(id: string, tenantId?: string): Promise<TimelineEvent | null>;
  getStats(tenantId?: string): Promise<TimelineStats>;
  getEras(tenantId?: string): Promise<Era[]>;
  createEvent(input: CreateTimelineEventInput, actor?: ActorContext): Promise<TimelineEvent>;
  updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor?: ActorContext,
  ): Promise<TimelineEvent | null>;
  archiveEvent(id: string, actor?: ActorContext): Promise<TimelineEvent | null>;
  restoreEvent(id: string, actor?: ActorContext): Promise<TimelineEvent | null>;
  deleteEvent(id: string, actor?: ActorContext): Promise<TimelineEvent | null>;
  getEventHistory(id: string): Promise<AuditEntry[]>;
  upsertEra(input: Era, actor?: ActorContext): Promise<Era>;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function rowToEvent(row: Record<string, unknown>): TimelineEvent {
  const rawImagePosition = row.imagePosition ?? row.imageposition;
  const attrs = parseJson<Record<string, unknown> | undefined>(row._attrs, undefined);
  return {
    id: String(row.id),
    kind: String(row.kind) as TimelineEvent["kind"],
    date: String(row.date),
    era: String(row.era) as TimelineEvent["era"],
    title: String(row.title),
    excerpt: String(row.excerpt),
    body: String(row.body),
    location: String(row.location),
    tags: parseJson<string[]>(row.tags, []),
    sources: Number(row.sources ?? 0),
    notes: Number(row.notes ?? 0),
    image: String(row.image) as TimelineEvent["image"],
    imagePosition: rawImagePosition == null ? undefined : String(rawImagePosition),
    related: parseJson<string[]>(row.related, []),
    ...(attrs && Object.keys(attrs).length > 0 ? { _attrs: attrs } : {}),
  } as TimelineEvent;
}

function rowToEra(row: Record<string, unknown>): Era {
  return {
    id: String(row.id) as Era["id"],
    name: String(row.name),
    years: String(row.years),
    tagline: String(row.tagline),
    color: String(row.color),
  };
}

export const MAX_LIST_LIMIT = 100;
export const DEFAULT_LIST_LIMIT = 100;

/**
 * Data access owned by the timeline addon; 100% ORM-backed via searchFields and readGroup.
 */
export class TimelineRepository implements ITimelineRepository {
  private readonly events = timelineEventModel.repository;
  private readonly eras = timelineEraModel.repository;

  async listEvents(filters: TimelineFilters): Promise<{ data: TimelineEvent[]; total: number }> {
    const queryFilters: Record<string, unknown> = {};
    if (filters.era) queryFilters.era = filters.era;
    if (filters.kind) queryFilters.kind = filters.kind;
    if (filters.from || filters.to) {
      const dateCond: Record<string, string> = {};
      if (filters.from) dateCond.$gte = filters.from;
      if (filters.to) dateCond.$lte = filters.to;
      queryFilters.date = dateCond;
    }

    const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
    const offset = Math.max(filters.offset ?? 0, 0);
    const direction = filters.sort === "newest" ? "DESC" : "ASC";
    const q = filters.q?.trim();
    const tenantId =
      filters.tenantId !== undefined ? normalizeTenantId(filters.tenantId) : undefined;

    const findOpts: FindOptions = {
      limit,
      offset,
      orderBy: [
        { field: "date", direction },
        { field: "id", direction },
      ],
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(q ? { q } : {}),
    };

    const [rows, total] = await Promise.all([
      this.events.find(queryFilters, findOpts),
      this.events.count(queryFilters, {
        ...(tenantId !== undefined ? { tenantId } : {}),
        ...(q ? { q } : {}),
      }),
    ]);

    return {
      data: rows.map((row) => rowToEvent(row as unknown as Record<string, unknown>)),
      total,
    };
  }

  async getEvent(id: string, tenantId?: string): Promise<TimelineEvent | null> {
    const row = await this.events.findOne(
      id,
      tenantId !== undefined ? { tenantId: normalizeTenantId(tenantId) } : undefined,
    );
    if (!row) return null;
    return rowToEvent(row as unknown as Record<string, unknown>);
  }

  async getStats(tenantId?: string): Promise<TimelineStats> {
    const normalizedTenant =
      tenantId !== undefined ? normalizeTenantId(tenantId) : undefined;
    const groups = await this.events.readGroup({
      groupBy: ["era", "kind"],
      ...(normalizedTenant !== undefined ? { tenantId: normalizedTenant } : {}),
    });

    const byEra: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    let total = 0;
    for (const row of groups) {
      const count = Number(row.count ?? 0);
      total += count;
      const eraKey = String(row.era);
      const kindKey = String(row.kind);
      byEra[eraKey] = (byEra[eraKey] ?? 0) + count;
      byKind[kindKey] = (byKind[kindKey] ?? 0) + count;
    }
    return { total, byEra, byKind };
  }

  async getEras(tenantId?: string): Promise<Era[]> {
    const rows = await this.eras.find(
      { status: "active" },
      tenantId !== undefined ? { tenantId: normalizeTenantId(tenantId) } : undefined,
    );
    return rows
      .map((row) => rowToEra(row as unknown as Record<string, unknown>))
      .sort((a, b) => a.years.localeCompare(b.years));
  }

  async createEvent(
    input: CreateTimelineEventInput,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent> {
    const created = await this.events.create(
      {
        ...input,
        excerpt: input.excerpt ?? "",
        body: input.body ?? "",
        location: input.location ?? "",
        tags: input.tags ?? [],
        sources: input.sources ?? 0,
        notes: input.notes ?? 0,
        image: input.image ?? "hero-witness",
        related: input.related ?? [],
        id: input.id ?? uuidv7(),
      },
      actor,
    );
    return rowToEvent(created as unknown as Record<string, unknown>);
  }

  async updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => key !== "id" && value !== undefined),
    );
    const updated = await this.events.update(id, cleanPatch, actor);
    if (!updated) return null;
    return rowToEvent(updated as unknown as Record<string, unknown>);
  }

  async archiveEvent(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const archived = await this.events.archive(id, actor);
    if (!archived) return null;
    return rowToEvent(archived as unknown as Record<string, unknown>);
  }

  async restoreEvent(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const restored = await this.events.restore(id, actor);
    if (!restored) return null;
    return rowToEvent(restored as unknown as Record<string, unknown>);
  }

  async deleteEvent(id: string, actor: ActorContext = SYSTEM_ACTOR): Promise<TimelineEvent | null> {
    const deleted = await this.events.delete(id, actor);
    if (!deleted) return null;
    return rowToEvent(deleted as unknown as Record<string, unknown>);
  }

  async getEventHistory(id: string): Promise<AuditEntry[]> {
    return this.events.history(id);
  }

  async upsertEra(input: Era, actor: ActorContext = SYSTEM_ACTOR): Promise<Era> {
    const saved = await this.eras.upsert(
      { id: input.id },
      input as unknown as Record<string, unknown>,
      actor,
    );
    return rowToEra(saved as unknown as Record<string, unknown>);
  }
}
