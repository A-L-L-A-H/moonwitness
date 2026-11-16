import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const landingLeads = sqliteTable('landing_leads', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'contacted', 'resolved'] })
    .notNull()
    .default('new'),
  ...timestampColumns(),
});

export type LandingLead = typeof landingLeads.$inferSelect;
export type NewLandingLead = typeof landingLeads.$inferInsert;
