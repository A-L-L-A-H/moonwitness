import type { Migration } from "@moonwitness/orm";

/**
 * Retired legacy `identity_*` and raw `users`/`sessions` migrations.
 * Canonical identity tables (`auth_users`, `auth_sessions`, `auth_oauth_tokens`)
 * are owned and auto-synced by `@moonwitness/addon-auth`.
 */
export const authMigrations: Migration[] = [];
export type AuthMigration = Migration;
