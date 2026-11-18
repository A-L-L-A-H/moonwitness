import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const auditLogSchema = z.object({
  domain: z.string().min(1).max(80),
  entity: z.string().min(1).max(120),
  entity_id: z.string().min(1).max(200),
  action: z.enum(["CREATE", "UPDATE", "ARCHIVE", "RESTORE", "DELETE", "EXECUTE", "ACCESS"]),
  actor_id: z.string().max(200).nullable().default(null),
  actor_role: z.string().max(80).nullable().default(null),
  correlation_id: z.string().max(200).nullable().default(null),
  request_path: z.string().max(500).nullable().default(null),
  outcome: z.enum(["success", "failure", "denied"]).default("success"),
  before_json: z.string().nullable().default(null),
  after_json: z.string().nullable().default(null),
  metadata_json: z.string().nullable().default(null),
  occurred_at: z.string(),
});

export const auditLogModel = defineModel({
  name: "ops.audit_log",
  table: "ops_audit_logs",
  schema: auditLogSchema,
  softDelete: false,
  restEnabled: true,
  publicFields: ["id", "domain", "entity", "entity_id", "action", "outcome", "occurred_at"],
  indexes: [
    { fields: ["domain", "occurred_at"] },
    { fields: ["entity", "entity_id"] },
    { fields: ["actor_id", "occurred_at"] },
    { fields: ["correlation_id"] },
  ],
});
