import { z } from "zod";
import { defineModel, SYSTEM_ACTOR, type ActorContext } from "@moonwitness/orm";

export const irAddonSchema = z.object({
  name: z.string().min(1).max(80),
  addon_version: z.string().min(1).max(40),
  description: z.string().max(500).default(""),
  category: z.string().max(80).default("general"),
  depends_json: z.string().default("[]"),
  provides_json: z.string().default("{}"),
  capabilities_json: z.string().default("[]"),
  schema_hash: z.string().default(""),
  state: z
    .enum(["discovered", "installing", "installed", "upgrade_pending", "disabled", "error"])
    .default("installed"),
  signature_status: z.enum(["unsigned", "verified", "invalid"]).default("unsigned"),
  signature_key_id: z.string().nullable().default(null),
  auto_install: z.boolean().default(true),
  failed_phase: z.string().nullable().default(null),
  last_error: z.string().nullable().default(null),
});

export const irAddonModel = defineModel({
  name: "ir.addon",
  table: "ir_addons",
  schema: irAddonSchema,
  softDelete: false,
  indexes: [{ fields: ["name"], unique: true }, { fields: ["state"] }],
});

export const irModelSchema = z.object({
  name: z.string().min(1).max(120),
  addon: z.string().min(1).max(80),
  table_name: z.string().min(1).max(120),
  extensible: z.boolean().default(false),
  soft_delete: z.boolean().default(true),
  rest_enabled: z.boolean().default(false),
  schema_json: z.string().default("{}"),
});

export const irModelRecord = defineModel({
  name: "ir.model",
  table: "ir_models",
  schema: irModelSchema,
  softDelete: false,
  indexes: [{ fields: ["name"], unique: true }, { fields: ["addon"] }],
});

export const irModelFieldSchema = z.object({
  model_name: z.string().min(1).max(120),
  field_name: z.string().min(1).max(120),
  field_type: z
    .enum(["text", "integer", "real", "boolean", "date", "json", "selection"])
    .default("text"),
  nullable: z.boolean().default(false),
  required: z.boolean().default(false),
  deprecated: z.boolean().default(false),
  is_custom: z.boolean().default(false),
  origin_addon: z.string().min(1).max(80),
  ui_widget: z.string().max(40).default("text"),
  label: z.string().max(160).default(""),
  selection_json: z.string().nullable().default(null),
  default_json: z.string().nullable().default(null),
});

export const irModelFieldModel = defineModel({
  name: "ir.model.field",
  table: "ir_model_fields",
  schema: irModelFieldSchema,
  softDelete: false,
  indexes: [{ fields: ["model_name", "field_name"], unique: true }, { fields: ["model_name"] }],
});

export const irRuleSchema = z.object({
  rule_key: z.string().min(1).max(160).nullable().default(null),
  model_name: z.string().min(1).max(120),
  role: z.enum(["admin", "editor", "viewer", "public"]).default("public"),
  addon: z.string().min(1).max(80),
  scope: z.enum(["global", "group"]).default("group"),
  groups_json: z.string().default("[]"),
  can_read: z.boolean().default(false),
  can_create: z.boolean().default(false),
  can_update: z.boolean().default(false),
  can_delete: z.boolean().default(false),
  domain_json: z.string().nullable().default(null),
});

export const irRuleModel = defineModel({
  name: "ir.rule",
  table: "ir_rules",
  schema: irRuleSchema,
  softDelete: false,
  indexes: [
    { fields: ["rule_key"], unique: true },
    { fields: ["model_name", "role"] },
    { fields: ["addon"] },
  ],
});

export const irViewSchema = z.object({
  model_name: z.string().min(1).max(120),
  view_type: z.enum(["list", "form", "detail", "kanban"]),
  addon: z.string().min(1).max(80),
  priority: z.number().int().default(10),
  action_bindings_json: z.string().nullable().default(null),
  spec_json: z.string().default("{}"),
});

export const irViewModel = defineModel({
  name: "ir.view",
  table: "ir_views",
  schema: irViewSchema,
  softDelete: false,
  indexes: [
    { fields: ["model_name", "view_type", "addon"], unique: true },
    { fields: ["model_name"] },
  ],
});

