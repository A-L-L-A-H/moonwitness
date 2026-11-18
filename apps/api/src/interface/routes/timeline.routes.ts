import type { FastifyInstance } from "fastify";
import { TimelineController } from "../controllers/timeline.controller";
import type { ListTimelineEventsRequest } from "../../domain/usecases/timeline/timeline.usecase";
import type {
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
} from "../../domain/usecases/timeline/timeline.repository";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import {
  createTimelineEventBodySchema,
  listTimelineQuerySchema,
  timelineEventHistoryResponseSchema,
  timelineEventListResponseSchema,
  timelineEventResponseSchema,
  timelineStatsResponseSchema,
  updateTimelineEventBodySchema,
  eraResponseSchema,
  errorResponseSchema,
  paramIdSchema,
} from "./schemas";

export async function timelineRoutes(fastify: FastifyInstance) {
  const controller = new TimelineController(fastify.timelineUseCase);
  fastify.addHook("preHandler", optionalAuth());

  fastify.get<{ Querystring: ListTimelineEventsRequest }>(
    "/events",
    {
      schema: {
        querystring: listTimelineQuerySchema,
        response: {
          200: timelineEventListResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "List timeline events",
        description: "Retrieve a paginated list of timeline events with optional filters",
      },
    },
    (request, reply) => controller.listEvents(request, reply),
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
        tags: ["timeline"],
        summary: "Get timeline event by ID",
        description: "Retrieve a single timeline event by its ID",
      },
    },
    (request, reply) => controller.getEvent(request, reply),
  );

  fastify.get(
    "/stats",
    {
      schema: {
        response: {
          200: timelineStatsResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "Get timeline statistics",
        description: "Retrieve aggregate statistics about timeline events",
      },
    },
    (request, reply) => controller.getStats(request, reply),
  );

  fastify.get(
    "/eras",
    {
      schema: {
        response: {
          200: eraResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "List eras",
        description: "Retrieve all available eras",
      },
    },
    (request, reply) => controller.getEras(request, reply),
  );

  fastify.post<{ Body: CreateTimelineEventInput }>(
    "/events",
    {
      preHandler: [requireAuth(), requireRole("admin", "editor")],
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
        tags: ["timeline"],
        summary: "Create timeline event",
      },
    },
    (request, reply) => controller.createEvent(request, reply),
  );

  fastify.patch<{ Params: { id: string }; Body: UpdateTimelineEventInput }>(
    "/events/:id",
    {
      preHandler: [requireAuth(), requireRole("admin", "editor")],
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
        tags: ["timeline"],
        summary: "Update timeline event",
      },
    },
    (request, reply) => controller.updateEvent(request, reply),
  );

  fastify.post<{ Params: { id: string } }>(
    "/events/:id/archive",
    {
      preHandler: [requireAuth(), requireRole("admin", "editor")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "Archive timeline event",
      },
    },
    (request, reply) => controller.archiveEvent(request, reply),
  );

  fastify.post<{ Params: { id: string } }>(
    "/events/:id/restore",
    {
      preHandler: [requireAuth(), requireRole("admin", "editor")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "Restore archived or deleted timeline event",
      },
    },
    (request, reply) => controller.restoreEvent(request, reply),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/events/:id",
    {
      preHandler: [requireAuth(), requireRole("admin")],
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "Soft-delete timeline event (admin only)",
      },
    },
    (request, reply) => controller.deleteEvent(request, reply),
  );

  fastify.get<{ Params: { id: string } }>(
    "/events/:id/history",
    {
      preHandler: requireAuth(),
      schema: {
        params: paramIdSchema,
        response: {
          200: timelineEventHistoryResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema,
        },
        tags: ["timeline"],
        summary: "Get audit history for timeline event",
      },
    },
    (request, reply) => controller.getEventHistory(request, reply),
  );
}
