import { z } from "zod";
import { defineModel, type Migration } from "@moonwitness/orm";

export const userProfileSchema = z.object({
  legacy_user_id: z.number().int().positive().nullable(),
  username: z.string().min(1).max(80),
  email: z.string().email().max(320),
  password_hash: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
  display_name: z.string().min(1).max(160),
  is_active: z.boolean().default(true),
  last_login_at: z.string().datetime().nullable(),
});

export const identitySessionSchema = z.object({
  session_token: z.string().min(1).max(200),
  user_ref: z.string().min(1).max(200),
  revoked: z.boolean().default(false),
  expires_at: z.string().datetime(),
  ip_address: z.string().max(128).nullable(),
  user_agent: z.string().max(500).nullable(),
});

export const oauthTokenSchema = z.object({
  session_ref: z.string().min(1).max(200),
  client_id: z.string().min(1).max(128),
  access_token: z.string().min(1),
  refresh_token: z.string().nullable(),
  id_token: z.string().nullable(),
  expires_at: z.string().datetime(),
});

export const authEventSchema = z.object({
  actor_user_ref: z.string().max(200).nullable(),
  username: z.string().max(80).nullable(),
  event_type: z.string().min(1).max(80),
  outcome: z.enum(["success", "failure", "denied"]),
  reason: z.string().max(500).nullable(),
  ip_address: z.string().max(128).nullable(),
  user_agent: z.string().max(500).nullable(),
  correlation_id: z.string().max(200).nullable(),
  occurred_at: z.string().datetime(),
});

export const userProfileModel = defineModel({
  name: "identity.user_profile",
  table: "identity_user_profiles",
  schema: userProfileSchema,
  indexes: [
    { fields: ["username"], unique: true },
    { fields: ["email"], unique: true },
    { fields: ["legacy_user_id"], unique: true },
  ],
});

export const identitySessionModel = defineModel({
  name: "identity.session",
  table: "identity_sessions",
  schema: identitySessionSchema,
  indexes: [{ fields: ["session_token"], unique: true }, { fields: ["user_ref"] }, { fields: ["expires_at"] }],
});

export const oauthTokenModel = defineModel({
  name: "identity.oauth_token",
  table: "identity_oauth_tokens",
  schema: oauthTokenSchema,
  indexes: [{ fields: ["session_ref"], unique: true }, { fields: ["expires_at"] }],
});

export const authEventModel = defineModel({
  name: "identity.auth_event",
  table: "identity_auth_events",
  schema: authEventSchema,
  softDelete: false,
  indexes: [{ fields: ["event_type", "occurred_at"] }, { fields: ["actor_user_ref"] }],
});

export const identityMigrations: Migration[] = [
  { id: "020_create_identity_user_profiles", up: userProfileModel.ddl },
  { id: "021_create_identity_sessions", up: identitySessionModel.ddl },
  { id: "022_create_identity_oauth_tokens", up: oauthTokenModel.ddl },
  { id: "023_create_identity_auth_events", up: authEventModel.ddl },
];