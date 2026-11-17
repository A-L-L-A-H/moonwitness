import { createActorContext, type Migration } from "@moonwitness/orm";
import type { Era, TimelineEvent } from "@moonwitness/types";
import type {
  ITimelineRepository,
  TimelineFilters,
  TimelineStats,
} from "../../domain/usecases/timeline/timeline.repository";
import { opsEventModel, opsEventMigrations } from "../persistence/domain/ops-events";

function toTimelineEvent(row: any): TimelineEvent {
  const tags = row.tags_json ? JSON.parse(row.tags_json) : [];
  const related = row.related_json ? JSON.parse(row.related_json) : [];
  return {
    id: String(row.event_key ?? row.id),
    kind: (row.kind ?? "PROJECT") as any,
    date: String(row.date ?? ""),
    era: (row.era ?? "origins") as any,
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    location: String(row.location ?? ""),
    tags: Array.isArray(tags) ? tags : [],
    sources: Number(row.sources_count ?? 0),
    notes: Number(row.notes_count ?? 0),
    image: (row.image_key ?? "hero-witness") as any,
    ...(row.image_position ? { imagePosition: String(row.image_position) } : {}),
    related: Array.isArray(related) ? related : [],
  };
}

export class OrmEventRepository implements ITimelineRepository {
  async upsertEvent(event: TimelineEvent): Promise<void> {
    const actor = createActorContext(null, "api");
    const existing = await opsEventModel.repository.find({ event_key: event.id });
    const payload = {
      event_key: event.id,
      kind: event.kind,
      era: event.era ?? null,
      date: event.date ?? null,
      title: event.title,
      excerpt: event.excerpt ?? null,
      body: event.body ?? null,
      location: event.location ?? null,
      tags_json: JSON.stringify(event.tags ?? []),
      sources_count: Number(event.sources ?? 0),
      notes_count: Number(event.notes ?? 0),
      image_key: event.image ?? null,
      image_position: (event as any).imagePosition ?? null,
      related_json: JSON.stringify(event.related ?? []),
      payload_json: JSON.stringify(event),
    } as any;
    if (existing[0]) {
      await opsEventModel.repository.update(existing[0].id, payload, actor);
    } else {
      await opsEventModel.repository.create(payload, actor);
    }
  }

  async listEvents(filters: TimelineFilters): Promise<TimelineEvent[]> {
    const where: Record<string, unknown> = {};
    if (filters.era) where.era = filters.era;
    if (filters.kind) where.kind = filters.kind;
    // basic fetch; apply complex filters in-memory for parity with prior repo
    const rows = await opsEventModel.repository.find(
      where as any,
      {
        orderBy: "date",
        direction: filters.sort === "newest" ? "DESC" : "ASC",
      } as any,
    );
    let events = rows.map(toTimelineEvent);
    if (filters.from) events = events.filter((e) => e.date >= filters.from!);
    if (filters.to) events = events.filter((e) => e.date <= filters.to!);
    if (filters.q?.trim()) {
      const q = filters.q.trim().toLowerCase();
      events = events.filter((e) =>
        `${e.title} ${e.excerpt} ${e.body} ${e.location} ${(e.tags || []).join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    }
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? events.length;
    events.sort((a, b) =>
      filters.sort === "newest"
        ? b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
        : a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    );
    return events.slice(offset, offset + limit);
  }

  async countEvents(filters: TimelineFilters): Promise<number> {
    const listed = await this.listEvents({ ...filters, limit: 100000, offset: 0 });
    return listed.length;
  }

  async getEvent(id: string): Promise<TimelineEvent | null> {
    const rows = await opsEventModel.repository.find({ event_key: id } as any);
    return rows[0] ? toTimelineEvent(rows[0]) : null;
  }

  async getStats(): Promise<TimelineStats> {
    const rows = await opsEventModel.repository.find();
    const events = rows.map(toTimelineEvent);
    const byEra: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    for (const e of events) {
      byEra[e.era] = (byEra[e.era] || 0) + 1;
      byKind[e.kind] = (byKind[e.kind] || 0) + 1;
    }
    return { total: events.length, byEra, byKind };
  }

  async getEras(): Promise<Era[]> {
    // eras remain in timeline_eras addon table; fall back to empty if not seeded
    try {
      const { timelineEraModel } = await import("../persistence/timeline-model");
      const rows = await timelineEraModel.repository.find();
      return rows.map((r: any) => ({
        id: r.id as any,
        name: String(r.name ?? r.id),
        years: String(r.years ?? ""),
        tagline: String(r.tagline ?? ""),
        color: String(r.color ?? "#888"),
      }));
    } catch {
      return [];
    }
  }
}

export const ormEventMigrations: Migration[] = [...opsEventMigrations];
