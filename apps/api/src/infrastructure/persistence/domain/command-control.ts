import { z } from "zod";
import { defineModel, type Migration } from "@moonwitness/orm";

export const workflowSchema = z.object({
  workflow_key: z.string().min(1).max(120),
  actor_id: z.string().min(1).max(200),
  name: z.string().min(1).max(160),
  detail: z.string().min(1).max(500),
  workflow_status: z.enum(["Queued", "Running", "Paused", "Succeeded", "Failed", "Cancelled"]),
  sort_order: z.number().int().default(0),
  metadata_json: z.string().nullable(),
});

export const alertSchema = z.object({
  alert_key: z.string().min(1).max(120),
  actor_id: z.string().min(1).max(200),
  text: z.string().min(1).max(1000),
  ago_label: z.string().max(80).nullable(),
  level: z.enum(["high", "medium", "low"]),
  dismissed: z.boolean().default(false),
  dismissed_at: z.string().datetime().nullable(),
});

export const controlCommandSchema = z.object({
  actor_id: z.string().max(200).nullable(),
  actor_role: z.string().max(40).nullable(),
  target_path: z.string().min(1).max(300),
  method: z.string().min(1).max(16),
  upstream_url: z.string().max(1000).nullable(),
  request_body_json: z.string().nullable(),
  response_status: z.number().int().nullable(),
  outcome: z.enum(["success", "failure", "denied"]).nullable(),
  correlation_id: z.string().max(200).nullable(),
  executed_at: z.string().datetime(),
});

export const workflowModel = defineModel({
  name: "command.workflow",
  table: "command_center_workflows_orm",
  schema: workflowSchema,
  indexes: [{ fields: ["actor_id", "workflow_key"], unique: true }, { fields: ["actor_id", "workflow_status"] }],
});

export const alertModel = defineModel({
  name: "command.alert",
  table: "command_center_alerts_orm",
  schema: alertSchema,
  indexes: [{ fields: ["actor_id", "alert_key"], unique: true }, { fields: ["actor_id", "dismissed"] }],
});

export const controlCommandModel = defineModel({
  name: "control.command",
  table: "control_command_history",
  schema: controlCommandSchema,
  softDelete: false,
  indexes: [{ fields: ["executed_at"] }, { fields: ["actor_id"] }, { fields: ["target_path"] }],
});

export const commandControlMigrations: Migration[] = [
  { id: "060_create_command_center_workflows_orm", up: workflowModel.ddl },
  { id: "061_create_command_center_alerts_orm", up: alertModel.ddl },
  { id: "062_create_control_command_history", up: controlCommandModel.ddl },
];