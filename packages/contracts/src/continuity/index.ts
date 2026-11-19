import { z } from "zod";

export const MemoryCategorySchema = z.enum([
  "working",
  "project",
  "episodic",
  "semantic",
  "procedural",
  "preference",
]);
export type MemoryCategory = z.infer<typeof MemoryCategorySchema>;

export const MemoryStatusSchema = z.enum(["active", "corrected", "archived", "deleted"]);
export type MemoryStatus = z.infer<typeof MemoryStatusSchema>;

export const ContinuityMemoryRecordSchema = z.object({
  id: z.string().min(1),
  category: MemoryCategorySchema,
  title: z.string().min(1),
  content: z.string(),
  sourceType: z.string(),
  sourceRef: z.string(),
  confidence: z.string(),
  status: MemoryStatusSchema,
  retention: z.string(),
  projectId: z.string().nullable(),
  repositoryId: z.string().nullable(),
  issueId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ContinuityMemoryRecord = z.infer<typeof ContinuityMemoryRecordSchema>;

export const WorkSessionStatusSchema = z.enum(["active", "closed", "interrupted"]);
export const WorkSessionRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: WorkSessionStatusSchema,
  projectId: z.string().nullable(),
  repositoryId: z.string().nullable(),
  issueId: z.string().nullable(),
  contextJson: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string().nullable(),
});
export type WorkSessionRecord = z.infer<typeof WorkSessionRecordSchema>;

export const ResumePointRecordSchema = z.object({
  id: z.string().min(1),
  workSessionId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  contextJson: z.string(),
  createdAt: z.string(),
});
export type ResumePointRecord = z.infer<typeof ResumePointRecordSchema>;

export const ExperienceStatusSchema = z.enum(["observed", "verified", "rejected"]);
export const ExperienceRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  evidenceJson: z.string(),
  taskId: z.string().nullable(),
  runId: z.string().nullable(),
  artifactId: z.string().nullable(),
  status: ExperienceStatusSchema,
  createdAt: z.string(),
});
export type ExperienceRecord = z.infer<typeof ExperienceRecordSchema>;

export const LessonStatusSchema = z.enum(["proposed", "accepted", "rejected"]);
export const LessonRecordSchema = z.object({
  id: z.string().min(1),
  experienceId: z.string().nullable(),
  proposal: z.string().min(1),
  status: LessonStatusSchema,
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type LessonRecord = z.infer<typeof LessonRecordSchema>;

export const SoulJournalEntrySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["experience", "lesson"]),
  title: z.string(),
  summary: z.string(),
  status: z.string(),
  evidenceJson: z.string(),
  createdAt: z.string(),
});
export type SoulJournalEntry = z.infer<typeof SoulJournalEntrySchema>;

export interface CaptureMemoryArgs {
  title: string;
  content: string;
  category?: MemoryCategory | undefined;
  sourceRef?: string | undefined;
  projectId?: string | null | undefined;
}

export interface CreateMemoryArgs {
  category: MemoryCategory;
  title: string;
  content: string;
  sourceType: string;
  sourceRef: string;
  confidence: string;
  retention: string;
  projectId?: string | null | undefined;
  repositoryId?: string | null | undefined;
  issueId?: string | null | undefined;
}

export interface UpdateMemoryArgs {
  memoryId: string;
  title: string;
  content: string;
  category: MemoryCategory;
  status: MemoryStatus;
  retention: string;
  sourceRef: string;
}

export interface CreateWorkSessionArgs {
  name: string;
  projectId?: string | null | undefined;
  repositoryId?: string | null | undefined;
  issueId?: string | null | undefined;
  contextJson?: string | undefined;
}

export interface CreateResumePointArgs {
  workSessionId: string;
  title: string;
  summary: string;
  contextJson?: string | undefined;
}

export interface CreateExperienceArgs {
  title: string;
  summary: string;
  evidenceJson?: string | undefined;
  taskId?: string | null | undefined;
  runId?: string | null | undefined;
  artifactId?: string | null | undefined;
}

