import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns } from '@rocksoul/orm-base';

export const mails = sqliteTable('mails', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  text: text('text').notNull(),
  folder: text('folder', { enum: ['inbox', 'sent', 'draft', 'trash', 'archive'] })
    .notNull()
    .default('inbox'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  labels: text('labels'), // JSON array string e.g. ["work", "important"]
  date: text('date').notNull(),
  ...timestampColumns(),
});

export type Mail = typeof mails.$inferSelect;
export type NewMail = typeof mails.$inferInsert;
