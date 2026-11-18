import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const irAddonSchema = z.object({
  name: z.string().min(1).max(80),
  addon_version: z.string().min(1).max(40),
  description: z.string().max(500).default(""),
  category: z.string().max(80).default("general"),
  depends_json: z.string().default("[]"),
  provides_json: z.string().default("{}"),
  schema_hash: z.string().default(""),
  state: z.enum(["installed", "disabled", "upgrade_pending", "error"]).default("installed"),
  auto_install: z.boolean().default(true),
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
  model_name: z.string().min(1).max(120),
  role: z.enum(["admin", "editor", "viewer", "public"]),
  addon: z.string().min(1).max(80),
  can_read: z.boolean().default(false),
  can_create: z.boolean().default(false),
  can_update: z.boolean().default(false),
  can_delete: z.boolean().default(false),
});

export const irRuleModel = defineModel({
  name: "ir.rule",
  table: "ir_rules",
  schema: irRuleSchema,
  softDelete: false,
  indexes: [{ fields: ["model_name", "role"], unique: true }, { fields: ["addon"] }],
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

export const irSystemModels = [
  irAddonModel,
  irModelRecord,
  irModelFieldModel,
  irRuleModel,
  irViewModel,
  irMenuModel,
];
