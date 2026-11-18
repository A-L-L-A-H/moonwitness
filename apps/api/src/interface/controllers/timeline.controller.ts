import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  ITimelineUseCase,
  ListTimelineEventsRequest,
} from "../../domain/usecases/timeline/timeline.usecase";
import type {
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
} from "../../domain/usecases/timeline/timeline.repository";
import type { Result } from "@moonwitness/core";
import type { ApiError } from "@moonwitness/contracts";
import { createActorContext, SYSTEM_ACTOR } from "@moonwitness/orm";
import type { ActorContext } from "@moonwitness/orm";
import { tryRecordAuditLog } from "../../infrastructure/audit/audit-log";

/**
 * Timeline endpoints.
 *
 * Actor identity is resolved from verified session/JWT auth only — never from
 * untrusted headers like `x-actor-id`.
 */
export class TimelineController {
  constructor(private readonly _timelineUseCase: ITimelineUseCase) {}

  private actor(request: FastifyRequest): ActorContext {
    if (request.user) {
      return createActorContext(String(request.user.id), "api", request.id);
    }
    return SYSTEM_ACTOR;
  }

  async listEvents(
    request: FastifyRequest<{ Querystring: ListTimelineEventsRequest }>,
    reply: FastifyReply,
  ) {
    const result = await this._timelineUseCase.listEvents(request.query, this.actor(request));
    return this.handleResult(result, reply);
  }

  async getEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this._timelineUseCase.getEvent(request.params.id, this.actor(request));
    return this.handleResult(result, reply);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const result = await this._timelineUseCase.getStats(this.actor(request));
    return this.handleResult(result, reply);
  }

  async getEras(request: FastifyRequest, reply: FastifyReply) {
    const result = await this._timelineUseCase.getEras(this.actor(request));
    return this.handleResult(result, reply);
  }

  async createEvent(
    request: FastifyRequest<{ Body: CreateTimelineEventInput }>,
    reply: FastifyReply,
  ) {
    const actor = this.actor(request);
    const result = await this._timelineUseCase.createEvent(request.body, actor);
    if (result.ok) {
      await tryRecordAuditLog({
        domain: "timeline",
        entity: "timeline.event",
        entityId: result.value.data.id,
        action: "CREATE",
        actor,
        actorRole: request.user?.role ?? null,
        requestPath: request.url,
        outcome: "success",
        after: result.value.data,
      });
    }
    return this.handleResult(result, reply, 201);
  }

  async updateEvent(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateTimelineEventInput }>,
    reply: FastifyReply,
  ) {
    const actor = this.actor(request);
    const result = await this._timelineUseCase.updateEvent(request.params.id, request.body, actor);
    if (result.ok) {
      await tryRecordAuditLog({
        domain: "timeline",
        entity: "timeline.event",
        entityId: result.value.data.id,
        action: "UPDATE",
        actor,
        actorRole: request.user?.role ?? null,
        requestPath: request.url,
        outcome: "success",
        after: result.value.data,
      });
    }
    return this.handleResult(result, reply);
  }

  async archiveEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const actor = this.actor(request);
    const result = await this._timelineUseCase.archiveEvent(request.params.id, actor);
    if (result.ok) {
      await tryRecordAuditLog({
        domain: "timeline",
        entity: "timeline.event",
        entityId: result.value.data.id,
        action: "ARCHIVE",
        actor,
        actorRole: request.user?.role ?? null,
        requestPath: request.url,
        outcome: "success",
        after: result.value.data,
      });
    }
    return this.handleResult(result, reply);
  }

  async restoreEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const actor = this.actor(request);
    const result = await this._timelineUseCase.restoreEvent(request.params.id, actor);
    if (result.ok) {
      await tryRecordAuditLog({
        domain: "timeline",
        entity: "timeline.event",
        entityId: result.value.data.id,
        action: "RESTORE",
        actor,
        actorRole: request.user?.role ?? null,
        requestPath: request.url,
        outcome: "success",
        after: result.value.data,
      });
    }
    return this.handleResult(result, reply);
  }

  async deleteEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const actor = this.actor(request);
    const result = await this._timelineUseCase.deleteEvent(request.params.id, actor);
    if (result.ok) {
      await tryRecordAuditLog({
        domain: "timeline",
        entity: "timeline.event",
        entityId: result.value.data.id,
        action: "DELETE",
        actor,
        actorRole: request.user?.role ?? null,
        requestPath: request.url,
        outcome: "success",
        before: result.value.data,
      });
    }
    return this.handleResult(result, reply);
  }

  async getEventHistory(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this._timelineUseCase.getEventHistory(
      request.params.id,
      this.actor(request),
    );
    return this.handleResult(result, reply);
  }

  private handleResult<T>(
    result: Result<T, Error>,
    reply: FastifyReply,
    successCode = 200,
  ): FastifyReply {
    if (result.ok) {
      return reply.code(successCode).send(result.value);
    }

    const errObj = result.error as Error & { code?: string; name?: string };
    const status =
      errObj.code === "NOT_FOUND_ERROR"
        ? 404
        : errObj.name === "ConflictError" || errObj.code === "CONFLICT"
          ? 409
          : errObj.name === "ZodError" || errObj.name === "ValidationError"
            ? 400
            : 500;

    const errorBody: ApiError = {
      error: result.error.message,
      ...(errObj.code ? { code: errObj.code } : {}),
    };
    return reply.code(status).send(errorBody);
  }
}