export const irMenuSchema = z.object({
  menu_key: z.string().min(1).max(120),
  addon: z.string().min(1).max(80),
  parent_key: z.string().max(120).nullable().default(null),
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(200),
  icon: z.string().max(60).default("dot"),
  plane: z.enum(["creator", "operations", "public"]).default("creator"),
  sort_order: z.number().int().default(50),
  min_role: z.enum(["admin", "editor", "viewer", "public"]).default("viewer"),
});

export const irMenuModel = defineModel({
  name: "ir.menu",
  table: "ir_menus",
  schema: irMenuSchema,
  softDelete: false,
  indexes: [{ fields: ["menu_key"], unique: true }, { fields: ["addon"] }],
});

// ============================================================================
// Constitutional Odoo-Grade __base Models (res.* & ir.*)
// ============================================================================

export const resCompanySchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(160),
  parent_id: z.string().max(120).nullable().default(null),
  domain: z.string().max(200).nullable().default(null),
  default_locale: z.string().min(2).max(16).default("en"),
  timezone: z.string().min(1).max(64).default("UTC"),
  currency: z.string().min(3).max(8).default("USD"),
  is_active: z.boolean().default(true),
  settings_json: z.string().default("{}"),
});

export const resCompanyModel = defineModel({
  name: "res.company",
  table: "res_companies",
  schema: resCompanySchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["slug", "name", "domain"],
  indexes: [{ fields: ["slug"], unique: true }, { fields: ["is_active"] }],
});

export const resTenantModel = resCompanyModel;

export const resGroupsSchema = z.object({
  group_key: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  category: z.string().max(80).default("base"),
  implied_ids_json: z.string().default("[]"),
  users_json: z.string().default("[]"),
  comment: z.string().max(400).default(""),
});

export const resGroupsModel = defineModel({
  name: "res.groups",
  table: "res_groups",
  schema: resGroupsSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["group_key", "name", "category"],
  indexes: [{ fields: ["group_key"], unique: true }, { fields: ["category"] }],
});

export const resPartnerSchema = z.object({
  partner_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  partner_type: z.enum(["human", "agent", "service", "organization", "probe"]).default("human"),
  email: z.string().max(200).nullable().default(null),
  company_slug: z.string().max(64).default("default"),
  locale: z.string().max(16).default("en"),
  timezone: z.string().max(64).default("UTC"),
  active: z.boolean().default(true),
  metadata_json: z.string().default("{}"),
});

export const resPartnerModel = defineModel({
  name: "res.partner",
  table: "res_partners",
  schema: resPartnerSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["partner_key", "name", "email", "partner_type"],
  indexes: [{ fields: ["tenant_id", "partner_key"], unique: true }, { fields: ["partner_type"] }],
});

