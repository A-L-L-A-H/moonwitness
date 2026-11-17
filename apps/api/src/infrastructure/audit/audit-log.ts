import { z } from "zod";
import { defineModel, getDb, uuidv7, type ActorContext, type AuditAction } from "@moonwitness/orm";

export const auditLogSchema = z.object({
  domain: z.string().min(1).max(80),
  entity: z.string().min(1).max(120),
  entity_id: z.string().min(1).max(200),
  action: z.enum(["CREATE", "UPDATE", "ARCHIVE", "RESTORE", "DELETE", "EXECUTE", "ACCESS"]),
  actor_id: z.string().max(200).nullable(),
  actor_role: z.string().max(80).nullable(),
  correlation_id: z.string().max(200).nullable(),
  request_path: z.string().max(500).nullable(),
  outcome: z.enum(["success", "failure", "denied"]).default("success"),
  before_json: z.string().nullable(),
  after_json: z.string().nullable(),
  metadata_json: z.string().nullable(),
  occurred_at: z.string().datetime(),
});

export const auditLogModel = defineModel({
  name: "ops.audit_log",
  table: "ops_audit_logs",
  schema: auditLogSchema,
  softDelete: false,
  indexes: [
    { fields: ["domain", "occurred_at"] },
    { fields: ["entity", "entity_id"] },
    { fields: ["actor_id", "occurred_at"] },
    { fields: ["correlation_id"] },
  ],
});

export const auditLogMigrations = [{ id: "010_create_ops_audit_logs", up: auditLogModel.ddl }];

export interface RecordAuditInput {
  domain: string;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE" | "EXECUTE" | "ACCESS";
  actor?:
    | ActorContext
    | { actorId?: string | null; requestId?: string | null; role?: string | null }
    | null;
  actorRole?: string | null;
  correlationId?: string | null;
  requestPath?: string | null;
  outcome?: "success" | "failure" | "denied";
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  occurredAt?: string;
}

function toJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "unserializable" });
  }
}

export async function recordAuditLog(input: RecordAuditInput): Promise<void> {
  const actorId = (input.actor && "actorId" in input.actor ? input.actor.actorId : null) ?? null;
  const correlationId =
    input.correlationId ??
    (input.actor && "requestId" in input.actor ? (input.actor.requestId ?? null) : null);
  const actorRole =
    input.actorRole ??
    (input.actor && "role" in input.actor
      ? ((input.actor as { role?: string | null }).role ?? null)
      : null);

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  await getDb().run(
    `INSERT INTO ops_audit_logs (
      id, create_uid, create_date, write_uid, write_date, status, deleted_uid, deleted_date,
      version, source, source_ref, domain, entity, entity_id, action, actor_id, actor_role,
      correlation_id, request_path, outcome, before_json, after_json, metadata_json, occurred_at
    ) VALUES (?, ?, ?, ?, ?, 'active', NULL, NULL, 1, 'api', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv7(),
      actorId,
      occurredAt,
      actorId,
      occurredAt,
      input.domain,
      input.entity,
      input.entityId,
      input.action,
      actorId,
      actorRole,
      correlationId,
      input.requestPath ?? null,
      input.outcome ?? "success",
      toJson(input.before),
      toJson(input.after),
      toJson(input.metadata),
      occurredAt,
    ],
  );
}

/** Best-effort wrapper so audit failures never break primary flows. */
export async function tryRecordAuditLog(input: RecordAuditInput): Promise<void> {
  try {
    await recordAuditLog(input);
  } catch {
    // audit is best-effort; primary operation must not fail
  }
}

export function auditActionFromOrm(action: AuditAction): RecordAuditInput["action"] {
  return action;
}
