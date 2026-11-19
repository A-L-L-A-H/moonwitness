import type { FastifyInstance, FastifyReply } from "fastify";
import { ConflictError } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import {
  TimelineRepository,
  type CreateTimelineEventInput,
  type ITimelineRepository,
  type TimelineFilters,
  type UpdateTimelineEventInput,
} from "./repository.js";
import {
  createTimelineEventBodySchema,
  eraResponseSchema,
  errorResponseSchema,
  listTimelineQuerySchema,
  paramIdSchema,
  timelineEventHistoryResponseSchema,
  timelineEventListResponseSchema,
  timelineEventResponseSchema,
  timelineStatsResponseSchema,
  updateTimelineEventBodySchema,
} from "./schemas.js";

export interface TimelineRouteOptions {
  auth?: BaseAddonAuthBridge;
  repository?: ITimelineRepository;
}

function sendTimelineError(error: unknown, reply: FastifyReply): FastifyReply {
  if (error instanceof ConflictError) {
    return reply.code(409).send({ error: error.message });
  }
  const errObj = error as Error & { code?: string; name?: string };
  const status =
    errObj?.code === "NOT_FOUND_ERROR"
      ? 404
      : errObj?.name === "ConflictError" || errObj?.code === "CONFLICT"
        ? 409
        : errObj?.name === "ZodError" || errObj?.name === "ValidationError"
          ? 400
          : 500;
  return reply.code(status).send({ error: errObj?.message ?? "Internal Server Error" });
}

export async function registerTimelineRoutes(
  fastify: FastifyInstance,
  options: TimelineRouteOptions = {},
): Promise<void> {
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const repository = options.repository ?? new TimelineRepository();

  if (auth.optionalAuthenticate) {
    fastify.addHook("preHandler", auth.optionalAuthenticate);
  }

  fastify.get<{ Querystring: TimelineFilters }>(
    "/events",
    {
      schema: {
        querystring: listTimelineQuerySchema,
        response: {
          200: timelineEventListResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        return await repository.listEvents({ ...request.query, tenantId });
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/events/:id",
    {
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const event = await repository.getEvent(request.params.id, tenantId);
        if (!event) {
          return reply
            .code(404)
            .send({ error: `TimelineEvent with id '${request.params.id}' not found` });
        }
        return { data: event };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.get(
    "/stats",
    {
      schema: {
        response: {
          200: timelineStatsResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const data = await repository.getStats(tenantId);
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.get(
    "/eras",
    {
      schema: {
        response: {
          200: eraResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const data = await repository.getEras(tenantId);
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.post<{ Body: CreateTimelineEventInput }>(
    "/events",
    {
      preHandler: [auth.authenticate, auth.requireRole("admin", "editor")],
      schema: {
        body: createTimelineEventBodySchema,
        response: {
          201: timelineEventResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const data = await repository.createEvent(request.body, actor);
        return reply.code(201).send({ data });
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.patch<{ Params: { id: string }; Body: UpdateTimelineEventInput }>(
    "/events/:id",
    {
      preHandler: [auth.authenticate, auth.requireRole("admin", "editor")],
      schema: {
        params: paramIdSchema,
        body: updateTimelineEventBodySchema,
        response: {
          200: timelineEventResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const data = await repository.updateEvent(request.params.id, request.body, actor);
        if (!data) {
          return reply
            .code(404)
            .send({ error: `TimelineEvent with id '${request.params.id}' not found` });
        }
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.post<{ Params: { id: string } }>(
    "/events/:id/archive",
    {
      preHandler: [auth.authenticate, auth.requireRole("admin", "editor")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const data = await repository.archiveEvent(request.params.id, actor);
        if (!data) {
          return reply
            .code(404)
            .send({ error: `TimelineEvent with id '${request.params.id}' not found` });
        }
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.post<{ Params: { id: string } }>(
    "/events/:id/restore",
    {
      preHandler: [auth.authenticate, auth.requireRole("admin", "editor")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const data = await repository.restoreEvent(request.params.id, actor);
        if (!data) {
          return reply
            .code(404)
            .send({ error: `TimelineEvent with id '${request.params.id}' not found` });
        }
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/events/:id",
    {
      preHandler: [auth.authenticate, auth.requireRole("admin")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const actor = resolveActorContextFromBridge(auth, request);
        const data = await repository.deleteEvent(request.params.id, actor);
        if (!data) {
          return reply
            .code(404)
            .send({ error: `TimelineEvent with id '${request.params.id}' not found` });
        }
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/events/:id/history",
    {
      preHandler: auth.authenticate,
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventHistoryResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const data = await repository.getEventHistory(request.params.id);
        return { data };
      } catch (error) {
        return sendTimelineError(error, reply);
      }
    },
  );
}