export const resLangSchema = z.object({
  code: z.string().min(2).max(16),
  iso_code: z.string().min(2).max(16),
  name: z.string().min(1).max(120),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
  date_format: z.string().max(40).default("YYYY-MM-DD"),
  active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export const resLangModel = defineModel({
  name: "res.lang",
  table: "res_langs",
  schema: resLangSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name"],
  indexes: [{ fields: ["code"], unique: true }, { fields: ["active"] }],
});

export const irModelDataSchema = z.object({
  module: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  model: z.string().min(1).max(120),
  res_id: z.string().min(1).max(120),
  noupdate: z.boolean().default(true),
});

export const irModelDataModel = defineModel({
  name: "ir.model.data",
  table: "ir_model_data",
  schema: irModelDataSchema,
  softDelete: false,
  indexes: [{ fields: ["module", "name"], unique: true }, { fields: ["model", "res_id"] }],
});

export const irConfigParameterSchema = z.object({
  key: z.string().min(1).max(160),
  value: z.string().max(8000),
  is_secret: z.boolean().default(false),
  description: z.string().max(400).default(""),
});

export const irConfigParameterModel = defineModel({
  name: "ir.config_parameter",
  table: "ir_config_parameters",
  schema: irConfigParameterSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["key", "description"],
  indexes: [{ fields: ["tenant_id", "key"], unique: true }],
});

export const irSequenceSchema = z.object({
  code: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  prefix: z.string().max(40).default(""),
  suffix: z.string().max(40).default(""),
  padding: z.number().int().min(0).max(20).default(4),
  number_next: z.number().int().min(1).default(1),
  number_increment: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
});

export const irSequenceModel = defineModel({
  name: "ir.sequence",
  table: "ir_sequences",
  schema: irSequenceSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name"],
  indexes: [{ fields: ["tenant_id", "code"], unique: true }],
});

export const irCronSchema = z.object({
  cron_key: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  addon: z.string().min(1).max(80),
  model_name: z.string().min(1).max(120),
  action_name: z.string().min(1).max(120),
  interval_sec: z.number().int().min(1).default(300),
  active: z.boolean().default(true),
  last_run_at: z.string().nullable().default(null),
  next_run_at: z.string().nullable().default(null),
  payload_json: z.string().default("{}"),
});

export const irCronModel = defineModel({
  name: "ir.cron",
  table: "ir_crons",
  schema: irCronSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["cron_key", "name", "model_name"],
  indexes: [{ fields: ["cron_key"], unique: true }, { fields: ["active"] }],
});

export const irCronLogSchema = z.object({
  cron_key: z.string().min(1).max(120),
  run_status: z.enum(["success", "failed"]).default("success"),
  executed_at: z.string(),
  duration_ms: z.number().int().nonnegative().default(0),
  message: z.string().max(1000).default(""),
  error: z.string().max(2000).nullable().default(null),
});

export const irCronLogModel = defineModel({
  name: "ir.cron.log",
  table: "ir_cron_logs",
  schema: irCronLogSchema,
  softDelete: false,
  restEnabled: true,
  retention: { maxRows: 500, orderField: "executed_at" },
  searchFields: ["cron_key", "run_status", "message"],
  indexes: [{ fields: ["cron_key", "executed_at"] }, { fields: ["run_status"] }],
});

export const resCountrySchema = z.object({
  code: z.string().min(2).max(2),
  code3: z.string().max(3).default(""),
  name: z.string().min(1).max(120),
  native_name: z.string().max(120).default(""),
  dial_code: z.string().max(20).default(""),
  currency_code: z.string().max(8).default("USD"),
  flag_emoji: z.string().max(16).default(""),
  active: z.boolean().default(true),
});

export const resCountryModel = defineModel({
  name: "res.country",
  table: "res_countries",
  schema: resCountrySchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name", "native_name"],
  indexes: [{ fields: ["code"], unique: true }, { fields: ["active"] }],
});

export const resCurrencySchema = z.object({
  code: z.string().min(3).max(8),
  name: z.string().min(1).max(80),
  symbol: z.string().min(1).max(12),
  decimals: z.number().int().min(0).max(8).default(2),
  rounding: z.number().positive().default(0.01),
  active: z.boolean().default(true),
});

export const resCurrencyModel = defineModel({
  name: "res.currency",
  table: "res_currencies",
  schema: resCurrencySchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["code", "name", "symbol"],
  indexes: [{ fields: ["code"], unique: true }, { fields: ["active"] }],
});

export const irAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  res_model: z.string().max(120).nullable().default(null),
  res_id: z.string().max(120).nullable().default(null),
  mimetype: z.string().max(120).default("application/octet-stream"),
  file_size: z.number().int().nonnegative().default(0),
  url: z.string().max(1000).nullable().default(null),
  checksum: z.string().max(128).nullable().default(null),
  company_slug: z.string().max(64).default("default"),
});

export const irAttachmentModel = defineModel({
  name: "ir.attachment",
  table: "ir_attachments",
  schema: irAttachmentSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["name", "res_model", "mimetype"],
  indexes: [{ fields: ["res_model", "res_id"] }, { fields: ["company_slug"] }],
});

export const mailMessageSchema = z.object({
  res_model: z.string().min(1).max(120),
  res_id: z.string().min(1).max(120),
  message_type: z.enum(["comment", "notification", "tracking"]).default("notification"),
  body: z.string().max(8000).default(""),
  author_id: z.string().max(120).nullable().default(null),
});

