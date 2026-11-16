import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from '@rocksoul/orm-base';
import { chatConversations } from './conversations.js';

export const chatParticipants = sqliteTable('chat_participants', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member'),
  joinedAt: text('joined_at').notNull(),
});

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;
