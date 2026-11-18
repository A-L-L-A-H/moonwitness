import { z } from "zod";

/** Canonical record domain referenced by a Sidra projection node. */
export const SidraRecordDomainSchema = z.enum([
  "canon",
  "knowledge",
  "witness",
  "chronicle",
  "research",
  "publication",
]);
export type SidraRecordDomain = z.infer<typeof SidraRecordDomainSchema>;

/** Reference to an underlying canonical record. */
export const SidraCanonicalRefSchema = z
  .object({
    domain: SidraRecordDomainSchema,
    recordType: z.string().min(1),
    recordId: z.string().min(1),
  })
  .strict();
export type SidraCanonicalRef = z.infer<typeof SidraCanonicalRefSchema>;

/** Read/navigation graph projection node (MW-0409). */
export const SidraNodeSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    kind: z.string().min(1),
    canonicalRef: SidraCanonicalRefSchema,
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type SidraNode = z.infer<typeof SidraNodeSchema>;

/** Read/navigation graph projection edge (MW-0409). */
export const SidraEdgeSchema = z
  .object({
    id: z.string().min(1),
    fromNodeId: z.string().min(1),
    toNodeId: z.string().min(1),
    relation: z.string().min(1),
    weight: z.number().min(0).max(1).optional(),
    canonicalRef: SidraCanonicalRefSchema.optional(),
  })
  .strict();
export type SidraEdge = z.infer<typeof SidraEdgeSchema>;

/** Read-only Sidra graph projection slice (MW-0409). */
export const SidraProjectionSchema = z
  .object({
    nodes: z.array(SidraNodeSchema),
    edges: z.array(SidraEdgeSchema),
    projectedAt: z.string().datetime(),
  })
  .strict();
export type SidraProjection = z.infer<typeof SidraProjectionSchema>;
