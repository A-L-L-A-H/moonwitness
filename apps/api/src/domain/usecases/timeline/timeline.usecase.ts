import { createActorContext, type ActorContext, type AuditEntry } from "@moonwitness/orm";
import type { TimelineEvent, Era } from "@moonwitness/contracts/types";
import type {
  CreateTimelineEventInput,
  ITimelineRepository,
  TimelineStats,
  UpdateTimelineEventInput,
} from "./timeline.repository";
import type { Result } from "@moonwitness/core";
import { ok, err } from "@moonwitness/core";
import { NotFoundError } from "../../errors";

export interface DomainActor {
  actorId: string | null;
  role?: string;
  source?: ActorContext["source"];
  requestId?: string;
}

const DEFAULT_SYSTEM_ACTOR: DomainActor = {
  actorId: "system",
  role: "system",
  source: "seed",
};

function toOrmActor(actor: DomainActor): ActorContext {
  return createActorContext(actor.actorId, actor.source ?? "api", actor.requestId);
}

export interface ListTimelineEventsRequest {
  era?: string;
  kind?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

export interface ListTimelineEventsResponse {
  data: TimelineEvent[];
  total: number;
}

export interface GetTimelineEventResponse {
  data: TimelineEvent;
}

export interface GetTimelineStatsResponse {
  data: TimelineStats;
}

export interface GetTimelineErasResponse {
  data: Era[];
}

export interface GetTimelineEventHistoryResponse {
  data: AuditEntry[];
}

export interface ITimelineUseCase {
  listEvents(
    request: ListTimelineEventsRequest,
    _actor: DomainActor,
  ): Promise<Result<ListTimelineEventsResponse, Error>>;
  getEvent(id: string, _actor: DomainActor): Promise<Result<GetTimelineEventResponse, Error>>;
  getStats(_actor: DomainActor): Promise<Result<GetTimelineStatsResponse, Error>>;
  getEras(_actor: DomainActor): Promise<Result<GetTimelineErasResponse, Error>>;
  createEvent(
    input: CreateTimelineEventInput,
    actor: DomainActor,
  ): Promise<Result<GetTimelineEventResponse, Error>>;
  updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor: DomainActor,
  ): Promise<Result<GetTimelineEventResponse, Error>>;
  archiveEvent(id: string, actor: DomainActor): Promise<Result<GetTimelineEventResponse, Error>>;
  restoreEvent(id: string, actor: DomainActor): Promise<Result<GetTimelineEventResponse, Error>>;
  deleteEvent(id: string, actor: DomainActor): Promise<Result<GetTimelineEventResponse, Error>>;
  getEventHistory(
    id: string,
    _actor: DomainActor,
  ): Promise<Result<GetTimelineEventHistoryResponse, Error>>;
}

export class TimelineUseCase implements ITimelineUseCase {
  constructor(private readonly repository: ITimelineRepository) {}

  async listEvents(
    request: ListTimelineEventsRequest,
    _actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<ListTimelineEventsResponse, Error>> {
    const [data, total] = await Promise.all([
      this.repository.listEvents(request),
      this.repository.countEvents(request),
    ]);
    return ok({ data, total });
  }

  async getEvent(
    id: string,
    _actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    const event = await this.repository.getEvent(id);
    if (!event) {
      return err(new NotFoundError("TimelineEvent", id));
    }
    return ok({ data: event });
  }

  async getStats(
    _actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineStatsResponse, Error>> {
    const stats = await this.repository.getStats();
    return ok({ data: stats });
  }

  async getEras(
    _actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineErasResponse, Error>> {
    const eras = await this.repository.getEras();
    return ok({ data: eras });
  }

  async createEvent(
    input: CreateTimelineEventInput,
    actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    try {
      const created = await this.repository.createEvent(
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
        },
        toOrmActor(actor),
      );
      return ok({ data: created });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async updateEvent(
    id: string,
    patch: UpdateTimelineEventInput,
    actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    try {
      const updated = await this.repository.updateEvent(id, patch, toOrmActor(actor));
      if (!updated) {
        return err(new NotFoundError("TimelineEvent", id));
      }
      return ok({ data: updated });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async archiveEvent(
    id: string,
    actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    try {
      const archived = await this.repository.archiveEvent(id, toOrmActor(actor));
      if (!archived) {
        return err(new NotFoundError("TimelineEvent", id));
      }
      return ok({ data: archived });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async restoreEvent(
    id: string,
    actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    try {
      const restored = await this.repository.restoreEvent(id, toOrmActor(actor));
      if (!restored) {
        return err(new NotFoundError("TimelineEvent", id));
      }
      return ok({ data: restored });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async deleteEvent(
    id: string,
    actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventResponse, Error>> {
    try {
      const deleted = await this.repository.deleteEvent(id, toOrmActor(actor));
      if (!deleted) {
        return err(new NotFoundError("TimelineEvent", id));
      }
      return ok({ data: deleted });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getEventHistory(
    id: string,
    _actor: DomainActor = DEFAULT_SYSTEM_ACTOR,
  ): Promise<Result<GetTimelineEventHistoryResponse, Error>> {
    try {
      const data = await this.repository.getEventHistory(id);
      return ok({ data });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
