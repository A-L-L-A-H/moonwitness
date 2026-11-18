import type { TimelineEvent, Era } from "@moonwitness/types";
import type { TimelineStats } from "./timeline.repository";
import type { Result } from "@moonwitness/core";
import { ok, err } from "@moonwitness/core";
import { NotFoundError } from "../../errors";

export interface DomainActor {
  actorId: string | null;
  role?: string;
}

const DEFAULT_SYSTEM_ACTOR: DomainActor = {
  actorId: "system",
  role: "system",
};

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

export interface ITimelineUseCase {
  listEvents(
    request: ListTimelineEventsRequest,
    _actor: DomainActor,
  ): Promise<Result<ListTimelineEventsResponse, Error>>;
  getEvent(id: string, _actor: DomainActor): Promise<Result<GetTimelineEventResponse, Error>>;
  getStats(_actor: DomainActor): Promise<Result<GetTimelineStatsResponse, Error>>;
  getEras(_actor: DomainActor): Promise<Result<GetTimelineErasResponse, Error>>;
}

export class TimelineUseCase implements ITimelineUseCase {
  constructor(private readonly repository: import("./timeline.repository").ITimelineRepository) {}

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
}
