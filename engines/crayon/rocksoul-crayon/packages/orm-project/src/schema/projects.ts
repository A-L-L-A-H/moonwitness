import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations, users, timestampColumns, auditColumns } from '@rocksoul/orm-base';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  orgId: text('org_id').references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  status: text('status', {
    enum: ['planned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
  }).notNull().default('planned'),
  ownerId: text('owner_id').references(() => users.id),
  budget: integer('budget').default(0),
  ...timestampColumns(),
  ...auditColumns(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
