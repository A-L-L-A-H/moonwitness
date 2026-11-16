import { Type } from "@sinclair/typebox";

export const CreateSourceReferenceSchema = Type.Object({
  title: Type.String({ minLength: 2, maxLength: 500 }),
  url: Type.String({ format: "uri", maxLength: 2048 }),
  authorName: Type.Optional(Type.String({ maxLength: 240 })),
  publisher: Type.Optional(Type.String({ maxLength: 240 })),
  sourceType: Type.Optional(Type.Union([
    Type.Literal("article"),
    Type.Literal("book"),
    Type.Literal("paper"),
    Type.Literal("report"),
    Type.Literal("video"),
    Type.Literal("audio"),
    Type.Literal("dataset"),
    Type.Literal("official"),
    Type.Literal("other")
  ])),
  accessedAt: Type.Optional(Type.String({ format: "date-time" }))
}, { additionalProperties: false });

export const SourceReferenceDtoSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  title: Type.String(),
  url: Type.String({ format: "uri" }),
  authorName: Type.Union([Type.String(), Type.Null()]),
  publisher: Type.Union([Type.String(), Type.Null()]),
  sourceType: Type.String(),
  accessedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()])
}, { additionalProperties: false });

export const ResearchClaimClassificationSchema = Type.Union([
  Type.Literal("observation"),
  Type.Literal("sourced_claim"),
  Type.Literal("interpretation"),
  Type.Literal("hypothesis"),
  Type.Literal("counter_evidence"),
  Type.Literal("open_question")
]);

export const ResearchClaimInputSchema = Type.Object({
  statement: Type.String({ minLength: 3, maxLength: 5000 }),
  classification: ResearchClaimClassificationSchema,
  status: Type.Optional(Type.Union([
    Type.Literal("working"),
    Type.Literal("supported"),
    Type.Literal("contested"),
    Type.Literal("unresolved"),
    Type.Literal("rejected")
  ])),
  sourceIds: Type.Optional(Type.Array(Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }), { maxItems: 100 })),
  notes: Type.Optional(Type.String({ maxLength: 10000 }))
}, { additionalProperties: false });

export const CreateResearchDossierSchema = Type.Object({
  title: Type.String({ minLength: 3, maxLength: 240 }),
  question: Type.String({ minLength: 5, maxLength: 2000 }),
  scope: Type.String({ minLength: 5, maxLength: 5000 }),
  methodologyNote: Type.Optional(Type.String({ maxLength: 10000 })),
  findings: Type.Optional(Type.Array(Type.String({ maxLength: 5000 }), { maxItems: 100 })),
  limitations: Type.Optional(Type.Array(Type.String({ maxLength: 5000 }), { maxItems: 100 })),
  nextQuestions: Type.Optional(Type.Array(Type.String({ maxLength: 2000 }), { maxItems: 100 })),
  claims: Type.Optional(Type.Array(ResearchClaimInputSchema, { maxItems: 500 }))
}, { additionalProperties: false });

export const ResearchDossierDtoSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  slug: Type.String(),
  title: Type.String(),
  question: Type.String(),
  scope: Type.String(),
  methodologyNote: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  findings: Type.Array(Type.String()),
  limitations: Type.Array(Type.String()),
  nextQuestions: Type.Array(Type.String()),
  publishedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()])
}, { additionalProperties: false });

export const CREATIVE_ENTITY_TYPES = Object.freeze([
  "platform",
  "story_world",
  "creative_label",
  "collective",
  "team",
  "culture_identity",
  "character"
]);

export const CreativeEntityDtoSchema = Type.Object({
  id: Type.String({ pattern: "^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$" }),
  slug: Type.String(),
  displayName: Type.String(),
  entityType: Type.Union(CREATIVE_ENTITY_TYPES.map(value => Type.Literal(value))),
  summary: Type.Union([Type.String(), Type.Null()])
}, { additionalProperties: false });

export const StoryListQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, maximum: 10000, default: 0 })),
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 120 }))
}, { additionalProperties: false });
