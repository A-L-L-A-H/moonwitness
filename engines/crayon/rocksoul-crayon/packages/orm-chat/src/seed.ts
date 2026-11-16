export interface ChatSeedContext {
  now?: string;
}

export const initialConversationsData = [
  { id: "conv-1", type: "direct", name: "Sarah Mitchell", avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-", unreadCount: 2, isPinned: true, isMuted: false, lastMessage: { content: "Thanks for the quick update! The dashboard looks amazing 🎉", timestamp: "2025-08-11T15:30:00Z" } },
  { id: "conv-2", type: "group", name: "Project Alpha", avatar: "", unreadCount: 0, isPinned: false, isMuted: false, lastMessage: { content: "David: Marketing campaign is scheduled for next week", timestamp: "2025-08-11T08:15:00Z" } },
  { id: "conv-3", type: "group", name: "Frontend Team", avatar: "", unreadCount: 1, isPinned: false, isMuted: false, lastMessage: { content: "Alex: The new component library is ready for testing", timestamp: "2025-08-11T23:45:00Z" } },
  { id: "conv-4", type: "direct", name: "Emily Rodriguez", avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-2", unreadCount: 1, isPinned: false, isMuted: false, lastMessage: { content: "Let's review the wireframes together tomorrow", timestamp: "2025-08-10T16:30:00Z" } },
  { id: "conv-5", type: "direct", name: "Lisa Chen", avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=female-4", unreadCount: 0, isPinned: false, isMuted: true, lastMessage: { content: "Found a few edge cases in the new feature", timestamp: "2025-08-06T14:20:00Z" } },
  { id: "conv-6", type: "direct", name: "Alex Thompson", avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-1", unreadCount: 0, isPinned: false, isMuted: false, lastMessage: { content: "Code review completed, looks good to merge! 👍", timestamp: "2025-01-15T17:45:00Z" } },
];

export const initialMessagesData = [
  { id: "msg-1-1", conversationId: "conv-1", senderId: "1", content: "Hey! How's the new dashboard coming along?", type: "text", isEdited: false, reactions: [] },
  { id: "msg-1-2", conversationId: "conv-1", senderId: "2", content: "It's going great! We've implemented the new design system and it looks fantastic.", type: "text", isEdited: false, reactions: [{ emoji: "👍", count: 1 }] },
  { id: "msg-1-3", conversationId: "conv-1", senderId: "1", content: "That's awesome! Can you share a preview?", type: "text", isEdited: false, reactions: [] },
  { id: "msg-1-4", conversationId: "conv-1", senderId: "1", content: "Thanks for the quick update! The dashboard looks amazing 🎉", type: "text", isEdited: false, reactions: [{ emoji: "❤️", count: 1 }] },
  { id: "msg-2-1", conversationId: "conv-2", senderId: "2", content: "David: Marketing campaign is scheduled for next week", type: "text", isEdited: false, reactions: [] },
];

export async function seedChat(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: ChatSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('💬 [orm-chat] Seeding Chat Conversations & Messages...');

  for (const conv of initialConversationsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO chat_conversations (
          id, type, name, avatar, unread_count, is_pinned, is_muted, last_message_content, last_message_time, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        conv.id,
        conv.type,
        conv.name,
        conv.avatar,
        conv.unreadCount,
        conv.isPinned ? 1 : 0,
        conv.isMuted ? 1 : 0,
        conv.lastMessage.content,
        conv.lastMessage.timestamp,
        '1',
        now,
        now,
      ],
    });

    // Participants
    await client.execute({
      sql: `INSERT OR REPLACE INTO chat_participants (id, conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, 'member', ?)`,
      args: [`${conv.id}_1`, conv.id, '1', now],
    });
    await client.execute({
      sql: `INSERT OR REPLACE INTO chat_participants (id, conversation_id, user_id, role, joined_at) VALUES (?, ?, ?, 'member', ?)`,
      args: [`${conv.id}_2`, conv.id, '2', now],
    });
  }

  for (const m of initialMessagesData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO chat_messages (
          id, conversation_id, sender_id, content, type, is_edited, reply_to_id, reactions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        m.id,
        m.conversationId,
        m.senderId,
        m.content,
        m.type,
        m.isEdited ? 1 : 0,
        null,
        JSON.stringify(m.reactions),
        now,
        now,
      ],
    });
  }
}
