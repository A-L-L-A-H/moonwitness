import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  postChatterMessage,
  resolveActorTenantFromBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const cabManifest = manifestData as AddonManifestInput;

export const projectProjectSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(180),
  summary: z.string().max(2000).default(""),
  project_status: z
    .enum(["planned", "active", "on_hold", "completed", "archived"])
    .default("active"),
});

export const projectProjectModel = defineModel({
  name: "project.project",
  table: "pj_projects",
  schema: projectProjectSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["code", "name", "summary"],
  publicFields: ["code", "name", "summary", "project_status"],
  relations: {
    tasks: {
      model: "project.task",
      type: "one2many",
      targetField: "code",
      inverseField: "project_code",
    },
  },
  indexes: [
    { fields: ["tenant_id", "code"], unique: true },
    { fields: ["project_status"] },
  ],
});

export const projectTaskSchema = z.object({
  project_code: z.string().min(1).max(40),
  title: z.string().min(1).max(180),
  description: z.string().max(4000).default(""),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  task_status: z.enum(["todo", "in_progress", "review", "done"]).default("todo"),
  estimated_hours: z.number().nonnegative().default(0),
});

export const projectTaskModel = defineModel({
  name: "project.task",
  table: "pj_tasks",
  schema: projectTaskSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["project_code", "title", "description"],
  publicFields: ["project_code", "title", "priority", "task_status", "estimated_hours"],
  relations: {
    project_code: { model: "project.project", targetField: "code" },
  },
  indexes: [{ fields: ["project_code"] }, { fields: ["priority"] }, { fields: ["task_status"] }],
});

export const cabDecisionInputSchema = z.object({
  outcome: z.enum(["approved", "approved_with_conditions", "deferred", "rejected"]),
  rationale: z.string().min(1).max(2000),
});

export const cabChangeSchema = z.object({
  reference: z.string().min(1).max(40),
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(4000),
  project_code: z.string().max(40).nullable().default(null),
  risk: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  change_status: z
    .enum(["draft", "submitted", "in_review", "approved", "rejected", "implemented"])
    .default("draft"),
  scheduled_for: z.string().nullable().default(null),
});

export const cabChangeModel = defineModel({
  name: "cab.change",
  table: "cab_changes",
  schema: cabChangeSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["reference", "title", "description", "project_code"],
  publicFields: ["reference", "title", "risk", "change_status", "scheduled_for"],
  relations: {
    decisions: {
      model: "cab.decision",
      type: "one2many",
      targetField: "reference",
      inverseField: "change_reference",
    },
  },
  actions: {
    submit_rfc: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Submit RFC for Review",
      handler: async ({ record, repository, actor }) => {
        const updated = await repository.update(
          String(record!.id),
          { change_status: "submitted" },
          actor,
        );
        await postChatterMessage({
          resModel: "cab.change",
          resId: String(record!.id),
          body: `RFC ${String(record!.reference)} submitted for CAB review`,
          trackingValues: [
            {
              fieldName: "change_status",
              oldValue: String(record!.change_status),
              newValue: "submitted",
            },
          ],
          actor,
        });
        return updated;
      },
    },
    record_decision: {
      scope: "record",
      roles: ["admin"],
      label: "Record CAB Decision",
      input: cabDecisionInputSchema,
      handler: async ({ record, input, repository, actor }) => {
        const parsed = input as z.infer<typeof cabDecisionInputSchema>;
        const nextStatus =
          parsed.outcome === "approved" || parsed.outcome === "approved_with_conditions"
            ? "approved"
            : parsed.outcome === "rejected"
              ? "rejected"
              : "in_review";
        const decision = await cabDecisionModel.repository.create(
          {
            change_reference: String(record!.reference),
            outcome: parsed.outcome,
            rationale: parsed.rationale,
            decided_by: actor.actorId ?? "system",
            decided_at: new Date().toISOString(),
          },
          actor,
        );
        const updated = await repository.update(
          String(record!.id),
          { change_status: nextStatus },
          actor,
        );
        return { change: updated, decision };
      },
    },
  },
  indexes: [
    { fields: ["tenant_id", "reference"], unique: true },
    { fields: ["change_status"] },
    { fields: ["risk"] },
  ],
});

