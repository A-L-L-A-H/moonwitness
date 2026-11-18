import type { FastifyInstance } from "fastify";
import { createActorContext, onModelWrite, type ActorContext, type AuditAction } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  resolveActorTenantFromBridge,
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

const MODEL_DOMAIN_MAP: Record<string, string> = {
  auth: "identity",
  command: "command-center",
  probe: "probes",
  riot_ai: "riot-ai",
};

export interface RecordAuditInput {
  domain: string;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE" | "DELETE" | "EXECUTE" | "ACCESS";
  actor?:
    | ActorContext
    | { actorId?: string | null; requestId?: string | null; role?: string | null; tenantId?: string }
    | null;
  actorRole?: string | null;
  correlationId?: string | null;
  requestPath?: string | null;
  outcome?: "success" | "failure" | "denied";
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  occurredAt?: string;
  tenantId?: string;
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
  const tenantId =
    input.tenantId ??
    (input.actor && "tenantId" in input.actor
      ? (input.actor as { tenantId?: string }).tenantId
      : undefined);

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const ormActor = createActorContext(
    actorId,
    "api",
    correlationId ?? undefined,
    tenantId,
  );
  await auditLogModel.repository.create(
    {
      domain: input.domain.slice(0, 80) || "platform",
      entity: input.entity.slice(0, 120) || "unknown",
      entity_id: (input.entityId || "unknown").slice(0, 200),
      action: input.action,
      actor_id: actorId ? actorId.slice(0, 200) : null,
      actor_role: actorRole ? actorRole.slice(0, 80) : null,
      correlation_id: correlationId ? correlationId.slice(0, 200) : null,
      request_path: input.requestPath ? input.requestPath.slice(0, 500) : null,
      outcome: input.outcome ?? "success",
      before_json: toJson(input.before),
      after_json: toJson(input.after),
      metadata_json: toJson(input.metadata),
      occurred_at: occurredAt,
    },
    ormActor,
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
  tenantId?: string;
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
  const filters: Record<string, unknown> = {};
  if (options.domain?.trim()) {
    filters.domain = options.domain.trim();
  }
  if (options.entity?.trim()) {
    filters.entity = options.entity.trim();
  }
  if (options.actorId?.trim()) {
    filters.actor_id = options.actorId.trim();
  }
  const limit = Math.min(200, Math.max(1, options.limit ?? 50));
  const rows = await auditLogModel.repository.find(filters, {
    limit,
    orderBy: [
      { field: "occurred_at", direction: "DESC" },
      { field: "id", direction: "DESC" },
    ],
    ...(options.tenantId ? { tenantId: options.tenantId } : {}),
  });
  return rows.map((row) => ({
    id: row.id,
    domain: row.domain,
    entity: row.entity,
    entityId: row.entity_id,
    action: row.action,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    correlationId: row.correlation_id,
    requestPath: row.request_path,
    outcome: row.outcome,
    beforeJson: row.before_json,
    afterJson: row.after_json,
    metadataJson: row.metadata_json,
    occurredAt: row.occurred_at,
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
    const prefix = event.model.includes(".") ? event.model.split(".")[0]! : "platform";
    const domain = MODEL_DOMAIN_MAP[prefix] ?? prefix;
    await tryRecordAuditLog({
      domain,
      entity: event.model,
      entityId: event.entityId,
      action: auditActionFromOrm(event.action),
      actor: event.actor,
      before: event.before,
      after: event.record,
      occurredAt: event.timestamp,
      tenantId: event.actor.tenantId,
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
          tenantId: resolveActorTenantFromBridge(auth, request),
        });
        return { data: logs, logs };
      });
    },
  };
}

export const auditAddon = createAuditAddon();
