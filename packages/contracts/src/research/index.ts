import { z } from "zod";

/** Research question contract (MW-0408). */
export const ResearchQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    scope: z.string().optional(),
    status: z.enum(["open", "in_progress", "answered", "closed"]).default("open"),
    createdAt: z.string().datetime(),
  })
  .strict();
export type ResearchQuestion = z.infer<typeof ResearchQuestionSchema>;

/** Curated set of knowledge sources for a research run (MW-0408). */
export const ResearchSourceSetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    sourceIds: z.array(z.string().min(1)).min(1),
    createdAt: z.string().datetime(),
  })
  .strict();
export type ResearchSourceSet = z.infer<typeof ResearchSourceSetSchema>;

/** Research methodology specification (MW-0408). */
export const ResearchMethodSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    strategy: z.enum(["synthesis", "comparison", "verification", "exploration"]),
    parameters: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type ResearchMethod = z.infer<typeof ResearchMethodSchema>;

/** Testable hypothesis produced or evaluated during research (MW-0408). */
export const ResearchHypothesisSchema = z
  .object({
    id: z.string().min(1),
    questionId: z.string().min(1),
    statement: z.string().min(1),
    status: z.enum(["proposed", "supported", "refuted", "inconclusive"]),
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();
export type ResearchHypothesis = z.infer<typeof ResearchHypothesisSchema>;

/** Research finding referencing supporting evidence/sources (MW-0408). */
export const ResearchFindingSchema = z
  .object({
    id: z.string().min(1),
    runId: z.string().min(1),
    summary: z.string().min(1),
    citationIds: z.array(z.string().min(1)).default([]),
    hypothesisIds: z.array(z.string().min(1)).default([]),
    createdAt: z.string().datetime(),
  })
  .strict();
export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;

/** Execution run of a research question against a sourceSet using a method (MW-0408). */
export const ResearchRunSchema = z
  .object({
    id: z.string().min(1),
    questionId: z.string().min(1),
    sourceSetId: z.string().min(1),
    methodId: z.string().min(1),
    status: z.enum(["queued", "running", "completed", "failed"]),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    findingIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type ResearchRun = z.infer<typeof ResearchRunSchema>;
