import type { proto } from '@whiskeysockets/baileys';

/**
 * Format any phone number or JID into a canonical WhatsApp JID.
 * Examples:
 * - "08123456789" -> "628123456789@s.whatsapp.net"
 * - "+628123456789" -> "628123456789@s.whatsapp.net"
 * - "628123456789" -> "628123456789@s.whatsapp.net"
 * - "123456789-987654@g.us" -> "123456789-987654@g.us"
 */
export function formatToWhatsAppJid(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Phone number or JID cannot be empty');
  }

  // Already a WhatsApp JID (user or group or broadcast)
  if (trimmed.endsWith('@s.whatsapp.net') || trimmed.endsWith('@g.us') || trimmed.endsWith('@broadcast')) {
    return trimmed;
  }

  // Sanitize non-digits
  let digits = trimmed.replace(/\D/g, '');

  // Convert leading local "08" to "628" (Indonesian default)
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }

  return `${digits}@s.whatsapp.net`;
}

/**
 * Extract pure digits phone number from WhatsApp JID.
 */
export function extractPhoneNumber(jid: string): string {
  const clean = jid.split('@')[0] || '';
  return clean.split(':')[0] || '';
}

/**
 * Check if a JID belongs to a group.
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
}

/**
 * Safely extract text content from incoming Baileys proto.IMessage.
 */
export function extractMessageText(message: proto.IMessage | null | undefined): string | undefined {
  if (!message) return undefined;

  if (typeof message.conversation === 'string') {
    return message.conversation;
  }

  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  if (message.imageMessage?.caption) {
    return message.imageMessage.caption;
  }

  if (message.videoMessage?.caption) {
    return message.videoMessage.caption;
  }

  if (message.documentMessage?.caption) {
    return message.documentMessage.caption;
  }

  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId;
  }

  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return message.listResponseMessage.singleSelectReply.selectedRowId;
  }

  return undefined;
}
