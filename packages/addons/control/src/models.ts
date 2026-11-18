import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const controlCommandSchema = z.object({
  actor_id: z.string().max(200).nullable().default(null),
  actor_role: z.string().max(40).nullable().default(null),
  target_path: z.string().min(1).max(300),
  method: z.string().min(1).max(16),
  upstream_url: z.string().max(1000).nullable().default(null),
  request_body_json: z.string().nullable().default(null),
  response_status: z.number().int().nullable().default(null),
  outcome: z.enum(["success", "failure", "denied"]).nullable().default(null),
  correlation_id: z.string().max(200).nullable().default(null),
  executed_at: z.string(),
});

export const controlCommandModel = defineModel({
  name: "control.command",
  table: "control_command_history",
  schema: controlCommandSchema,
  softDelete: false,
  restEnabled: false,
  publicFields: ["target_path", "method", "response_status", "outcome", "executed_at"],
  indexes: [{ fields: ["executed_at"] }, { fields: ["actor_id"] }, { fields: ["target_path"] }],
});
