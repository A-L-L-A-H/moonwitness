import { z } from "zod";
import {
  ArtKeySchema,
  EraIdSchema,
  EraSchema,
  EventKindSchema,
  TimelineEventSchema,
} from "@moonwitness/schema/timeline";

/** Canonical error envelope shared by every API operation. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Query filters for listing timeline events. Validated at the boundary. */
export const TimelineListQuerySchema = z
  .object({
    era: z.string().min(1).optional(),
    kind: z.string().min(1).optional(),
    from: z.string().min(1).optional(),
    to: z.string().min(1).optional(),
    q: z.string().trim().max(200).optional(),
    sort: z.enum(["newest", "oldest"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  })
  .strict();
export type TimelineListQuery = z.infer<typeof TimelineListQuerySchema>;

export const TimelineListResponseSchema = z.object({
  data: z.array(TimelineEventSchema),
  total: z.number().int().nonnegative(),
});
export type TimelineListResponse = z.infer<typeof TimelineListResponseSchema>;

export const TimelineEventResponseSchema = z.object({
  data: TimelineEventSchema,
});
export type TimelineEventResponse = z.infer<typeof TimelineEventResponseSchema>;

export const TimelineStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byEra: z.record(z.string(), z.number().int().nonnegative()),
  byKind: z.record(z.string(), z.number().int().nonnegative()),
});
export type TimelineStats = z.infer<typeof TimelineStatsSchema>;

export const TimelineStatsResponseSchema = z.object({
  data: TimelineStatsSchema,
});
export type TimelineStatsResponse = z.infer<typeof TimelineStatsResponseSchema>;

export const TimelineErasResponseSchema = z.object({
  data: z.array(EraSchema),
});
export type TimelineErasResponse = z.infer<typeof TimelineErasResponseSchema>;

export const CreateEventBodySchema = z
  .object({
    id: z.string().min(1).max(120).optional(),
    kind: EventKindSchema,
    date: z.string().min(1).max(40),
    era: EraIdSchema,
    title: z.string().min(1).max(200),
    excerpt: z.string().max(1000).default(""),
    body: z.string().default(""),
    location: z.string().max(200).default(""),
    tags: z.array(z.string()).default([]),
    sources: z.number().int().nonnegative().default(0),
    notes: z.number().int().nonnegative().default(0),
    image: ArtKeySchema.default("hero-witness"),
    imagePosition: z.string().max(80).optional(),
    related: z.array(z.string()).default([]),
  })
  .strict();
export type CreateEventBody = z.infer<typeof CreateEventBodySchema>;

export const UpdateEventBodySchema = z
  .object({
    kind: EventKindSchema.optional(),
    date: z.string().min(1).max(40).optional(),
    era: EraIdSchema.optional(),
    title: z.string().min(1).max(200).optional(),
    excerpt: z.string().max(1000).optional(),
    body: z.string().optional(),
    location: z.string().max(200).optional(),
    tags: z.array(z.string()).optional(),
    sources: z.number().int().nonnegative().optional(),
    notes: z.number().int().nonnegative().optional(),
    image: ArtKeySchema.optional(),
    imagePosition: z.string().max(80).optional(),
    related: z.array(z.string()).optional(),
    version: z.number().int().positive().optional(),
  })
  .strict();
export type UpdateEventBody = z.infer<typeof UpdateEventBodySchema>;

export const EventMutationResponseSchema = TimelineEventResponseSchema;
export type EventMutationResponse = z.infer<typeof EventMutationResponseSchema>;

export const TimelineEventAuditEntrySchema = z.object({
  id: z.string(),
  model: z.string(),
  entity_id: z.string(),
  action: z.enum(["CREATE", "UPDATE", "ARCHIVE", "RESTORE", "DELETE"]),
  changed_by: z.string().nullable(),
  changed_at: z.string(),
  diff: z.string(),
  entity_version: z.number().int().nonnegative(),
  source: z.enum(["seed", "api", "import", "migration"]),
  request_id: z.string().nullable(),
});
export type TimelineEventAuditEntry = z.infer<typeof TimelineEventAuditEntrySchema>;

export const EventHistoryResponseSchema = z.object({
  data: z.array(TimelineEventAuditEntrySchema),
});
export type EventHistoryResponse = z.infer<typeof EventHistoryResponseSchema>;

export const TimelineEndpoint = {
  listEvents: {
    method: "GET" as const,
    path: "/timeline/events",
    query: TimelineListQuerySchema,
    response: TimelineListResponseSchema,
  },
  getEvent: {
    method: "GET" as const,
    path: "/timeline/events/:id",
    params: z.object({ id: z.string().min(1) }),
    response: TimelineEventResponseSchema,
  },
  createEvent: {
    method: "POST" as const,
    path: "/timeline/events",
    body: CreateEventBodySchema,
    response: EventMutationResponseSchema,
  },
  updateEvent: {
    method: "PATCH" as const,
    path: "/timeline/events/:id",
    params: z.object({ id: z.string().min(1) }),
    body: UpdateEventBodySchema,
    response: EventMutationResponseSchema,
  },
  archiveEvent: {
    method: "POST" as const,
    path: "/timeline/events/:id/archive",
    params: z.object({ id: z.string().min(1) }),
    response: EventMutationResponseSchema,
  },
  restoreEvent: {
    method: "POST" as const,
    path: "/timeline/events/:id/restore",
    params: z.object({ id: z.string().min(1) }),
    response: EventMutationResponseSchema,
  },
  deleteEvent: {
    method: "DELETE" as const,
    path: "/timeline/events/:id",
    params: z.object({ id: z.string().min(1) }),
    response: EventMutationResponseSchema,
  },
  getEventHistory: {
    method: "GET" as const,
    path: "/timeline/events/:id/history",
    params: z.object({ id: z.string().min(1) }),
    response: EventHistoryResponseSchema,
  },
  getStats: {
    method: "GET" as const,
    path: "/timeline/stats",
    response: TimelineStatsResponseSchema,
  },
  getEras: {
    method: "GET" as const,
    path: "/timeline/eras",
    response: TimelineErasResponseSchema,
  },
} as const;

export type TimelineEndpoint = typeof TimelineEndpoint;
