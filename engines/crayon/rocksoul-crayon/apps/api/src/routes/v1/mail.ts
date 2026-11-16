import type { FastifyInstance } from 'fastify';
import { successResponse } from '@rocksoul/common';
import { randomUUID } from 'node:crypto';
import { createNotification } from './notifications.js';

export async function mailRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.post<{ Body: { to: string; subject?: string; text: string; draft?: boolean } }>('/send', async (request, reply) => {
    const { to, subject = '', text, draft = false } = request.body;
    if (!to?.trim() || !text?.trim()) return reply.badRequest('Recipient and message are required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) return reply.badRequest('Recipient email is invalid');
    const userResult = await app.dbClient.execute({ sql: 'SELECT name, email FROM users WHERE id = ?', args: [request.principal!.userId] });
    const sender = userResult.rows[0] as unknown as { name?: string; email?: string } | undefined;
    if (!sender?.email) return reply.notFound('Sender account not found');
    const now = new Date().toISOString();
    const id = `mail_${randomUUID()}`;
    await app.dbClient.execute({ sql: `INSERT INTO mails (id, user_id, name, email, subject, text, folder, read, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, request.principal!.userId, to.trim(), sender.email, subject.trim(), text.trim(), draft ? 'draft' : 'sent', 1, now, now, now] });
    if (!draft) await createNotification(app, request.principal!.userId, { kind: 'activity', title: 'Mail sent', message: `Your message to ${to.trim()} was added to Sent.`, href: '/mail?folder=sent' });
    return reply.code(201).send(successResponse({ id, folder: draft ? 'draft' : 'sent', date: now }, draft ? 'Draft saved' : 'Mail queued in sent folder'));
  });
}
