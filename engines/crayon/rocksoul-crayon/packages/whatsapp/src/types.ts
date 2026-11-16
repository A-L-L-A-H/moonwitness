import type { proto } from '@whiskeysockets/baileys';

export type WhatsAppConnectionState = 'idle' | 'connecting' | 'qrcode' | 'open' | 'close';

export interface WhatsAppClientOptions {
  /** Directory path to store Baileys multi-file auth credentials */
  sessionDir?: string;
  /** Log level for Pino logger inside Baileys */
  logLevel?: 'silent' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  /** Whether to print ASCII QR code directly to terminal */
  printQRToTerminal?: boolean;
  /** Browser configuration tuple: [BrowserName, OSName, Version] */
  browser?: [string, string, string];
  /** Whether to mark the client online on connect (default: true) */
  markOnlineOnConnect?: boolean;
}

export interface WhatsAppUser {
  id: string;
  name?: string;
  phone: string;
}

export interface WhatsAppIncomingMessage {
  id: string;
  from: string;
  senderNumber: string;
  senderName?: string;
  isGroup: boolean;
  fromMe: boolean;
  timestamp: number;
  text?: string;
  raw: proto.IWebMessageInfo;
}

export interface ConnectionUpdatePayload {
  state: WhatsAppConnectionState;
  qr?: string;
  user?: WhatsAppUser;
  error?: Error;
  isNewLogin?: boolean;
}

export interface DisconnectPayload {
  loggedOut: boolean;
  statusCode?: number;
  reason?: string;
}

export interface WhatsAppContact {
  phoneNumber: string; // Unique primary identifier (e.g. "628123456789")
  id: string;          // WhatsApp JID (e.g. "628123456789@s.whatsapp.net")
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string | null;
}

export interface WhatsAppStatusItem {
  id: string;
  senderJid: string;
  senderNumber: string;
  senderName?: string;
  fromMe: boolean;
  timestamp: number;
  text?: string;
  mediaType?: 'image' | 'video' | 'text';
  mediaUrl?: string;
  thumbnail?: string; // Base64 data URI if available
  caption?: string;
}

export interface WhatsAppProfileInfo {
  id: string;
  phone: string;
  name?: string;
  statusText?: string;
  imgUrl?: string | null;
}

export interface PollPayload {
  name: string;
  values: string[];
  selectableCount?: number;
}

export interface LocationPayload {
  degreesLatitude: number;
  degreesLongitude: number;
  name?: string;
  address?: string;
}

export interface ContactCardPayload {
  displayName: string;
  phoneNumber: string;
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}

export interface GroupMetadataInfo {
  id: string;
  subject: string;
  description?: string;
  owner?: string;
  participants: GroupParticipant[];
  announce?: boolean;
  restrict?: boolean;
}

export interface ChatMetaInfo {
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  isUnreadManual: boolean;
  labels: string[];
  internalNotes: string;
}

export interface ScheduledMessageItem {
  id: string;
  sessionId: string;
  remoteJid: string;
  payload: string;
  scheduledAt: number;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export interface AutoReplyItem {
  id: string;
  sessionId: string;
  keyword: string;
  matchType: 'exact' | 'contains';
  replyText: string;
  isActive: boolean;
  createdAt: string;
}

export interface QuickReplyItem {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface WhatsAppEventMap {
  qr: (qr: string) => void;
  ready: (user: WhatsAppUser) => void;
  connecting: () => void;
  connection: (update: ConnectionUpdatePayload) => void;
  disconnected: (payload: DisconnectPayload) => void;
  message: (message: WhatsAppIncomingMessage) => void;
  contacts: (contacts: WhatsAppContact[]) => void;
  status_update: (status: WhatsAppStatusItem) => void;
  presence: (payload: { jid: string; presence: string; lastSeen?: number }) => void;
  error: (error: Error) => void;
}

