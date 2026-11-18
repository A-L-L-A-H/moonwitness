import type { ActorContext, AuditEntry } from "@moonwitness/orm";
import type { TimelineEvent, Era } from "@moonwitness/types";

export interface TimelineFilters {
  era?: string;
  kind?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

export interface TimelineStats {
  total: number;
  byEra: Record<string, number>;
  byKind: Record<string, number>;
}

export interface CreateTimelineEventInput {
  id?: string;
  kind: TimelineEvent["kind"];
  date: string;
  era: TimelineEvent["era"];
  title: string;
  excerpt?: string;
  body?: string;
  location?: string;
  tags?: string[];
  sources?: number;
  notes?: number;
  image?: TimelineEvent["image"];
  imagePosition?: string;
  related?: string[];
}

export type UpdateTimelineEventInput = Partial<Omit<TimelineEvent, "id">> & {
  version?: number;
};

export interface ITimelineRepository {
  listEvents(_filters: TimelineFilters): Promise<TimelineEvent[]>;
  countEvents(_filters: TimelineFilters): Promise<number>;
  getEvent(_id: string): Promise<TimelineEvent | null>;
  getStats(): Promise<TimelineStats>;
  getEras(): Promise<Era[]>;
  createEvent(_input: CreateTimelineEventInput, _actor?: ActorContext): Promise<TimelineEvent>;
  updateEvent(
    _id: string,
    _patch: UpdateTimelineEventInput,
    _actor?: ActorContext,
  ): Promise<TimelineEvent | null>;
  archiveEvent(_id: string, _actor?: ActorContext): Promise<TimelineEvent | null>;
  restoreEvent(_id: string, _actor?: ActorContext): Promise<TimelineEvent | null>;
  deleteEvent(_id: string, _actor?: ActorContext): Promise<TimelineEvent | null>;
  getEventHistory(_id: string): Promise<AuditEntry[]>;
}