export const mailMessageModel = defineModel({
  name: "mail.message",
  table: "mail_messages",
  schema: mailMessageSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["res_model", "res_id", "body"],
  relations: {
    tracking_values: {
      model: "mail.tracking.value",
      type: "one2many",
      targetField: "id",
      inverseField: "message_id",
    },
  },
  indexes: [{ fields: ["res_model", "res_id"] }, { fields: ["message_type"] }],
});

export const mailTrackingValueSchema = z.object({
  message_id: z.string().min(1).max(120),
  field_name: z.string().min(1).max(120),
  old_value: z.string().max(2000).nullable().default(null),
  new_value: z.string().max(2000).nullable().default(null),
});

export const mailTrackingValueModel = defineModel({
  name: "mail.tracking.value",
  table: "mail_tracking_values",
  schema: mailTrackingValueSchema,
  softDelete: false,
  restEnabled: true,
  indexes: [{ fields: ["message_id"] }],
});

export async function postChatterMessage(input: {
  resModel: string;
  resId: string;
  body?: string;
  messageType?: "comment" | "notification" | "tracking";
  trackingValues?: Array<{
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
  actor?: ActorContext;
}) {
  const actor = input.actor ?? SYSTEM_ACTOR;
  const message = await mailMessageModel.repository.create(
    {
      res_model: input.resModel,
      res_id: input.resId,
      message_type:
        input.messageType ?? (input.trackingValues?.length ? "tracking" : "notification"),
      body: input.body ?? "",
      author_id: actor.actorId,
    },
    actor,
  );
  for (const track of input.trackingValues ?? []) {
    await mailTrackingValueModel.repository.create(
      {
        message_id: message.id,
        field_name: track.fieldName,
        old_value: track.oldValue,
        new_value: track.newValue,
      },
      actor,
    );
  }
  return message;
}

export async function getConfigParam(key: string, tenantId = "default"): Promise<string | null> {
  const rows = await irConfigParameterModel.repository.find({ key }, { tenantId, limit: 1 });
  return rows[0]?.value ?? null;
}

export async function setConfigParam(
  key: string,
  value: string,
  options: { isSecret?: boolean; description?: string; actor?: ActorContext } = {},
): Promise<void> {
  const actor = options.actor ?? SYSTEM_ACTOR;
  await irConfigParameterModel.repository.upsert(
    { key },
    {
      key,
      value,
      is_secret: options.isSecret ?? false,
      description: options.description ?? "",
    },
    actor,
  );
}

export async function nextSequenceByCode(
  code: string,
  options: {
    prefix?: string;
    suffix?: string;
    padding?: number;
    step?: number;
    name?: string;
    actor?: ActorContext;
  } = {},
): Promise<string> {
  const actor = options.actor ?? SYSTEM_ACTOR;
  const tenantId = actor.tenantId ?? "default";
  const existingRows = await irSequenceModel.repository.find({ code }, { tenantId, limit: 1 });

  let row = existingRows[0];
  if (!row) {
    row = await irSequenceModel.repository.create(
      {
        code,
        name: options.name ?? code,
        prefix: options.prefix ?? "",
        suffix: options.suffix ?? "",
        padding: options.padding ?? 4,
        number_next: 1,
        number_increment: options.step ?? 1,
        active: true,
      },
      actor,
    );
  }

  const currentNumber = row.number_next;
  const nextNumber = currentNumber + row.number_increment;
  await irSequenceModel.repository.update(row.id, { number_next: nextNumber }, actor);

  const padded =
    row.padding > 0 ? String(currentNumber).padStart(row.padding, "0") : String(currentNumber);
  return `${row.prefix}${padded}${row.suffix}`;
}

export const irSystemModels = [
  irAddonModel,
  irModelRecord,
  irModelFieldModel,
  irRuleModel,
  irViewModel,
  irMenuModel,
  resCompanyModel,
  resGroupsModel,
  resPartnerModel,
  resLangModel,
  resCountryModel,
  resCurrencyModel,
  irModelDataModel,
  irConfigParameterModel,
  irSequenceModel,
  irCronModel,
  irCronLogModel,
  irAttachmentModel,
  mailMessageModel,
  mailTrackingValueModel,
];
