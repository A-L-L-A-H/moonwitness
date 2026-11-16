import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const aepSessions = sqliteTable('aep_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resumeTokenHash: text('resume_token_hash').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  replayUntil: text('replay_until').notNull(),
  lastSeenAt: text('last_seen_at').notNull(),
  isRevoked: integer('is_revoked', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type AepSession = typeof aepSessions.$inferSelect;
export type NewAepSession = typeof aepSessions.$inferInsert;
