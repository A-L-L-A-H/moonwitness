import type { FastifyInstance } from "fastify";
import { getDb, onModelWrite, uuidv7, type ActorContext, type AuditAction } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import { auditLogModel } from "./model.js";

export const auditManifest = manifestData as AddonManifestInput;
export { auditLogModel, auditLogSchema } from "./model.js";

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
    // Audit logging must never break committed primary operations.
  }
}

export function auditActionFromOrm(action: AuditAction): RecordAuditInput["action"] {
  return action;
}

export interface ListAuditLogsOptions {
  domain?: string;
  entity?: string;
  actorId?: string;
  limit?: number;
}

export interface AuditLogRecord {
  id: string;
  domain: string;
  entity: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  correlationId: string | null;
  requestPath: string | null;
  outcome: string;
  beforeJson: string | null;
  afterJson: string | null;
  metadataJson: string | null;
  occurredAt: string;
}

export async function listAuditLogs(options: ListAuditLogsOptions = {}): Promise<AuditLogRecord[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (options.domain?.trim()) {
    clauses.push("domain = ?");
    params.push(options.domain.trim());
  }
  if (options.entity?.trim()) {
    clauses.push("entity = ?");
    params.push(options.entity.trim());
  }
  if (options.actorId?.trim()) {
    clauses.push("actor_id = ?");
    params.push(options.actorId.trim());
  }
  const limit = Math.min(200, Math.max(1, options.limit ?? 50));
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await getDb().all<Record<string, unknown>>(
    `SELECT id, domain, entity, entity_id, action, actor_id, actor_role,
            correlation_id, request_path, outcome, before_json, after_json,
            metadata_json, occurred_at
       FROM ops_audit_logs
       ${where}
      ORDER BY occurred_at DESC, id DESC
      LIMIT ?`,
    [...params, limit],
  );
  return rows.map((row) => ({
    id: String(row.id),
    domain: String(row.domain),
    entity: String(row.entity),
    entityId: String(row.entity_id),
    action: String(row.action),
    actorId: typeof row.actor_id === "string" ? row.actor_id : null,
    actorRole: typeof row.actor_role === "string" ? row.actor_role : null,
    correlationId: typeof row.correlation_id === "string" ? row.correlation_id : null,
    requestPath: typeof row.request_path === "string" ? row.request_path : null,
    outcome: String(row.outcome),
    beforeJson: typeof row.before_json === "string" ? row.before_json : null,
    afterJson: typeof row.after_json === "string" ? row.after_json : null,
    metadataJson: typeof row.metadata_json === "string" ? row.metadata_json : null,
    occurredAt: String(row.occurred_at),
  }));
}

let activeOutboxUnsubscribe: (() => void) | null = null;

/** Subscribe once to all domain ORM writes and mirror into ops_audit_logs. */
export function attachAuditOutboxSubscriber(): () => void {
  if (activeOutboxUnsubscribe) {
    activeOutboxUnsubscribe();
    activeOutboxUnsubscribe = null;
  }
  activeOutboxUnsubscribe = onModelWrite("*", async (event) => {
    if (event.model === "ops.audit_log" || event.model.startsWith("ir.")) return;
    if (event.actor.source === "seed") return;
    const domain = event.model.includes(".") ? event.model.split(".")[0]! : "platform";
    await tryRecordAuditLog({
      domain,
      entity: event.model,
      entityId: event.entityId,
      action: auditActionFromOrm(event.action),
      actor: event.actor,
      before: event.before,
      after: event.record,
      occurredAt: event.timestamp,
    });
  });
  return activeOutboxUnsubscribe;
}

export const auditRules: IrRuleInput[] = [
  { model_name: "ops.audit_log", role: "admin", can_read: true },
];

export const auditViews: IrViewInput[] = [
  {
    model_name: "ops.audit_log",
    view_type: "list",
    actionBindings: { listUrl: "/api/v1/audit/logs" },
    spec: {
      title: "Platform Audit Log",
      description: "Unified immutable trail across identity, OIDC, and domain models.",
      columns: ["domain", "entity", "action", "actor_id", "outcome", "occurred_at"],
    },
  },
];

export const auditMenus: IrMenuInput[] = [
  {
    menu_key: "audit.logs",
    label: "Audit Logs",
    href: "/models/ops.audit_log",
    icon: "scripture",
    plane: "operations",
    sort_order: 85,
    min_role: "admin",
  },
];

export function createAuditAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: auditManifest,
    models: [auditLogModel],
    rules: auditRules,
    views: auditViews,
    menus: auditMenus,
    register: () => {
      attachAuditOutboxSubscriber();
    },
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get<{
        Querystring: { domain?: string; entity?: string; actorId?: string; limit?: string };
      }>(`${prefix}/audit/logs`, { preHandler: auth.requireRole("admin") }, async (request) => {
        const limit = request.query?.limit ? Number(request.query.limit) : 50;
        const logs = await listAuditLogs({
          domain: request.query?.domain,
          entity: request.query?.entity,
          actorId: request.query?.actorId,
          limit: Number.isFinite(limit) ? limit : 50,
        });
        return { data: logs, logs };
      });
    },
  };
}

export const auditAddon = createAuditAddon();
