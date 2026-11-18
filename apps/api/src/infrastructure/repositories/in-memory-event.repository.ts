import { SYSTEM_ACTOR, uuidv7, type ActorContext, type AuditEntry } from "@moonwitness/orm";
import type {
  CreateTimelineEventInput,
  ITimelineRepository,
  TimelineFilters,
  TimelineStats,
  UpdateTimelineEventInput,
} from "../../domain/usecases/timeline/timeline.repository";
import type { TimelineEvent, Era } from "@moonwitness/types";

export interface IEventDataSource {
  listEvents(_filters: TimelineFilters): Promise<TimelineEvent[]>;
  countEvents(_filters: TimelineFilters): Promise<number>;
  getEvent(_id: string): Promise<TimelineEvent | null>;
  getStats(): Promise<TimelineStats>;
  getEras(): Promise<Era[]>;
}

export class EventDataSource implements IEventDataSource {
  constructor(private readonly repository: ITimelineRepository) {}

  async listEvents(filters: TimelineFilters): Promise<TimelineEvent[]> {
    return this.repository.listEvents(filters);
  }

  async countEvents(filters: TimelineFilters): Promise<number> {
    return this.repository.countEvents(filters);
  }

  async getEvent(id: string): Promise<TimelineEvent | null> {
    return this.repository.getEvent(id);
  }

  async getStats(): Promise<TimelineStats> {
    return this.repository.getStats();
  }

  async getEras(): Promise<Era[]> {
    return this.repository.getEras();
  }
}

export class InMemoryEventRepository implements ITimelineRepository {
  private events: TimelineEvent[] = [];
  private eras: Era[] = [];
  private archivedIds = new Set<string>();
  private historyEntries: AuditEntry[] = [];

  private recordAudit(
    entityId: string,
    action: AuditEntry["action"],
    actor: ActorContext,
    diff: unknown,
  ): void {
    this.historyEntries.push({
      id: uuidv7(),
      model: "timeline.event",
      entity_id: entityId,
      action,
      changed_by: actor.actorId,
      changed_at: new Date().toISOString(),
      diff: JSON.stringify(diff),
      entity_version: 1,
      source: actor.source,
      request_id: actor.requestId ?? null,
    });
  }

  setEvents(events: TimelineEvent[]): void {
    this.events = events;
  }

  setEras(eras: Era[]): void {
    this.eras = eras;
  }

  async listEvents(filters: TimelineFilters): Promise<TimelineEvent[]> {
    let result = [...this.events];

    if (filters.era) {
      result = result.filter((e) => e.era === filters.era);
    }
    if (filters.kind) {
      result = result.filter((e) => e.kind === filters.kind);
    }
    if (filters.from) {
      result = result.filter((e) => e.date >= filters.from!);
    }
    if (filters.to) {
      result = result.filter((e) => e.date <= filters.to!);
    }
    if (filters.q?.trim()) {
      const query = filters.q.trim().toLowerCase();
      result = result.filter((event) =>
        `${event.title} ${event.excerpt} ${event.body} ${event.location} ${event.tags.join(" ")}`
          .toLowerCase()
          .includes(query),
      );
    }

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? result.length;
    result.sort((left, right) =>
      filters.sort === "newest"
        ? right.date.localeCompare(left.date) || right.id.localeCompare(left.id)
        : left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
    );
    return result.slice(offset, offset + limit);
  }

  async countEvents(filters: TimelineFilters): Promise<number> {
    let result = [...this.events];

    if (filters.era) {
      result = result.filter((e) => e.era === filters.era);
    }
    if (filters.kind) {
      result = result.filter((e) => e.kind === filters.kind);
    }
    if (filters.from) {
      result = result.filter((e) => e.date >= filters.from!);
    }
    if (filters.to) {
      result = result.filter((e) => e.date <= filters.to!);
    }
    if (filters.q?.trim()) {
      const query = filters.q.trim().toLowerCase();
      result = result.filter((event) =>
        `${event.title} ${event.excerpt} ${event.body} ${event.location} ${event.tags.join(" ")}`
          .toLowerCase()
          .includes(query),
      );
    }

    return result.length;
  }

  async getEvent(id: string): Promise<TimelineEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async getStats(): Promise<TimelineStats> {
    const byEra: Record<string, number> = {};
    const byKind: Record<string, number> = {};

    for (const event of this.events) {
      byEra[event.era] = (byEra[event.era] || 0) + 1;
      byKind[event.kind] = (byKind[event.kind] || 0) + 1;
    }

    return {
      total: this.events.length,
      byEra,
      byKind,
    };
  }

  async getEras(): Promise<Era[]> {
    return this.eras;
  }

  async createEvent(
    input: CreateTimelineEventInput,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent> {
    const created: TimelineEvent = {
      id: input.id ?? uuidv7(),
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
    this.events.push(created);
    this.recordAudit(created.id, "CREATE", actor, { after: created });
    return created;
  }

  async updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return null;
    const before = this.events[index]!;
    const updated: TimelineEvent = {
      ...before,
      ...patch,
      id: before.id,
      tags: patch.tags ?? before.tags,
      related: patch.related ?? before.related,
    };
    this.events[index] = updated;
    this.recordAudit(id, "UPDATE", actor, { before, after: updated });
    return updated;
  }

  async archiveEvent(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const found = this.events.find((e) => e.id === id) ?? null;
    if (!found) return null;
    this.archivedIds.add(id);
    this.recordAudit(id, "ARCHIVE", actor, { before: found, after: found });
    return found;
  }

  async restoreEvent(
    id: string,
    actor: ActorContext = SYSTEM_ACTOR,
  ): Promise<TimelineEvent | null> {
    const found = this.events.find((e) => e.id === id) ?? null;
    if (!found) return null;
    this.archivedIds.delete(id);
    this.recordAudit(id, "RESTORE", actor, { before: found, after: found });
    return found;
  }

  async deleteEvent(id: string, actor: ActorContext = SYSTEM_ACTOR): Promise<TimelineEvent | null> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return null;
    const [removed] = this.events.splice(index, 1);
    this.recordAudit(id, "DELETE", actor, { before: removed });
    return removed ?? null;
  }

  async getEventHistory(id: string): Promise<AuditEntry[]> {
    return this.historyEntries.filter((entry) => entry.entity_id === id);
  }
}
