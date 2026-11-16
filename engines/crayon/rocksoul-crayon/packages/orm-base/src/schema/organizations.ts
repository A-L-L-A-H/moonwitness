import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '../helpers/timestamps.js';
import { auditColumns } from '../helpers/audit.js';

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  currency: text('currency').notNull().default('IDR'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestampColumns(),
  ...auditColumns(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
