import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import type { WhatsAppIncomingMessage } from './types.js';
import { extractPhoneNumber } from './utils.js';

// Standalone SQLite table for WhatsApp API Keys
export const waApiKeys = sqliteTable('wa_api_keys', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  scopes: text('scopes').notNull().default('["*"]'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Standalone SQLite table for WhatsApp Conversations / Chats
export const waChats = sqliteTable('wa_chats', {
  id: text('id').primaryKey(), // ${sessionId}_${remoteJid}
  sessionId: text('session_id').notNull(),
  remoteJid: text('remote_jid').notNull(),
  name: text('name'),
  lastMessageText: text('last_message_text'),
  lastMessageTimestamp: integer('last_message_timestamp').notNull(),
  unreadCount: integer('unread_count').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});

// Standalone SQLite table for WhatsApp Messages
export const waMessages = sqliteTable('wa_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  remoteJid: text('remote_jid').notNull(),
  senderNumber: text('sender_number').notNull(),
  senderName: text('sender_name'),
  fromMe: integer('from_me', { mode: 'boolean' }).notNull(),
  text: text('text'),
  mediaType: text('media_type'), // 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'poll' | 'location' | 'contact'
  mediaUrl: text('media_url'),
  quotedId: text('quoted_id'),
  quotedText: text('quoted_text'),
  quotedSender: text('quoted_sender'),
  reactions: text('reactions'), // JSON array of emojis
  isStarred: integer('is_starred', { mode: 'boolean' }).default(false),
  pollData: text('poll_data'), // JSON string
  locationData: text('location_data'), // JSON string
  vcardData: text('vcard_data'), // JSON string
  isForwarded: integer('is_forwarded', { mode: 'boolean' }).default(false),
  sentAt: text('sent_at'),
  deliveredAt: text('delivered_at'),
  readAt: text('read_at'),
  timestamp: integer('timestamp').notNull(),
  status: text('status').notNull().default('sent'),
  createdAt: text('created_at').notNull(),
});

// Standalone SQLite table for Chat Metadata (Pin, Archive, Mute, Labels, Notes)
export const waChatMeta = sqliteTable('wa_chat_meta', {
  id: text('id').primaryKey(), // ${sessionId}_${remoteJid}
  sessionId: text('session_id').notNull(),
  remoteJid: text('remote_jid').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  isMuted: integer('is_muted', { mode: 'boolean' }).notNull().default(false),
  isUnreadManual: integer('is_unread_manual', { mode: 'boolean' }).notNull().default(false),
  labels: text('labels').default('[]'),
  internalNotes: text('internal_notes').default(''),
  updatedAt: text('updated_at').notNull(),
});


// Scheduled Messages
export const waScheduledMessages = sqliteTable('wa_scheduled_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  remoteJid: text('remote_jid').notNull(),
  payload: text('payload').notNull(),
  scheduledAt: integer('scheduled_at').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

// Auto Replies
export const waAutoReplies = sqliteTable('wa_auto_replies', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  keyword: text('keyword').notNull(),
  matchType: text('match_type').notNull().default('exact'),
  replyText: text('reply_text').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

// Quick Replies
export const waQuickReplies = sqliteTable('wa_quick_replies', {
  id: text('id').primaryKey(),
  shortcut: text('shortcut').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

export type WaApiKey = typeof waApiKeys.$inferSelect;
export type WaChat = typeof waChats.$inferSelect;
export type WaMessage = typeof waMessages.$inferSelect;
export type WaChatMeta = typeof waChatMeta.$inferSelect;
export type WaScheduledMessage = typeof waScheduledMessages.$inferSelect;
export type WaAutoReply = typeof waAutoReplies.$inferSelect;
export type WaQuickReply = typeof waQuickReplies.$inferSelect;

export const schema = {
  waApiKeys,
  waChats,
  waMessages,
  waChatMeta,
  waScheduledMessages,
  waAutoReplies,
  waQuickReplies,
};

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(prefix = 'wa_live'): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomSecret = randomBytes(24).toString('hex');
  const rawKey = `${prefix}_${randomSecret}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${prefix}_${randomSecret.substring(0, 6)}...`;

  return {
    rawKey,
    keyHash,
    keyPrefix,
  };
}

export interface DatabaseContext {
  client: Client;
  db: LibSQLDatabase<typeof schema>;
}

/**
 * Initialize isolated SQLite database for WhatsApp gateway.
 * Default: file:./data/whatsapp.db
 */
export async function initWhatsAppDb(databaseUrl?: string): Promise<DatabaseContext> {
  const url = databaseUrl || process.env.WA_DATABASE_URL || 'file:./data/whatsapp.db';

  if (url.startsWith('file:')) {
    const rawPath = url.replace('file:', '');
    const dir = path.dirname(path.resolve(process.cwd(), rawPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const client = createClient({ url });
  const db = drizzle(client, { schema });

  // Auto ensure tables exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      scopes TEXT NOT NULL DEFAULT '["*"]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_chats (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      name TEXT,
      last_message_text TEXT,
      last_message_timestamp INTEGER NOT NULL,
      unread_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      sender_number TEXT NOT NULL,
      sender_name TEXT,
      from_me INTEGER NOT NULL,
      text TEXT,
      media_type TEXT,
      media_url TEXT,
      quoted_id TEXT,
      quoted_text TEXT,
      quoted_sender TEXT,
      reactions TEXT,
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_chat_meta (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_muted INTEGER NOT NULL DEFAULT 0,
      is_unread_manual INTEGER NOT NULL DEFAULT 0,
      labels TEXT DEFAULT '[]',
      internal_notes TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);


  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_scheduled_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      payload TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_auto_replies (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      match_type TEXT NOT NULL DEFAULT 'exact',
      reply_text TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_quick_replies (
      id TEXT PRIMARY KEY,
      shortcut TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Auto-migrate new columns if table already existed
  const alterColumns = [
    'ALTER TABLE wa_messages ADD COLUMN media_type TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN media_url TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN quoted_id TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN quoted_text TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN quoted_sender TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN reactions TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN is_starred INTEGER DEFAULT 0;',
    'ALTER TABLE wa_messages ADD COLUMN poll_data TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN location_data TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN vcard_data TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN is_forwarded INTEGER DEFAULT 0;',
    'ALTER TABLE wa_messages ADD COLUMN sent_at TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN delivered_at TEXT;',
    'ALTER TABLE wa_messages ADD COLUMN read_at TEXT;',
  ];

  for (const alterSql of alterColumns) {
    try {
      await client.execute(alterSql);
    } catch {
      // Column already exists, ignore
    }
  }

  // Optimize SQLite with WAL mode & performance pragmas
  try {
    await client.execute('PRAGMA journal_mode = WAL;');
    await client.execute('PRAGMA synchronous = NORMAL;');
  } catch {
    // Ignore if not supported on remote
  }

  return { client, db };
}

// ==========================================
// API KEY HELPERS
// ==========================================

export async function listApiKeys(db: LibSQLDatabase<typeof schema>): Promise<WaApiKey[]> {
  return await db.select().from(waApiKeys).orderBy(desc(waApiKeys.createdAt));
}

export async function createNewApiKey(
  db: LibSQLDatabase<typeof schema>,
  name: string,
  scopes: string[] = ['*']
): Promise<{ key: WaApiKey; rawKey: string }> {
  const { rawKey, keyHash, keyPrefix } = generateApiKey();
  const id = `key_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
  const now = new Date().toISOString();

  await db.insert(waApiKeys).values({
    id,
    name: name || 'Default Token',
    keyHash,
    keyPrefix,
    scopes: JSON.stringify(scopes.length ? scopes : ['*']),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db.select().from(waApiKeys).where(eq(waApiKeys.id, id)).limit(1);
  return { key: created, rawKey };
}

export async function revokeApiKey(
  db: LibSQLDatabase<typeof schema>,
  id: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .update(waApiKeys)
    .set({ isActive: false, updatedAt: now })
    .where(eq(waApiKeys.id, id));

  return result.rowsAffected > 0;
}

export async function validateApiKey(
  db: LibSQLDatabase<typeof schema>,
  rawKey: string
): Promise<WaApiKey | null> {
  if (!rawKey) return null;
  const hash = hashApiKey(rawKey);

  const [found] = await db
    .select()
    .from(waApiKeys)
    .where(eq(waApiKeys.keyHash, hash))
    .limit(1);

  if (!found || !found.isActive) {
    return null;
  }

  return found;
}

// ==========================================
// CHAT & MESSAGE HELPERS
// ==========================================

export async function saveIncomingMessage(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  msg: WhatsAppIncomingMessage & {
    mediaType?: string;
    mediaUrl?: string;
    quotedId?: string;
    quotedText?: string;
    quotedSender?: string;
    reactions?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const chatId = `${sessionId}_${msg.from}`;

  // 1. Insert message
  try {
    await db.insert(waMessages).values({
      id: msg.id || randomUUID(),
      sessionId,
      remoteJid: msg.from,
      senderNumber: msg.senderNumber,
      senderName: msg.senderName,
      fromMe: msg.fromMe,
      text: msg.text || '',
      mediaType: msg.mediaType,
      mediaUrl: msg.mediaUrl,
      quotedId: msg.quotedId,
      quotedText: msg.quotedText,
      quotedSender: msg.quotedSender,
      reactions: msg.reactions,
      timestamp: msg.timestamp,
      status: 'received',
      createdAt: now,
    }).onConflictDoNothing();
  } catch {
    // Ignore duplicate message insertion
  }

  // 2. Upsert chat record
  const [existingChat] = await db.select().from(waChats).where(eq(waChats.id, chatId)).limit(1);

  if (existingChat) {
    await db.update(waChats).set({
      lastMessageText: msg.text || existingChat.lastMessageText,
      lastMessageTimestamp: Math.max(existingChat.lastMessageTimestamp, msg.timestamp),
      unreadCount: msg.fromMe ? existingChat.unreadCount : (existingChat.unreadCount + 1),
      name: msg.senderName || existingChat.name,
      updatedAt: now,
    }).where(eq(waChats.id, chatId));
  } else {
    await db.insert(waChats).values({
      id: chatId,
      sessionId,
      remoteJid: msg.from,
      name: msg.senderName || msg.senderNumber,
      lastMessageText: msg.text || '',
      lastMessageTimestamp: msg.timestamp,
      unreadCount: msg.fromMe ? 0 : 1,
      updatedAt: now,
    });
  }
}

export async function saveOutgoingMessage(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string,
  text: string,
  messageId?: string,
  contactName?: string,
  options?: {
    mediaType?: string;
    mediaUrl?: string;
    quotedId?: string;
    quotedText?: string;
    quotedSender?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const ts = Math.floor(Date.now() / 1000);
  const chatId = `${sessionId}_${remoteJid}`;
  const senderNumber = extractPhoneNumber(remoteJid);

  // 1. Insert message
  await db.insert(waMessages).values({
    id: messageId || randomUUID(),
    sessionId,
    remoteJid,
    senderNumber,
    senderName: 'Me',
    fromMe: true,
    text,
    mediaType: options?.mediaType,
    mediaUrl: options?.mediaUrl,
    quotedId: options?.quotedId,
    quotedText: options?.quotedText,
    quotedSender: options?.quotedSender,
    timestamp: ts,
    status: 'sent',
    createdAt: now,
  });

  // 2. Upsert chat record
  const [existingChat] = await db.select().from(waChats).where(eq(waChats.id, chatId)).limit(1);

  if (existingChat) {
    await db.update(waChats).set({
      lastMessageText: text,
      lastMessageTimestamp: ts,
      name: contactName || existingChat.name,
      updatedAt: now,
    }).where(eq(waChats.id, chatId));
  } else {
    await db.insert(waChats).values({
      id: chatId,
      sessionId,
      remoteJid,
      name: contactName || senderNumber,
      lastMessageText: text,
      lastMessageTimestamp: ts,
      unreadCount: 0,
      updatedAt: now,
    });
  }
}

export async function getSessionChats(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string
): Promise<WaChat[]> {
  return await db
    .select()
    .from(waChats)
    .where(eq(waChats.sessionId, sessionId))
    .orderBy(desc(waChats.lastMessageTimestamp));
}

export async function getChatMessages(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string,
  limit = 50,
  beforeTimestamp?: number
): Promise<WaMessage[]> {
  const conditions = [
    eq(waMessages.sessionId, sessionId),
    eq(waMessages.remoteJid, remoteJid),
  ];

  if (beforeTimestamp && beforeTimestamp > 0) {
    conditions.push(sql`${waMessages.timestamp} < ${beforeTimestamp}`);
  }

  const messages = await db
    .select()
    .from(waMessages)
    .where(and(...conditions))
    .orderBy(desc(waMessages.timestamp))
    .limit(limit);

  // Return chronologically ascending (oldest first)
  return messages.reverse();
}

export async function addReactionToMessage(
  db: LibSQLDatabase<typeof schema>,
  messageId: string,
  emoji: string
): Promise<void> {
  const [existing] = await db.select().from(waMessages).where(eq(waMessages.id, messageId)).limit(1);
  if (!existing) return;

  let currentReactions: string[] = [];
  try {
    if (existing.reactions) {
      currentReactions = JSON.parse(existing.reactions);
    }
  } catch {
    currentReactions = [];
  }

  if (emoji) {
    if (!currentReactions.includes(emoji)) {
      currentReactions.push(emoji);
    }
  } else {
    // Remove reaction if empty emoji
    currentReactions = [];
  }

  await db
    .update(waMessages)
    .set({ reactions: JSON.stringify(currentReactions) })
    .where(eq(waMessages.id, messageId));
}

export async function deleteMessage(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  messageId: string
): Promise<boolean> {
  const result = await db
    .update(waMessages)
    .set({ text: '🚫 Pesan ini telah dihapus', mediaUrl: null, mediaType: null })
    .where(and(eq(waMessages.sessionId, sessionId), eq(waMessages.id, messageId)));
  return result.rowsAffected > 0;
}

export async function markChatRead(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string
): Promise<void> {
  const chatId = `${sessionId}_${remoteJid}`;
  await db.update(waChats).set({ unreadCount: 0 }).where(eq(waChats.id, chatId));
}

export async function upsertContacts(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  contacts: { id: string; phoneNumber?: string; name?: string; notify?: string; verifiedName?: string }[]
): Promise<void> {
  const now = new Date().toISOString();
  const ts = Math.floor(Date.now() / 1000);

  for (const c of contacts) {
    if (!c.id || c.id.endsWith('@status')) continue;
    const phone = c.phoneNumber || extractPhoneNumber(c.id);
    if (!phone) continue;

    // Use phoneNumber as unique conversation key per session: ${sessionId}_${phone}
    const chatId = `${sessionId}_${phone}`;
    const contactName = c.name || c.verifiedName || c.notify;
    const fullJid = c.id.includes('@') ? c.id : `${phone}@s.whatsapp.net`;

    const [existing] = await db.select().from(waChats).where(eq(waChats.id, chatId)).limit(1);
    if (existing) {
      if (contactName && contactName !== existing.name) {
        await db.update(waChats).set({ name: contactName, updatedAt: now }).where(eq(waChats.id, chatId));
      }
    } else {
      await db.insert(waChats).values({
        id: chatId,
        sessionId,
        remoteJid: fullJid,
        name: contactName || phone,
        lastMessageText: '',
        lastMessageTimestamp: ts,
        unreadCount: 0,
        updatedAt: now,
      });
    }
  }
}

// ==========================================
// PHASE 2: STARRED MESSAGES
// ==========================================

export async function toggleStarMessage(
  db: LibSQLDatabase<typeof schema>,
  messageId: string
): Promise<boolean> {
  const [existing] = await db.select().from(waMessages).where(eq(waMessages.id, messageId)).limit(1);
  if (!existing) return false;
  const newStarred = !existing.isStarred;
  await db.update(waMessages).set({ isStarred: newStarred }).where(eq(waMessages.id, messageId));
  return newStarred;
}

export async function getStarredMessages(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  jid?: string
): Promise<WaMessage[]> {
  const conditions = [eq(waMessages.sessionId, sessionId), eq(waMessages.isStarred, true)];
  if (jid) conditions.push(eq(waMessages.remoteJid, jid));
  return await db.select().from(waMessages).where(and(...conditions)).orderBy(desc(waMessages.timestamp));
}

// ==========================================
// PHASE 2: CHAT METADATA (PIN, ARCHIVE, MUTE, LABELS, NOTES)
// ==========================================

export function formatChatMeta(row: any): any {
  if (!row) return null;
  let parsedLabels: string[] = [];
  if (row.labels) {
    try {
      parsedLabels = typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels;
    } catch {
      parsedLabels = [];
    }
  }
  return {
    ...row,
    labels: parsedLabels,
  };
}

export async function getChatMeta(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string
): Promise<any> {
  const id = `${sessionId}_${remoteJid}`;
  const [row] = await db.select().from(waChatMeta).where(eq(waChatMeta.id, id)).limit(1);
  return row ? formatChatMeta(row) : null;
}

export async function updateChatMeta(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string,
  updates: Partial<{
    isPinned: boolean;
    isArchived: boolean;
    isMuted: boolean;
    isUnreadManual: boolean;
    labels: string[];
    internalNotes: string;
  }>
): Promise<any> {
  const id = `${sessionId}_${remoteJid}`;
  const now = new Date().toISOString();
  const [existing] = await db.select().from(waChatMeta).where(eq(waChatMeta.id, id)).limit(1);

  const payload: any = { updatedAt: now };
  if (updates.isPinned !== undefined) payload.isPinned = updates.isPinned;
  if (updates.isArchived !== undefined) payload.isArchived = updates.isArchived;
  if (updates.isMuted !== undefined) payload.isMuted = updates.isMuted;
  if (updates.isUnreadManual !== undefined) payload.isUnreadManual = updates.isUnreadManual;
  if (updates.labels !== undefined) payload.labels = JSON.stringify(updates.labels);
  if (updates.internalNotes !== undefined) payload.internalNotes = updates.internalNotes;

  if (existing) {
    await db.update(waChatMeta).set(payload).where(eq(waChatMeta.id, id));
  } else {
    await db.insert(waChatMeta).values({
      id,
      sessionId,
      remoteJid,
      isPinned: updates.isPinned ?? false,
      isArchived: updates.isArchived ?? false,
      isMuted: updates.isMuted ?? false,
      isUnreadManual: updates.isUnreadManual ?? false,
      labels: updates.labels ? JSON.stringify(updates.labels) : '[]',
      internalNotes: updates.internalNotes ?? '',
      updatedAt: now,
    });
  }

  const [result] = await db.select().from(waChatMeta).where(eq(waChatMeta.id, id)).limit(1);
  return formatChatMeta(result);
}

export async function getAllChatMetas(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string
): Promise<any[]> {
  const rows = await db.select().from(waChatMeta).where(eq(waChatMeta.sessionId, sessionId));
  return rows.map(formatChatMeta);
}

// ==========================================
// PHASE 2: SCHEDULED MESSAGES
// ==========================================

export async function listScheduledMessages(
  db: LibSQLDatabase<typeof schema>,
  sessionId?: string
): Promise<WaScheduledMessage[]> {
  if (sessionId) {
    return await db.select().from(waScheduledMessages).where(eq(waScheduledMessages.sessionId, sessionId)).orderBy(asc(waScheduledMessages.scheduledAt));
  }
  return await db.select().from(waScheduledMessages).orderBy(asc(waScheduledMessages.scheduledAt));
}

export async function createScheduledMessage(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  remoteJid: string,
  payload: string,
  scheduledAt: number
): Promise<WaScheduledMessage> {
  const id = `sch_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
  const now = new Date().toISOString();
  await db.insert(waScheduledMessages).values({
    id,
    sessionId,
    remoteJid,
    payload,
    scheduledAt,
    status: 'pending',
    createdAt: now,
  });
  const [created] = await db.select().from(waScheduledMessages).where(eq(waScheduledMessages.id, id)).limit(1);
  return created;
}

export async function updateScheduledMessageStatus(
  db: LibSQLDatabase<typeof schema>,
  id: string,
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
): Promise<void> {
  await db.update(waScheduledMessages).set({ status }).where(eq(waScheduledMessages.id, id));
}

// ==========================================
// PHASE 2: AUTO REPLIES
// ==========================================

export async function listAutoReplies(
  db: LibSQLDatabase<typeof schema>,
  sessionId?: string
): Promise<WaAutoReply[]> {
  if (sessionId) {
    return await db.select().from(waAutoReplies).where(eq(waAutoReplies.sessionId, sessionId)).orderBy(desc(waAutoReplies.createdAt));
  }
  return await db.select().from(waAutoReplies).orderBy(desc(waAutoReplies.createdAt));
}

export async function createAutoReply(
  db: LibSQLDatabase<typeof schema>,
  sessionId: string,
  keyword: string,
  matchType: 'exact' | 'contains' | 'regex',
  replyText: string
): Promise<WaAutoReply> {
  const id = `ar_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
  const now = new Date().toISOString();
  await db.insert(waAutoReplies).values({
    id,
    sessionId,
    keyword: keyword.toLowerCase().trim(),
    matchType,
    replyText,
    isActive: true,
    createdAt: now,
  });
  const [created] = await db.select().from(waAutoReplies).where(eq(waAutoReplies.id, id)).limit(1);
  return created;
}

export async function deleteAutoReply(
  db: LibSQLDatabase<typeof schema>,
  id: string
): Promise<boolean> {
  await db.delete(waAutoReplies).where(eq(waAutoReplies.id, id));
  return true;
}

// ==========================================
// PHASE 2: QUICK REPLIES
// ==========================================

export async function listQuickReplies(
  db: LibSQLDatabase<typeof schema>
): Promise<WaQuickReply[]> {
  return await db.select().from(waQuickReplies).orderBy(asc(waQuickReplies.shortcut));
}

export async function createQuickReply(
  db: LibSQLDatabase<typeof schema>,
  shortcut: string,
  title: string,
  content: string
): Promise<WaQuickReply> {
  const id = `qr_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
  const cleanShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
  const now = new Date().toISOString();

  const [existing] = await db.select().from(waQuickReplies).where(eq(waQuickReplies.shortcut, cleanShortcut)).limit(1);
  if (existing) {
    await db.update(waQuickReplies).set({ title, content }).where(eq(waQuickReplies.id, existing.id));
    const [updated] = await db.select().from(waQuickReplies).where(eq(waQuickReplies.id, existing.id)).limit(1);
    return updated;
  }

  await db.insert(waQuickReplies).values({
    id,
    shortcut: cleanShortcut,
    title,
    content,
    createdAt: now,
  });
  const [created] = await db.select().from(waQuickReplies).where(eq(waQuickReplies.id, id)).limit(1);
  return created;
}

export async function deleteQuickReply(
  db: LibSQLDatabase<typeof schema>,
  id: string
): Promise<boolean> {
  await db.delete(waQuickReplies).where(eq(waQuickReplies.id, id));
  return true;
}

