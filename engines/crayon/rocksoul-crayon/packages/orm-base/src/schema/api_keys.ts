import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations.js';
import { users } from './users.js';
import { timestampColumns } from '../helpers/timestamps.js';
import { auditColumns } from '../helpers/audit.js';

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  orgId: text('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  scopes: text('scopes').notNull().default('["*"]'), // JSON array of permitted scopes
  expiresAt: text('expires_at'),
  lastUsedAt: text('last_used_at'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestampColumns(),
  ...auditColumns(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
