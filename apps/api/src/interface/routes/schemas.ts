export const listTimelineQuerySchema = {
  type: "object",
  properties: {
    era: { type: "string" },
    kind: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
    q: { type: "string", maxLength: 200 },
    sort: { type: "string", enum: ["newest", "oldest"] },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 100 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
  additionalProperties: false,
} as const;

export const timelineEventSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    kind: { type: "string" },
    date: { type: "string" },
    era: { type: "string" },
    title: { type: "string" },
    excerpt: { type: "string" },
    body: { type: "string" },
    location: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    sources: { type: "integer" },
    notes: { type: "integer" },
    image: { type: "string" },
    imagePosition: { type: "string" },
    related: { type: "array", items: { type: "string" } },
  },
  required: [
    "id",
    "kind",
    "date",
    "era",
    "title",
    "excerpt",
    "body",
    "location",
    "tags",
    "sources",
    "notes",
    "image",
    "related",
  ],
} as const;

export const timelineEventListResponseSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: timelineEventSchema },
    total: { type: "integer" },
  },
  required: ["data", "total"],
} as const;

export const timelineEventResponseSchema = {
  type: "object",
  properties: {
    data: timelineEventSchema,
  },
  required: ["data"],
} as const;

export const timelineStatsSchema = {
  type: "object",
  properties: {
    total: { type: "integer" },
    byEra: {
      type: "object",
      additionalProperties: { type: "integer" },
    },
    byKind: {
      type: "object",
      additionalProperties: { type: "integer" },
    },
  },
  required: ["total", "byEra", "byKind"],
} as const;

export const timelineStatsResponseSchema = {
  type: "object",
  properties: {
    data: timelineStatsSchema,
  },
  required: ["data"],
} as const;

export const eraSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    years: { type: "string" },
    tagline: { type: "string" },
    color: { type: "string" },
  },
  required: ["id", "name", "years", "tagline", "color"],
} as const;

export const eraResponseSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: eraSchema },
  },
  required: ["data"],
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
  required: ["error"],
} as const;

export const paramIdSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
} as const;

const TIMELINE_EVENT_KINDS = ["PROJECT", "STORY", "SIGNAL", "WORLD", "PEOPLE", "RESEARCH"] as const;

const TIMELINE_ERA_IDS = ["origins", "neon", "fracture", "rebuilding", "expansions"] as const;

const TIMELINE_ART_KEYS = [
  "hero-witness",
  "city-shadow",
  "crew-rooftop",
  "signal-tunnel",
  "shadow-command",
  "night-shift",
  "signal-sky",
  "fog-voices",
  "mirror-archive",
  "crew-wall",
  "crowd-moon",
] as const;

export const createTimelineEventBodySchema = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1, maxLength: 120 },
    kind: { type: "string", enum: [...TIMELINE_EVENT_KINDS] },
    date: { type: "string", minLength: 1, maxLength: 40 },
    era: { type: "string", enum: [...TIMELINE_ERA_IDS] },
    title: { type: "string", minLength: 1, maxLength: 200 },
    excerpt: { type: "string", maxLength: 1000 },
    body: { type: "string" },
    location: { type: "string", maxLength: 200 },
    tags: { type: "array", items: { type: "string" } },
    sources: { type: "integer", minimum: 0 },
    notes: { type: "integer", minimum: 0 },
    image: { type: "string", enum: [...TIMELINE_ART_KEYS] },
    imagePosition: { type: "string", maxLength: 80 },
    related: { type: "array", items: { type: "string" } },
  },
  required: ["kind", "date", "era", "title"],
  additionalProperties: false,
} as const;

export const updateTimelineEventBodySchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: [...TIMELINE_EVENT_KINDS] },
    date: { type: "string", minLength: 1, maxLength: 40 },
    era: { type: "string", enum: [...TIMELINE_ERA_IDS] },
    title: { type: "string", minLength: 1, maxLength: 200 },
    excerpt: { type: "string", maxLength: 1000 },
    body: { type: "string" },
    location: { type: "string", maxLength: 200 },
    tags: { type: "array", items: { type: "string" } },
    sources: { type: "integer", minimum: 0 },
    notes: { type: "integer", minimum: 0 },
    image: { type: "string", enum: [...TIMELINE_ART_KEYS] },
    imagePosition: { type: "string", maxLength: 80 },
    related: { type: "array", items: { type: "string" } },
    version: { type: "integer", minimum: 1 },
  },
  additionalProperties: false,
} as const;

export const timelineEventAuditEntrySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    model: { type: "string" },
    entity_id: { type: "string" },
    action: { type: "string", enum: ["CREATE", "UPDATE", "ARCHIVE", "RESTORE", "DELETE"] },
    changed_by: { type: ["string", "null"] },
    changed_at: { type: "string" },
    diff: { type: "string" },
    entity_version: { type: "integer" },
    source: { type: "string", enum: ["seed", "api", "import", "migration"] },
    request_id: { type: ["string", "null"] },
  },
  required: [
    "id",
    "model",
    "entity_id",
    "action",
    "changed_by",
    "changed_at",
    "diff",
    "entity_version",
    "source",
    "request_id",
  ],
} as const;

export const timelineEventHistoryResponseSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: timelineEventAuditEntrySchema },
  },
  required: ["data"],
} as const;
