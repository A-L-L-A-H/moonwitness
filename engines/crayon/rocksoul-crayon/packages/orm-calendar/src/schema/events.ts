import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns } from '@rocksoul/orm-base';
import { calendars } from './calendars.js';

export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  calendarId: text('calendar_id').references(() => calendars.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  time: text('time'),
  duration: text('duration'),
  type: text('type', { enum: ['meeting', 'event', 'personal', 'task', 'reminder'] })
    .notNull()
    .default('meeting'),
  attendees: text('attendees'), // JSON array string
  location: text('location'),
  color: text('color'),
  ...timestampColumns(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
