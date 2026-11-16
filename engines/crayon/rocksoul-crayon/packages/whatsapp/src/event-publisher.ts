import { randomUUID } from 'node:crypto';
/** HTTP transport adapter only; AppEvent remains the canonical event envelope. */
export async function publishWhatsAppMessageEvent(input: { sessionId: string; message: { id?: string; from: string; senderNumber?: string; senderName?: string; fromMe?: boolean; text?: string; timestamp?: number } }) {
  const base = process.env.WEBHOOKS_BASE_URL;
  const apiKey = process.env.WEBHOOKS_INTERNAL_API_KEY;
  if (!base || !apiKey) return;
  const event = { eventId: `wa:${input.sessionId}:${input.message.id || randomUUID()}`, eventType: 'whatsapp.message.received', sessionId: input.sessionId, requestId: randomUUID(), sequence: 0, timestamp: (input.message.timestamp || Math.floor(Date.now() / 1000)) * 1000, priority: 2, payload: { sessionId: input.sessionId, messageId: input.message.id, remoteJid: input.message.from, senderNumber: input.message.senderNumber, senderName: input.message.senderName, fromMe: !!input.message.fromMe, text: input.message.text || '', timestamp: input.message.timestamp } };
  try { await fetch(`${base.replace(/\/$/, '')}/internal/events`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-webhooks-internal-key': apiKey }, body: JSON.stringify(event), signal: AbortSignal.timeout(10_000) }); } catch { /* event publishing must not break WhatsApp realtime processing; gateway is durable after acceptance */ }
}
