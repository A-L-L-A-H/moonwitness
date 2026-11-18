import { z } from "zod";

/** Distinct epistemic kinds for witness records (MW-0405). */
export const EpistemicKindSchema = z.enum([
  "observation",
  "report",
  "fact",
  "interpretation",
  "hypothesis",
  "dream",
  "fiction",
  "joke",
  "unknown",
]);
export type EpistemicKind = z.infer<typeof EpistemicKindSchema>;

/** Witness Ledger temporal provenance epistemic registers aligned with services/memory witness_ledger.py. */
export const WitnessEpistemicRegisterSchema = z.enum([
  "fact",
  "testimony",
  "hypothesis",
  "interpretation",
  "dream",
  "fiction",
  "unknown",
]);
export type WitnessEpistemicRegister = z.infer<typeof WitnessEpistemicRegisterSchema>;

export const WitnessClaimStatusSchema = z.enum(["active", "superseded", "disputed", "unverified"]);
export type WitnessClaimStatus = z.infer<typeof WitnessClaimStatusSchema>;

export const WitnessRelationTypeSchema = z.enum([
  "supports",
  "contradicts",
  "derived_from",
  "supersedes",
]);
export type WitnessRelationType = z.infer<typeof WitnessRelationTypeSchema>;

/** Provenance metadata for witness records (MW-0406). */
export const WitnessProvenanceSchema = z
  .object({
    witnessId: z.string().min(1),
    channel: z.enum(["direct", "oral", "document", "sensor", "inference", "unknown"]),
    sourceId: z.string().min(1).optional(),
    revisionId: z.string().min(1).optional(),
    recordedAt: z.string().datetime(),
    observedAt: z.string().datetime().optional(),
    context: z.string().optional(),
  })
  .strict();
export type WitnessProvenance = z.infer<typeof WitnessProvenanceSchema>;

/** Direct or reported observation contract. */
export const WitnessObservationSchema = z
  .object({
    id: z.string().min(1),
    epistemicKind: EpistemicKindSchema,
    statement: z.string().min(1),
    entityIds: z.array(z.string().min(1)).default([]),
    provenance: WitnessProvenanceSchema,
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();
export type WitnessObservation = z.infer<typeof WitnessObservationSchema>;

/** Epistemic claim contract. */
export const WitnessClaimSchema = z
  .object({
    id: z.string().min(1),
    epistemicKind: EpistemicKindSchema,
    proposition: z.string().min(1),
    entityIds: z.array(z.string().min(1)).default([]),
    evidenceIds: z.array(z.string().min(1)).default([]),
    provenance: WitnessProvenanceSchema,
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();
export type WitnessClaim = z.infer<typeof WitnessClaimSchema>;

/** Supporting or refuting evidence contract. */
export const WitnessEvidenceSchema = z
  .object({
    id: z.string().min(1),
    epistemicKind: EpistemicKindSchema,
    summary: z.string().min(1),
    stance: z.enum(["supports", "refutes", "contextualizes", "inconclusive"]),
    observationIds: z.array(z.string().min(1)).default([]),
    provenance: WitnessProvenanceSchema,
  })
  .strict();
export type WitnessEvidence = z.infer<typeof WitnessEvidenceSchema>;
