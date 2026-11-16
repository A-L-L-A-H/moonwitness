import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns } from '@rocksoul/orm-base';
import { chatConversations } from './conversations.js';

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(), // "msg-1-1"
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  type: text('type').notNull().default('text'),
  isEdited: integer('is_edited', { mode: 'boolean' }).notNull().default(false),
  replyToId: text('reply_to_id'),
  reactions: text('reactions'), // JSON array string
  ...timestampColumns(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
