import {
  createActorContext,
  type ActorContext,
  type AuditEntry,
  type ModelRecord,
} from "@moonwitness/orm";
import type { Era, TimelineEvent } from "@moonwitness/contracts/types";
import type {
  CreateTimelineEventInput,
  ITimelineRepository,
  TimelineFilters,
  TimelineStats,
  UpdateTimelineEventInput,
} from "../../domain/usecases/timeline/timeline.repository";
import { opsEventModel } from "../persistence/domain/ops-events";

function toTimelineEvent(row: ModelRecord<typeof opsEventModel.schema>): TimelineEvent {
  const tags: unknown =
    typeof row.tags_json === "string" && row.tags_json ? JSON.parse(row.tags_json) : [];
  const related: unknown =
    typeof row.related_json === "string" && row.related_json ? JSON.parse(row.related_json) : [];
  return {
    id: String(row.event_key ?? row.id),
    kind: (row.kind ?? "PROJECT") as TimelineEvent["kind"],
    date: String(row.date ?? ""),
    era: (row.era ?? "origins") as TimelineEvent["era"],
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    location: String(row.location ?? ""),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    sources: Number(row.sources_count ?? 0),
    notes: Number(row.notes_count ?? 0),
    image: (row.image_key ?? "hero-witness") as TimelineEvent["image"],
    ...(row.image_position ? { imagePosition: String(row.image_position) } : {}),
    related: Array.isArray(related) ? related.map(String) : [],
  };
}

export class OrmEventRepository implements ITimelineRepository {
  async upsertEvent(event: TimelineEvent): Promise<void> {
    const actor = createActorContext(null, "api");
    const existing = await opsEventModel.repository.find({ event_key: event.id });
    const eventWithPosition = event as TimelineEvent & { imagePosition?: string };
    const payload: Record<string, unknown> = {
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
      image_position: eventWithPosition.imagePosition ?? null,
      related_json: JSON.stringify(event.related ?? []),
      payload_json: JSON.stringify(event),
    };
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
    const rows = await opsEventModel.repository.find(where);
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
    const rows = await opsEventModel.repository.find({ event_key: id });
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
      const { timelineEraModel } = await import("@moonwitness/addon-timeline");
      const rows = await timelineEraModel.repository.find();
      return rows.map((row) => ({
        id: row.id as Era["id"],
        name: String(row.name ?? row.id),
        years: String(row.years ?? ""),
        tagline: String(row.tagline ?? ""),
        color: String(row.color ?? "#888"),
      }));
    } catch {
      return [];
    }
  }

  async createEvent(
    input: CreateTimelineEventInput,
    actor: ActorContext = createActorContext(null, "api"),
  ): Promise<TimelineEvent> {
    const eventKey = input.id ?? `evt-${Date.now()}`;
    const eventRecord: TimelineEvent = {
      id: eventKey,
      kind: input.kind,
      date: input.date,
      era: input.era,
      title: input.title,
      excerpt: input.excerpt ?? "",
      body: input.body ?? "",
      location: input.location ?? "",
      tags: input.tags ?? [],
      sources: input.sources ?? 0,
      notes: input.notes ?? 0,
      image: input.image ?? "hero-witness",
      ...(input.imagePosition ? { imagePosition: input.imagePosition } : {}),
      related: input.related ?? [],
    };
    const created = await opsEventModel.repository.create(
      {
        event_key: eventRecord.id,
        kind: eventRecord.kind,
        era: eventRecord.era,
        date: eventRecord.date,
        title: eventRecord.title,
        excerpt: eventRecord.excerpt,
        body: eventRecord.body,
        location: eventRecord.location,
        tags_json: JSON.stringify(eventRecord.tags),
        sources_count: eventRecord.sources,
        notes_count: eventRecord.notes,
        image_key: eventRecord.image,
        image_position: eventRecord.imagePosition ?? null,
        related_json: JSON.stringify(eventRecord.related),
        payload_json: JSON.stringify(eventRecord),
      },
      actor,
    );
    return toTimelineEvent(created);
  }

  async updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor: ActorContext = createActorContext(null, "api"),
  ): Promise<TimelineEvent | null> {
    const rows = await opsEventModel.repository.find({ event_key: id });
    const row = rows[0];
    if (!row) return null;
    const current = toTimelineEvent(row);
    const nextEvent: TimelineEvent = {
      ...current,
      ...patch,
      id: current.id,
      tags: patch.tags ?? current.tags,
      related: patch.related ?? current.related,
    };
    const updated = await opsEventModel.repository.update(
      row.id,
      {
        kind: nextEvent.kind,
        era: nextEvent.era,
        date: nextEvent.date,
        title: nextEvent.title,
        excerpt: nextEvent.excerpt,
        body: nextEvent.body,
        location: nextEvent.location,
        tags_json: JSON.stringify(nextEvent.tags),
        sources_count: nextEvent.sources,
        notes_count: nextEvent.notes,
        image_key: nextEvent.image,
        image_position: nextEvent.imagePosition ?? null,
        related_json: JSON.stringify(nextEvent.related),
        payload_json: JSON.stringify(nextEvent),
      },
      actor,
    );
    return updated ? toTimelineEvent(updated) : null;
  }

  async archiveEvent(
    id: string,
    actor: ActorContext = createActorContext(null, "api"),
  ): Promise<TimelineEvent | null> {
    const rows = await opsEventModel.repository.find({ event_key: id });
    if (!rows[0]) return null;
    const archived = await opsEventModel.repository.archive(rows[0].id, actor);
    return archived ? toTimelineEvent(archived) : null;
  }

  async restoreEvent(
    id: string,
    actor: ActorContext = createActorContext(null, "api"),
  ): Promise<TimelineEvent | null> {
    const rows = await opsEventModel.repository.find({ event_key: id }, { includeDeleted: true });
    if (!rows[0]) return null;
    const restored = await opsEventModel.repository.restore(rows[0].id, actor);
    return restored ? toTimelineEvent(restored) : null;
  }

  async deleteEvent(
    id: string,
    actor: ActorContext = createActorContext(null, "api"),
  ): Promise<TimelineEvent | null> {
    const rows = await opsEventModel.repository.find({ event_key: id });
    if (!rows[0]) return null;
    const deleted = await opsEventModel.repository.delete(rows[0].id, actor);
    return deleted ? toTimelineEvent(deleted) : null;
  }

  async getEventHistory(id: string): Promise<AuditEntry[]> {
    const rows = await opsEventModel.repository.find({ event_key: id }, { includeDeleted: true });
    if (!rows[0]) return [];
    return opsEventModel.repository.history(rows[0].id);
  }
}
