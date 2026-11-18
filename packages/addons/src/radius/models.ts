import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const radiusClientSchema = z.object({
  client_key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  address: z.string().max(255).nullable().default(null),
  secret_hint: z.string().max(255).nullable().default(null),
  enabled: z.boolean().default(true),
  metadata_json: z.string().nullable().default(null),
});

export const radiusSessionSchema = z.object({
  session_key: z.string().min(1).max(200),
  username: z.string().max(120).nullable().default(null),
  client_key: z.string().max(120).nullable().default(null),
  nas_ip: z.string().max(128).nullable().default(null),
  framed_ip: z.string().max(128).nullable().default(null),
  started_at: z.string().nullable().default(null),
  ended_at: z.string().nullable().default(null),
  acct_status: z.string().max(40).nullable().default(null),
  bytes_in: z.number().int().nonnegative().nullable().default(null),
  bytes_out: z.number().int().nonnegative().nullable().default(null),
  metadata_json: z.string().nullable().default(null),
});

export const radiusClientModel = defineModel({
  name: "radius.client",
  table: "radius_clients",
  schema: radiusClientSchema,
  restEnabled: false,
  publicFields: ["client_key", "name", "enabled"],
  indexes: [
    { fields: ["client_key"], unique: true },
    { fields: ["name"] },
    { fields: ["enabled"] },
  ],
});

export const radiusSessionModel = defineModel({
  name: "radius.session",
  table: "radius_sessions",
  schema: radiusSessionSchema,
  softDelete: false,
  restEnabled: false,
  publicFields: ["session_key", "username", "acct_status", "started_at"],
  indexes: [
    { fields: ["session_key"], unique: true },
    { fields: ["username"] },
    { fields: ["client_key"] },
    { fields: ["started_at"] },
  ],
});
