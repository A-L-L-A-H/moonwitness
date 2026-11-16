export interface SessionItem {
  sessionId: string;
  status: string;
}

export interface ChatItem {
  id: string;
  sessionId: string;
  remoteJid: string;
  name: string | null;
  lastMessageText: string | null;
  lastMessageTimestamp: number | null;
  unreadCount: number;
}

export interface ContactItem {
  id: string;
  phoneNumber?: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
}

export interface MessageItem {
  id?: string;
  sessionId: string;
  remoteJid: string;
  senderNumber: string;
  senderName?: string;
  fromMe: boolean;
  text: string;
  mediaType?: string;
  mediaUrl?: string;
  quotedId?: string;
  quotedText?: string;
  quotedSender?: string;
  reactions?: string;
  timestamp: number;
  isStarred?: boolean;
  pollData?: any;
  locationData?: any;
  vcardData?: any;
  isForwarded?: boolean;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
}

export interface ChatMeta {
  remoteJid: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isUnreadManual?: boolean;
  labels?: string[];
  internalNotes?: string;
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}

export interface GroupInfo {
  id: string;
  subject: string;
  desc?: string;
  owner?: string;
  creation?: number;
  participants: GroupParticipant[];
}

export interface ScheduledMessageItem {
  id: string;
  remoteJid: string;
  text: string;
  mediaUrl?: string;
  scheduledAt: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export interface AutoReplyItem {
  id: string;
  triggerKeyword: string;
  matchType: 'exact' | 'contains' | 'regex';
  replyText: string;
  enabled: boolean;
}

export interface QuickReplyItem {
  id: string;
  shortcut: string;
  title: string;
  content: string;
}

export interface PresenceInfo {
  jid: string;
  presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
  lastSeen?: number;
}

export interface StatusItem {
  id: string;
  senderJid: string;
  senderNumber: string;
  senderName?: string;
  fromMe: boolean;
  timestamp: number;
  text?: string;
  mediaType?: 'image' | 'video' | 'text';
  mediaUrl?: string;
  thumbnail?: string;
  caption?: string;
}

export interface ProfileInfo {
  id: string;
  phone: string;
  name?: string;
  statusText?: string;
  imgUrl?: string | null;
}
