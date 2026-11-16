import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns } from '@rocksoul/orm-base';

export const calendars = sqliteTable('calendars', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  type: text('type', { enum: ['personal', 'work', 'shared'] }).notNull().default('personal'),
  ...timestampColumns(),
});

export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
