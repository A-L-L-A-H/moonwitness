import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';
import { organizations } from './organizations.js';
import { timestampColumns } from '../helpers/timestamps.js';
import { auditColumns } from '../helpers/audit.js';

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  orgId: text('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'account' | 'appearance' | 'billing' | 'notifications' | 'connections' | 'system'
  key: text('key').notNull(),
  value: text('value').notNull(), // JSON serialized value or string
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  ...timestampColumns(),
  ...auditColumns(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