export const cabDecisionSchema = z.object({
  change_reference: z.string().min(1).max(40),
  outcome: z.enum(["approved", "approved_with_conditions", "deferred", "rejected"]),
  rationale: z.string().min(1).max(2000),
  decided_by: z.string().max(120).default("system"),
  decided_at: z.string(),
});

export const cabDecisionModel = defineModel({
  name: "cab.decision",
  table: "cab_decisions",
  schema: cabDecisionSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["change_reference", "outcome", "rationale"],
  publicFields: ["change_reference", "outcome", "rationale", "decided_by", "decided_at"],
  indexes: [{ fields: ["change_reference"] }, { fields: ["outcome"] }],
});

export const helpdeskTicketSchema = z.object({
  reference: z.string().min(1).max(40),
  title: z.string().min(1).max(180),
  description: z.string().max(4000).default(""),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  sla_status: z.enum(["on_track", "at_risk", "breached"]).default("on_track"),
  ticket_status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
});

export const helpdeskTicketModel = defineModel({
  name: "helpdesk.ticket",
  table: "hd_tickets",
  schema: helpdeskTicketSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["reference", "title", "description"],
  publicFields: ["reference", "title", "priority", "sla_status", "ticket_status"],
  actions: {
    resolve: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Resolve Ticket",
      handler: async ({ record, repository, actor }) => {
        return repository.update(String(record!.id), { ticket_status: "resolved" }, actor);
      },
    },
  },
  indexes: [
    { fields: ["tenant_id", "reference"], unique: true },
    { fields: ["sla_status"] },
    { fields: ["ticket_status"] },
  ],
});

export const cabRules: IrRuleInput[] = [
  { model_name: "project.project", role: "viewer", can_read: true },
  {
    model_name: "project.project",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "project.project",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "project.task", role: "viewer", can_read: true },
  {
    model_name: "project.task",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "project.task",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "cab.change", role: "viewer", can_read: true },
  {
    model_name: "cab.change",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "cab.change",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "cab.decision", role: "viewer", can_read: true },
  { model_name: "cab.decision", role: "admin", can_read: true, can_create: true },
  { model_name: "helpdesk.ticket", role: "viewer", can_read: true },
  {
    model_name: "helpdesk.ticket",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "helpdesk.ticket",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const cabViews: IrViewInput[] = [
  {
    model_name: "cab.change",
    view_type: "list",
    spec: {
      title: "CAB Change Requests (RFC)",
      description: "Change Advisory Board RFC review pipeline and risk matrix.",
      domainIcon: "arsy",
      columns: ["reference", "title", "project_code", "risk", "change_status"],
    },
  },
  {
    model_name: "helpdesk.ticket",
    view_type: "list",
    spec: {
      title: "Helpdesk SLA Tickets",
      description: "Operational support tickets and SLA breach tracking.",
      domainIcon: "arsy",
      columns: ["reference", "title", "priority", "sla_status", "ticket_status"],
    },
  },
];

export const cabMenus: IrMenuInput[] = [
  {
    menu_key: "cab.changes",
    label: "CAB & RFCs",
    href: "/models/cab.change",
    icon: "arsy",
    plane: "operations",
    sort_order: 28,
    min_role: "viewer",
  },
];

export function createCabAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: cabManifest,
    models: [
      projectProjectModel,
      projectTaskModel,
      cabChangeModel,
      cabDecisionModel,
      helpdeskTicketModel,
    ],
    rules: cabRules,
    views: cabViews,
    menus: cabMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/cab/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [projects, tasks, changes, tickets, changeGroups] = await Promise.all([
          projectProjectModel.repository.count({}, { tenantId }),
          projectTaskModel.repository.count({}, { tenantId }),
          cabChangeModel.repository.count({}, { tenantId }),
          helpdeskTicketModel.repository.count({}, { tenantId }),
          cabChangeModel.repository.readGroup({ groupBy: ["change_status"], tenantId }),
        ]);
        const byStatus: Record<string, number> = {};
        for (const g of changeGroups) {
          byStatus[String(g.change_status)] = Number(g.count ?? 0);
        }
        return {
          projects,
          tasks,
          changes,
          tickets,
          metrics: {
            submitted: (byStatus.submitted ?? 0) + (byStatus.in_review ?? 0),
            approved: byStatus.approved ?? 0,
            implemented: byStatus.implemented ?? 0,
          },
        };
      });
    },
  };
}

export const cabAddon = createCabAddon();