export const MemorySyncRecordPayloadSchema = z
  .object({
    id: z.string().min(1).max(200).optional(),
    record_key: z.string().min(1).max(200).optional(),
    owner_id: z.string().max(200).nullable().optional(),
    scope: z.string().min(1).max(80).optional(),
    archive_id: z.string().max(200).optional(),
    conversation_id: z.string().max(200).optional(),
    kind: z.string().min(1).max(80),
    title: z.string().min(1).max(300),
    summary: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    content: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    tags: z.array(z.string()).optional().default([]),
    entities: z.array(z.string()).optional().default([]),
    source_message_ids: z.array(z.string()).optional().default([]),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .nullish()
      .transform((value) => (typeof value === "number" ? value : 0.8)),
    metadata: z.record(z.string(), z.unknown()).optional(),
    retention_days: z.number().int().positive().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .refine((value) => Boolean((value.record_key ?? value.id)?.trim()), {
    message: "Sync record requires id or record_key",
  });
export type MemorySyncRecordPayload = z.infer<typeof MemorySyncRecordPayloadSchema>;

export const MemorySyncBatchPayloadSchema = z.object({
  source: z.enum(["moonwitness-memory", "rocksoul-desktop"]),
  schema_version: z.literal(1),
  records: z.array(MemorySyncRecordPayloadSchema).min(1).max(250),
});
export type MemorySyncBatchPayload = z.infer<typeof MemorySyncBatchPayloadSchema>;

export const ContinuitySyncBundleSchema = z.object({
  memories: z.array(ContinuityMemoryRecordSchema).default([]),
  workSessions: z.array(WorkSessionRecordSchema).default([]),
  resumePoints: z.array(ResumePointRecordSchema).default([]),
  experiences: z.array(ExperienceRecordSchema).default([]),
  lessons: z.array(LessonRecordSchema).default([]),
});
export type ContinuitySyncBundle = z.infer<typeof ContinuitySyncBundleSchema>;

/** Convert local RockSoul desktop continuity records into canonical API `/memory/sync` payloads. */
export function toMemorySyncPayloadFromContinuity(
  bundle: ContinuitySyncBundle,
): MemorySyncBatchPayload {
  const parsed = ContinuitySyncBundleSchema.parse(bundle);
  const records: MemorySyncRecordPayload[] = [];

  for (const mem of parsed.memories) {
    if (mem.status === "deleted") continue;
    records.push({
      id: `rocksoul:memory:${mem.id}`,
      record_key: `rocksoul:memory:${mem.id}`,
      scope: mem.projectId ? "project" : "global",
      kind: `continuity.${mem.category}`,
      title: mem.title.slice(0, 300),
      summary: `${mem.category} · ${mem.status} (${mem.sourceType})`.slice(0, 500),
      content: mem.content,
      tags: ["rocksoul", "continuity", mem.category, mem.status],
      entities: [mem.projectId, mem.repositoryId, mem.issueId].filter((v): v is string =>
        Boolean(v),
      ),
      source_message_ids: [],
      confidence: mem.status === "corrected" ? 0.95 : 0.85,
      metadata: {
        sourceType: mem.sourceType,
        sourceRef: mem.sourceRef,
        retention: mem.retention,
      },
      created_at: mem.createdAt,
      updated_at: mem.updatedAt,
    });
  }

  for (const session of parsed.workSessions) {
    const resumes = parsed.resumePoints.filter((rp) => rp.workSessionId === session.id);
    records.push({
      id: `rocksoul:session:${session.id}`,
      record_key: `rocksoul:session:${session.id}`,
      scope: session.projectId ? "project" : "global",
      kind: "continuity.session",
      title: session.name.slice(0, 300),
      summary: `${session.status} session · ${resumes.length} resume point(s)`,
      content: resumes.map((rp) => `- ${rp.title}: ${rp.summary}`).join("\n"),
      tags: ["rocksoul", "session", session.status],
      entities: [session.projectId, session.repositoryId, session.issueId].filter(
        (v): v is string => Boolean(v),
      ),
      source_message_ids: [],
      confidence: 0.9,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    });
  }

  for (const exp of parsed.experiences) {
    records.push({
      id: `rocksoul:experience:${exp.id}`,
      record_key: `rocksoul:experience:${exp.id}`,
      scope: "global",
      kind: "continuity.experience",
      title: exp.title.slice(0, 300),
      summary: `[experience · ${exp.status}]`,
      content: exp.summary,
      tags: ["rocksoul", "soul-journal", exp.status],
      entities: [exp.taskId, exp.runId, exp.artifactId].filter((v): v is string => Boolean(v)),
      source_message_ids: [],
      confidence: exp.status === "verified" ? 1 : 0.65,
      created_at: exp.createdAt,
    });
  }

  for (const lesson of parsed.lessons) {
    records.push({
      id: `rocksoul:lesson:${lesson.id}`,
      record_key: `rocksoul:lesson:${lesson.id}`,
      scope: "global",
      kind: "continuity.lesson",
      title: lesson.proposal.slice(0, 120),
      summary: `[lesson · ${lesson.status}]`,
      content: lesson.proposal,
      tags: ["rocksoul", "lesson", lesson.status],
      entities: lesson.experienceId ? [lesson.experienceId] : [],
      source_message_ids: [],
      confidence: lesson.status === "accepted" ? 1 : 0.6,
      created_at: lesson.createdAt,
      updated_at: lesson.acceptedAt ?? lesson.createdAt,
    });
  }

  return MemorySyncBatchPayloadSchema.parse({
    source: "rocksoul-desktop",
    schema_version: 1,
    records: records.slice(0, 250),
  });
}
