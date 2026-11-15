import { writeUsageSummary } from "./riot-ai.persistence";

export interface InferenceUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

export interface InferenceAuditRecord {
  actorId: string;
  requestId: string;
  provider: string;
  model: string;
  outcome: "success" | "failure";
  durationMs: number;
  usage: InferenceUsage;
  errorCode?: string;
}

export type InferenceAuditWriter = (record: InferenceAuditRecord) => void;

export type InferenceSummaryWriter = (record: {
  actorId: string;
  provider: "ollama";
  model: string;
  outcome: "success" | "failure";
  durationMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  errorCode?: string;
  occurredAt: string;
}) => Promise<void>;

const defaultAuditWriter: InferenceAuditWriter = (record) => {
  process.stdout.write(`${JSON.stringify({ event: "riot_ai.inference", ...record })}\n`);
};

let auditWriter = defaultAuditWriter;
let usageWriter: InferenceSummaryWriter = writeUsageSummary;

export function writeInferenceAudit(record: InferenceAuditRecord): void {
  auditWriter(record);
}

export function setInferenceAuditWriterForTests(
  writer?: InferenceAuditWriter,
  summaries: InferenceSummaryWriter | null = null,
): void {
  auditWriter = writer ?? defaultAuditWriter;
  usageWriter = summaries ?? (writer ? async () => {} : writeUsageSummary);
}

export async function persistInferenceAudit(
  record: InferenceAuditRecord,
  includeAuditLog = true,
): Promise<void> {
  await usageWriter({
    actorId: record.actorId,
    provider: "ollama",
    model: record.model,
    outcome: record.outcome,
    durationMs: record.durationMs,
    promptTokens: record.usage.promptTokens,
    completionTokens: record.usage.completionTokens,
    totalTokens: record.usage.totalTokens,
    ...(record.errorCode ? { errorCode: record.errorCode } : {}),
    occurredAt: new Date().toISOString(),
  });
  if (includeAuditLog) auditWriter(record);
}
