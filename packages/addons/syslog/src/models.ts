import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const syslogEntrySchema = z.object({
  source_host: z.string().max(255).nullable().default(null),
  app_name: z.string().max(120).nullable().default(null),
  facility: z.string().max(40).nullable().default(null),
  severity: z.string().max(40).nullable().default(null),
  message: z.string().min(1),
  received_at: z.string(),
  raw_json: z.string().nullable().default(null),
  retention_days: z.number().int().positive().nullable().default(null),
});

export const syslogEntryModel = defineModel({
  name: "syslog.entry",
  table: "syslog_entries",
  schema: syslogEntrySchema,
  softDelete: false,
  restEnabled: false,
  publicFields: ["source_host", "app_name", "severity", "received_at"],
  indexes: [
    { fields: ["received_at"] },
    { fields: ["source_host", "received_at"] },
    { fields: ["severity"] },
  ],
});
