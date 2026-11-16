import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns } from '@rocksoul/orm-base';

export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id').primaryKey(), // "conv-1"
  type: text('type', { enum: ['direct', 'group'] }).notNull().default('direct'),
  name: text('name').notNull(),
  avatar: text('avatar'),
  unreadCount: integer('unread_count').notNull().default(0),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isMuted: integer('is_muted', { mode: 'boolean' }).notNull().default(false),
  lastMessageContent: text('last_message_content'),
  lastMessageTime: text('last_message_time'),
  createdBy: text('created_by').references(() => users.id),
  ...timestampColumns(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
