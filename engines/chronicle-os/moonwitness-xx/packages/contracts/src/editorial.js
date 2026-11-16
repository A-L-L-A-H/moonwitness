import { Type } from "@sinclair/typebox";

export const PROVENANCE_TYPES = Object.freeze([
  "FIRSTHAND",
  "RECOLLECTION",
  "DREAM",
  "SOURCED",
  "INTERPRETATION",
  "REFLECTION",
  "FICTION"
]);

export const STORY_STATUSES = Object.freeze([
  "draft",
  "in_review",
  "changes_requested",
  "scheduled",
  "published",
  "archived"
]);

export const StoryProvenanceSchema = Type.Union(
  PROVENANCE_TYPES.map((value) => Type.Literal(value))
);

export const StoryBlockSchema = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 80, pattern: "^[A-Za-z0-9_-]+$" }),
  type: Type.Union([
    Type.Literal("paragraph"),
    Type.Literal("heading"),
    Type.Literal("quote"),
    Type.Literal("image"),
    Type.Literal("audio"),
    Type.Literal("embed")
  ]),
  provenance: StoryProvenanceSchema,
  text: Type.Optional(Type.String({ maxLength: 100000 })),
  sourceIds: Type.Array(Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }), { default: [] }),
  mediaAssetId: Type.Optional(Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" })),
  altText: Type.Optional(Type.String({ maxLength: 500 })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown()))
}, { additionalProperties: false });

export const StoryBlocksSchema = Type.Array(StoryBlockSchema, { maxItems: 1000 });

export const CreateStoryRequestSchema = Type.Object({
  title: Type.String({ minLength: 3, maxLength: 240 }),
  subtitle: Type.Optional(Type.String({ maxLength: 500 })),
  contentBlocks: StoryBlocksSchema
}, { additionalProperties: false });

export const UpdateStoryRequestSchema = Type.Partial(CreateStoryRequestSchema, {
  minProperties: 1,
  additionalProperties: false
});

export const StoryTransitionSchema = Type.Object({
  from: Type.Union(STORY_STATUSES.map((value) => Type.Literal(value))),
  to: Type.Union(STORY_STATUSES.map((value) => Type.Literal(value))),
  reason: Type.Optional(Type.String({ maxLength: 2000 }))
}, { additionalProperties: false });

export const StoryTransitionRequestSchema = Type.Object({
  to: Type.Union(STORY_STATUSES.map((value) => Type.Literal(value))),
  reason: Type.Optional(Type.String({ minLength: 1, maxLength: 2000 }))
}, { additionalProperties: false });

export const STORY_TRANSITIONS = Object.freeze({
  draft: Object.freeze(["in_review", "archived"]),
  in_review: Object.freeze(["changes_requested", "scheduled", "published", "archived"]),
  changes_requested: Object.freeze(["draft", "in_review", "archived"]),
  scheduled: Object.freeze(["published", "draft", "archived"]),
  published: Object.freeze(["archived"]),
  archived: Object.freeze([])
});
