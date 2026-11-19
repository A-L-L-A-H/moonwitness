import { z } from "zod";
import type { FastifyInstance } from "fastify";
import {
  BaseRepository,
  defineModel,
  modelRegistry,
  onModelWrite,
  SYSTEM_ACTOR,
  type ActorContext,
} from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  enqueueJob,
  isBlockedRuntimeHost,
  postChatterMessage,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const khidraManifest = manifestData as AddonManifestInput;

export const irAutomationSchema = z.object({
  rule_key: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  target_model: z.string().min(1).max(120),
  trigger: z.enum(["on_create", "on_update", "on_time"]).default("on_create"),
  domain_json: z.string().nullable().default(null),
  action_type: z
    .enum(["post_chatter", "enqueue_job", "update_fields", "webhook"])
    .default("post_chatter"),
  action_data_json: z.string().default("{}"),
  active: z.boolean().default(true),
});

export const irAutomationModel = defineModel({
  name: "ir.automation",
  table: "ir_automations",
  schema: irAutomationSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["rule_key", "name", "target_model", "action_type"],
  publicFields: ["rule_key", "name", "target_model", "trigger", "action_type", "active"],
  indexes: [
    { fields: ["tenant_id", "rule_key"], unique: true },
    { fields: ["target_model", "trigger", "active"] },
  ],
});

export const irWebhookSchema = z.object({
  webhook_key: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  url: z.string().url().max(1000),
  event_trigger: z.string().min(1).max(120).default("*"),
  active: z.boolean().default(true),
});

export const irWebhookModel = defineModel({
  name: "ir.webhook",
  table: "ir_webhooks",
  schema: irWebhookSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["webhook_key", "name", "url", "event_trigger"],
  publicFields: ["webhook_key", "name", "url", "event_trigger", "active"],
  indexes: [
    { fields: ["tenant_id", "webhook_key"], unique: true },
    { fields: ["event_trigger", "active"] },
  ],
});

export const irWebhookLogSchema = z.object({
  webhook_key: z.string().min(1).max(120),
  event: z.string().min(1).max(120),
  run_status: z.enum(["success", "failed"]).default("success"),
  response_code: z.number().int().default(200),
  duration_ms: z.number().int().nonnegative().default(0),
  payload_json: z.string().default("{}"),
  error: z.string().max(2000).nullable().default(null),
});

export const irWebhookLogModel = defineModel({
  name: "ir.webhook.log",
  table: "ir_webhook_logs",
  schema: irWebhookLogSchema,
  softDelete: false,
  restEnabled: true,
  retention: { maxRows: 500, orderField: "create_date" },
  searchFields: ["webhook_key", "event", "run_status"],
  publicFields: ["webhook_key", "event", "run_status", "response_code", "duration_ms"],
  indexes: [{ fields: ["webhook_key"] }, { fields: ["run_status"] }],
});

const AUTOMATION_EXCLUDED_MODELS = new Set([
  "ir.automation",
  "ir.webhook",
  "ir.webhook.log",
  "mail.message",
  "mail.tracking.value",
  "ops.job",
  "audit.log",
]);

