import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const workflowSchema = z.object({
  workflow_key: z.string().min(1).max(120),
  actor_id: z.string().min(1).max(200),
  name: z.string().min(1).max(160),
  detail: z.string().min(1).max(500),
  workflow_status: z.enum(["Queued", "Running", "Paused", "Succeeded", "Failed", "Cancelled"]),
  sort_order: z.number().int().default(0),
  metadata_json: z.string().nullable().default(null),
});

export const workflowModel = defineModel({
  name: "command.workflow",
  table: "command_center_workflows_orm",
  schema: workflowSchema,
  extensible: true,
  restEnabled: false,
  publicFields: ["workflow_key", "name", "detail", "workflow_status"],
  indexes: [
    { fields: ["tenant_id", "actor_id", "workflow_key"], unique: true },
    { fields: ["actor_id", "workflow_status"] },
  ],
});

export const alertSchema = z.object({
  alert_key: z.string().min(1).max(120),
  actor_id: z.string().min(1).max(200),
  text: z.string().min(1).max(1000),
  ago_label: z.string().max(80).nullable().default(null),
  level: z.enum(["high", "medium", "low"]),
  dismissed: z.boolean().default(false),
  dismissed_at: z.string().nullable().default(null),
});

export const alertModel = defineModel({
  name: "command.alert",
  table: "command_center_alerts_orm",
  schema: alertSchema,
  extensible: true,
  restEnabled: false,
  publicFields: ["alert_key", "text", "level", "dismissed"],
  indexes: [
    { fields: ["tenant_id", "actor_id", "alert_key"], unique: true },
    { fields: ["actor_id", "dismissed"] },
  ],
});
