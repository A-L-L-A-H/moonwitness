import { z } from "zod";

/** Canonical status for canon records. */
export const CanonStatusSchema = z.enum([
  "draft",
  "proposed",
  "active",
  "deprecated",
  "archived",
  "retracted",
]);
export type CanonStatus = z.infer<typeof CanonStatusSchema>;

/** Classification level for canon records. */
export const CanonClassificationSchema = z.enum(["public", "internal", "restricted", "private"]);
export type CanonClassification = z.infer<typeof CanonClassificationSchema>;

/** Author / actor attribution for canon records. */
export const CanonAuthorSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    role: z.enum(["owner", "curator", "contributor", "system"]).default("curator"),
  })
  .strict();
export type CanonAuthor = z.infer<typeof CanonAuthorSchema>;

/** Reference to a supporting knowledge source. */
export const CanonSourceRefSchema = z
  .object({
    sourceId: z.string().min(1),
    revisionId: z.string().min(1).optional(),
    locator: z.string().min(1).optional(),
    excerpt: z.string().optional(),
  })
  .strict();
export type CanonSourceRef = z.infer<typeof CanonSourceRefSchema>;

/** Lifecycle timestamps and state transitions. */
export const CanonLifecycleSchema = z
  .object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    publishedAt: z.string().datetime().optional(),
    deprecatedAt: z.string().datetime().optional(),
    archivedAt: z.string().datetime().optional(),
  })
  .strict();
export type CanonLifecycle = z.infer<typeof CanonLifecycleSchema>;

/** Immutable history entry for canon mutations. */
export const CanonHistoryEntrySchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    timestamp: z.string().datetime(),
    author: CanonAuthorSchema,
    action: z.enum(["created", "updated", "status_changed", "merged", "retracted"]),
    summary: z.string().min(1),
    previousStatus: CanonStatusSchema.optional(),
    nextStatus: CanonStatusSchema.optional(),
  })
  .strict();
export type CanonHistoryEntry = z.infer<typeof CanonHistoryEntrySchema>;

/** Canonical entity contract (MW-0401). */
export const CanonEntitySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    kind: z.string().min(1),
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    summary: z.string().optional(),
    status: CanonStatusSchema,
    classification: CanonClassificationSchema,
    author: CanonAuthorSchema,
    sourceRefs: z.array(CanonSourceRefSchema).default([]),
    lifecycle: CanonLifecycleSchema,
    history: z.array(CanonHistoryEntrySchema).default([]),
  })
  .strict();
export type CanonEntity = z.infer<typeof CanonEntitySchema>;

/** Canonical glossary / domain term contract (MW-0401). */
export const CanonTermSchema = z
  .object({
    id: z.string().min(1),
    term: z.string().min(1),
    definition: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    domain: z.string().min(1).optional(),
    status: CanonStatusSchema,
    classification: CanonClassificationSchema,
    author: CanonAuthorSchema,
    sourceRefs: z.array(CanonSourceRefSchema).default([]),
    lifecycle: CanonLifecycleSchema,
    history: z.array(CanonHistoryEntrySchema).default([]),
  })
  .strict();
export type CanonTerm = z.infer<typeof CanonTermSchema>;

/** Canonical directed relationship between entities/terms (MW-0402). */
export const CanonRelationshipSchema = z
  .object({
    id: z.string().min(1),
    subjectId: z.string().min(1),
    predicate: z.string().min(1),
    objectId: z.string().min(1),
    status: CanonStatusSchema,
    classification: CanonClassificationSchema,
    author: CanonAuthorSchema,
    sourceRefs: z.array(CanonSourceRefSchema).default([]),
    lifecycle: CanonLifecycleSchema,
    history: z.array(CanonHistoryEntrySchema).default([]),
  })
  .strict();
export type CanonRelationship = z.infer<typeof CanonRelationshipSchema>;
