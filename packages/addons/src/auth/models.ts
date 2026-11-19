import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const authUserSchema = z.object({
  legacy_user_id: z.number().int().positive().nullable().default(null),
  username: z.string().min(1).max(80),
  email: z.string().email().max(320),
  password_hash: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
  display_name: z.string().min(1).max(160),
  is_active: z.boolean().default(true),
  last_login_at: z.string().nullable().default(null),
  company_id: z.string().max(64).default("default"),
  company_ids_json: z.string().default('["default"]'),
  partner_id: z.string().max(120).nullable().default(null),
  group_keys_json: z.string().default("[]"),
});

export const authUserModel = defineModel({
  name: "auth.user",
  table: "auth_users",
  schema: authUserSchema,
  softDelete: false,
  restEnabled: false,
  searchFields: ["username", "email", "display_name"],
  publicFields: [
    "id",
    "username",
    "email",
    "role",
    "display_name",
    "is_active",
    "company_id",
  ],
  indexes: [
    { fields: ["username"], unique: true },
    { fields: ["email"], unique: true },
    { fields: ["legacy_user_id"], unique: true },
    { fields: ["company_id"] },
  ],
});

export const authSessionSchema = z.object({
  session_token: z.string().min(1).max(200),
  user_id: z.string().min(1).max(200),
  revoked: z.boolean().default(false),
  expires_at: z.string(),
  ip_address: z.string().max(128).nullable().default(null),
  user_agent: z.string().max(500).nullable().default(null),
});

export const authSessionModel = defineModel({
  name: "auth.session",
  table: "auth_sessions",
  schema: authSessionSchema,
  softDelete: false,
  restEnabled: false,
  indexes: [
    { fields: ["session_token"], unique: true },
    { fields: ["user_id"] },
    { fields: ["expires_at"] },
  ],
});

export const authOAuthTokenSchema = z.object({
  session_token: z.string().min(1).max(200),
  client_id: z.string().min(1).max(128),
  access_token: z.string().min(1),
  refresh_token: z.string().nullable().default(null),
  id_token: z.string().nullable().default(null),
  expires_at: z.string(),
});

export const authOAuthTokenModel = defineModel({
  name: "auth.oauth_token",
  table: "auth_oauth_tokens",
  schema: authOAuthTokenSchema,
  softDelete: false,
  restEnabled: false,
  indexes: [{ fields: ["session_token"], unique: true }, { fields: ["expires_at"] }],
});
