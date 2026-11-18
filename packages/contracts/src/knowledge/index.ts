import { z } from "zod";

/** SHA-256 hex digest (64 lowercase/uppercase hex characters). */
export const Sha256HashSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{64}$/, "Must be a valid 64-character SHA-256 hex digest");
export type Sha256Hash = z.infer<typeof Sha256HashSchema>;

/** Knowledge classification level. */
export const KnowledgeClassificationSchema = z.enum([
  "public",
  "internal",
  "restricted",
  "private",
]);
export type KnowledgeClassification = z.infer<typeof KnowledgeClassificationSchema>;

/** Ingestion pipeline state for a knowledge source. */
export const IngestionStateSchema = z.enum([
  "pending",
  "fetching",
  "parsed",
  "indexed",
  "failed",
  "quarantined",
]);
export type IngestionState = z.infer<typeof IngestionStateSchema>;

/** Citation linking a knowledge source/revision to a specific locator. */
export const KnowledgeCitationSchema = z
  .object({
    id: z.string().min(1),
    sourceId: z.string().min(1),
    revisionId: z.string().min(1),
    locator: z.string().min(1),
    quote: z.string().optional(),
    citedAt: z.string().datetime(),
  })
  .strict();
export type KnowledgeCitation = z.infer<typeof KnowledgeCitationSchema>;

/** Immutable revision of a knowledge source (MW-0403). */
export const KnowledgeRevisionSchema = z
  .object({
    id: z.string().min(1),
    sourceId: z.string().min(1),
    revisionNumber: z.number().int().positive(),
    sha256: Sha256HashSchema,
    byteSize: z.number().int().nonnegative(),
    mimeType: z.string().min(1),
    ingestionState: IngestionStateSchema,
    ingestedAt: z.string().datetime(),
    errorMessage: z.string().optional(),
  })
  .strict();
export type KnowledgeRevision = z.infer<typeof KnowledgeRevisionSchema>;

/** Canonical knowledge source contract (MW-0404). */
export const KnowledgeSourceSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    kind: z.enum(["document", "webpage", "transcript", "dataset", "media", "note"]),
    uri: z.string().min(1).optional(),
    classification: KnowledgeClassificationSchema,
    ingestionState: IngestionStateSchema,
    currentRevisionId: z.string().min(1).optional(),
    sha256: Sha256HashSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;
