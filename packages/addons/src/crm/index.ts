import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  postChatterMessage,
  resolveActorTenantFromBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const crmManifest = manifestData as AddonManifestInput;

export const crmStageSchema = z.object({
  stage_key: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  sequence: z.number().int().default(10),
  probability: z.number().min(0).max(100).default(10),
  is_won: z.boolean().default(false),
});

export const crmStageModel = defineModel({
  name: "crm.stage",
  table: "crm_stages",
  schema: crmStageSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["stage_key", "name"],
  publicFields: ["stage_key", "name", "sequence", "probability", "is_won"],
  indexes: [{ fields: ["tenant_id", "stage_key"], unique: true }, { fields: ["sequence"] }],
});

export const crmLeadSchema = z.object({
  lead_key: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  partner_name: z.string().max(160).nullable().default(null),
  email: z.string().max(200).nullable().default(null),
  stage_key: z.string().max(64).default("new"),
  expected_revenue: z.number().nonnegative().default(0),
  probability: z.number().min(0).max(100).default(10),
  priority: z.enum(["low", "normal", "high", "very_high"]).default("normal"),
});

export const crmLeadModel = defineModel({
  name: "crm.lead",
  table: "crm_leads",
  schema: crmLeadSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["lead_key", "name", "partner_name", "email", "stage_key"],
  publicFields: [
    "lead_key",
    "name",
    "partner_name",
    "stage_key",
    "expected_revenue",
    "probability",
    "priority",
  ],
  computed: {
    weighted_revenue: (row) =>
      Math.round((Number(row.expected_revenue ?? 0) * Number(row.probability ?? 0)) / 100),
  },
  actions: {
    mark_won: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Mark Won",
      handler: async ({ record, repository, actor }) => {
        const updated = await repository.update(
          String(record!.id),
          { stage_key: "won", probability: 100 },
          actor,
        );
        await postChatterMessage({
          resModel: "crm.lead",
          resId: String(record!.id),
          body: `Lead '${String(record!.name)}' marked WON`,
          actor,
        });
        return updated;
      },
    },
    mark_lost: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Mark Lost",
      handler: async ({ record, repository, actor }) =>
        repository.update(String(record!.id), { stage_key: "lost", probability: 0 }, actor),
    },
  },
  indexes: [
    { fields: ["tenant_id", "lead_key"], unique: true },
    { fields: ["stage_key"] },
    { fields: ["priority"] },
  ],
});

export const mailActivitySchema = z.object({
  res_model: z.string().min(1).max(120),
  res_id: z.string().min(1).max(120),
  activity_type: z.enum(["todo", "call", "meeting", "review"]).default("todo"),
  summary: z.string().min(1).max(240),
  date_due: z.string().max(40),
  assignee_id: z.string().max(120).nullable().default(null),
  activity_state: z.enum(["planned", "done", "cancelled"]).default("planned"),
});

export const mailActivityModel = defineModel({
  name: "mail.activity",
  table: "mail_activities",
  schema: mailActivitySchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["res_model", "res_id", "summary", "activity_type"],
  publicFields: [
    "res_model",
    "res_id",
    "activity_type",
    "summary",
    "date_due",
    "activity_state",
  ],
  actions: {
    mark_done: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Mark Done",
      handler: async ({ record, repository, actor }) =>
        repository.update(String(record!.id), { activity_state: "done" }, actor),
    },
  },
  indexes: [
    { fields: ["res_model", "res_id"] },
    { fields: ["activity_state"] },
  ],
});

export const crmData: AddonDataRecord[] = [
  {
    id: "crm_stage_new",
    model: "crm.stage",
    key: { stage_key: "new" },
    noupdate: true,
    values: { stage_key: "new", name: "New", sequence: 10, probability: 10, is_won: false },
  },
  {
    id: "crm_stage_qualified",
    model: "crm.stage",
    key: { stage_key: "qualified" },
    noupdate: true,
    values: {
      stage_key: "qualified",
      name: "Qualified",
      sequence: 20,
      probability: 30,
      is_won: false,
    },
  },
  {
    id: "crm_stage_proposition",
    model: "crm.stage",
    key: { stage_key: "proposition" },
    noupdate: true,
    values: {
      stage_key: "proposition",
      name: "Proposition",
      sequence: 30,
      probability: 60,
      is_won: false,
    },
  },
  {
    id: "crm_stage_won",
    model: "crm.stage",
    key: { stage_key: "won" },
    noupdate: true,
    values: { stage_key: "won", name: "Won", sequence: 40, probability: 100, is_won: true },
  },
];

export const crmRules: IrRuleInput[] = [
  { model_name: "crm.stage", role: "viewer", can_read: true },
  {
    model_name: "crm.stage",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "crm.lead", role: "viewer", can_read: true },
  {
    model_name: "crm.lead",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "crm.lead",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "mail.activity", role: "viewer", can_read: true },
  {
    model_name: "mail.activity",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "mail.activity",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const crmViews: IrViewInput[] = [
  {
    model_name: "crm.lead",
    view_type: "list",
    spec: {
      title: "CRM Opportunity Pipeline",
      description: "Lead stages, expected revenue, and scheduled mail activities.",
      domainIcon: "arsy",
      columns: ["lead_key", "name", "partner_name", "stage_key", "expected_revenue", "priority"],
    },
  },
];

export const crmMenus: IrMenuInput[] = [
  {
    menu_key: "crm.leads",
    label: "CRM Pipeline",
    href: "/models/crm.lead",
    icon: "arsy",
    plane: "operations",
    sort_order: 82,
    min_role: "viewer",
  },
];

export function createCrmAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: crmManifest,
    models: [crmStageModel, crmLeadModel, mailActivityModel],
    rules: crmRules,
    views: crmViews,
    menus: crmMenus,
    data: crmData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/crm/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [stages, leads, activities, byStage] = await Promise.all([
          crmStageModel.repository.count({}, { tenantId }),
          crmLeadModel.repository.count({}, { tenantId }),
          mailActivityModel.repository.count({ activity_state: "planned" }, { tenantId }),
          crmLeadModel.repository.readGroup({
            groupBy: ["stage_key"],
            aggregates: {
              count: { fn: "count" },
              revenue: { fn: "sum", field: "expected_revenue" },
            },
            tenantId,
          }),
        ]);
        return { stages, leads, plannedActivities: activities, byStage };
      });
    },
  };
}

export const crmAddon = createCrmAddon();