function matchesSimpleDomain(
  domainJson: string | null,
  record: Record<string, unknown>,
): boolean {
  if (!domainJson?.trim()) return true;
  try {
    const parsed = JSON.parse(domainJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return true;
    for (const [k, v] of Object.entries(parsed)) {
      if (String(record[k] ?? "") !== String(v)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

export async function evaluateAutomations(
  modelName: string,
  triggerType: "on_create" | "on_update" | "on_time",
  record: Record<string, unknown>,
  actor: ActorContext = SYSTEM_ACTOR,
): Promise<number> {
  if (AUTOMATION_EXCLUDED_MODELS.has(modelName)) return 0;
  const tenantId = actor.tenantId ?? String(record.tenant_id ?? "default");
  const rules = await irAutomationModel.repository.find(
    { target_model: modelName, trigger: triggerType, active: true },
    { tenantId },
  );
  let executedCount = 0;

  for (const rule of rules) {
    if (!matchesSimpleDomain(rule.domain_json, record)) continue;
    let actionData: Record<string, unknown>;
    try {
      actionData = JSON.parse(rule.action_data_json) as Record<string, unknown>;
    } catch {
      actionData = {};
    }

    const recordId = String(record.id ?? "");
    if (rule.action_type === "post_chatter" && recordId) {
      await postChatterMessage({
        resModel: modelName,
        resId: recordId,
        body:
          typeof actionData.body === "string"
            ? actionData.body
            : `Automation '${rule.name}' triggered (${triggerType})`,
        messageType: "notification",
        actor,
      });
      executedCount += 1;
    } else if (rule.action_type === "enqueue_job" && recordId) {
      await enqueueJob(
        {
          queue: "khidra",
          jobType:
            typeof actionData.job_type === "string"
              ? actionData.job_type
              : `automation:${rule.rule_key}`,
          payload: { model: modelName, recordId, ...actionData },
        },
        actor,
      );
      executedCount += 1;
    } else if (
      rule.action_type === "update_fields" &&
      recordId &&
      actionData.updates &&
      typeof actionData.updates === "object"
    ) {
      const desc = modelRegistry.get(modelName);
      if (desc) {
        const repo = new BaseRepository(
          desc.name,
          desc.table,
          desc.fullSchema,
          desc.softDelete,
          desc.fields,
        );
        await repo.update(recordId, actionData.updates as Record<string, unknown>, actor);
        executedCount += 1;
      }
    } else if (rule.action_type === "webhook" && typeof actionData.webhook_key === "string") {
      const wh = (
        await irWebhookModel.repository.find(
          { webhook_key: actionData.webhook_key, active: true },
          { tenantId, limit: 1 },
        )
      )[0];
      if (wh) {
        const start = Date.now();
        let status: "success" | "failed" = "success";
        let responseCode: number;
        let errorMsg: string | null = null;
        try {
          const parsedUrl = new URL(wh.url);
          if (isBlockedRuntimeHost(parsedUrl.hostname)) {
            throw new Error("Blocked private/loopback webhook target");
          }
          const res = await fetch(wh.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-moon-event": `record.${triggerType}`,
              "x-moon-model": modelName,
            },
            body: JSON.stringify({ event: `record.${triggerType}`, model: modelName, record }),
            signal: AbortSignal.timeout(4000),
          });
          responseCode = res.status;
          if (!res.ok) status = "failed";
        } catch (err) {
          status = "failed";
          responseCode = 0;
          errorMsg = err instanceof Error ? err.message : String(err);
        }
        await irWebhookLogModel.repository.create(
          {
            webhook_key: wh.webhook_key,
            event: `record.${triggerType}`,
            run_status: status,
            response_code: responseCode,
            duration_ms: Math.max(0, Date.now() - start),
            payload_json: JSON.stringify({ model: modelName, recordId }),
            error: errorMsg,
          },
          actor,
        );
        executedCount += 1;
      }
    }
  }
  return executedCount;
}

export const khidraRules: IrRuleInput[] = [
  { model_name: "ir.automation", role: "viewer", can_read: true },
  {
    model_name: "ir.automation",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "ir.automation",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "ir.webhook", role: "viewer", can_read: true },
  {
    model_name: "ir.webhook",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "ir.webhook.log", role: "viewer", can_read: true },
  { model_name: "ir.webhook.log", role: "admin", can_read: true },
];

export const khidraViews: IrViewInput[] = [
  {
    model_name: "ir.automation",
    view_type: "list",
    spec: {
      title: "Khidra Automation Rules",
      description: "Event-driven model triggers (on_create, on_update, on_time).",
      domainIcon: "arsy",
      columns: ["rule_key", "name", "target_model", "trigger", "action_type", "active"],
    },
  },
];

export const khidraMenus: IrMenuInput[] = [
  {
    menu_key: "khidra.automations",
    label: "Automations",
    href: "/models/ir.automation",
    icon: "arsy",
    plane: "operations",
    sort_order: 74,
    min_role: "viewer",
  },
];

let unsubscribeKhidraHook: (() => void) | null = null;

export function createKhidraAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: khidraManifest,
    models: [irAutomationModel, irWebhookModel, irWebhookLogModel],
    rules: khidraRules,
    views: khidraViews,
    menus: khidraMenus,
    register: () => {
      if (unsubscribeKhidraHook) unsubscribeKhidraHook();
      unsubscribeKhidraHook = onModelWrite("*", async (ev) => {
        if (ev.action === "CREATE") {
          await evaluateAutomations(ev.model, "on_create", ev.record, ev.actor);
        } else if (ev.action === "UPDATE") {
          await evaluateAutomations(ev.model, "on_update", ev.record, ev.actor);
        }
      });
    },
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/khidra/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [automations, webhooks, webhookLogs] = await Promise.all([
          irAutomationModel.repository.count({ active: true }, { tenantId }),
          irWebhookModel.repository.count({ active: true }, { tenantId }),
          irWebhookLogModel.repository.count({}, { tenantId }),
        ]);
        return { automations, webhooks, webhookLogs };
      });

      const triggerSchema = z.object({
        model: z.string().min(1),
        trigger: z.enum(["on_create", "on_update", "on_time"]).default("on_create"),
        record: z.record(z.string(), z.unknown()),
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/khidra/trigger`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = triggerSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid trigger payload" });
          }
          const actor = resolveActorContextFromBridge(auth, request);
          const executed = await evaluateAutomations(
            parsed.data.model,
            parsed.data.trigger,
            parsed.data.record,
            actor,
          );
          return { executed };
        },
      );
    },
  };
}

export const khidraAddon = createKhidraAddon();
