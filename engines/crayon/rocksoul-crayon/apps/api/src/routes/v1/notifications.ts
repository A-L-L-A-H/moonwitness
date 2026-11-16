import type { FastifyInstance } from 'fastify';
import { successResponse } from '@rocksoul/common';
import { randomUUID } from 'node:crypto';
import { aepEventHub } from '../../services/aep-events.js';

type NotificationRow = {
  id: string;
  type: string | null;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

const toNotification = (row: NotificationRow) => ({
  id: row.id,
  kind: row.type ?? 'info',
  title: row.title,
  message: row.body ?? '',
  href: row.href,
  readAt: row.read_at,
  createdAt: row.created_at,
});

export async function createNotification(app: FastifyInstance, userId: string, input: { kind?: string; title: string; message: string; href?: string | null }): Promise<{ id: string; createdAt: string }> {
  const now = new Date().toISOString();
  const id = `ntf_${randomUUID()}`;
  await app.dbClient.execute({
    sql: 'INSERT INTO notifications (id, user_id, kind, title, message, type, body, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, userId, input.kind ?? 'info', input.title.trim(), input.message.trim(), input.kind ?? 'info', input.message.trim(), input.kind ?? 'info', now],
  });
  await app.dbClient.execute({ sql: 'INSERT OR IGNORE INTO notification_recipients (notification_id, user_id, created_at) VALUES (?, ?, ?)', args: [id, userId, now] });
  aepEventHub.publish({ eventId: randomUUID(), eventType: 'notification.created', resource: 'notifications', recordId: id, principalId: userId, timestamp: Date.now(), payload: { id, kind: input.kind ?? 'info', title: input.title.trim(), message: input.message.trim(), href: input.href ?? null, createdAt: now } });
  return { id, createdAt: now };
}

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get<{ Querystring: { limit?: number } }>('/', async (request, reply) => {
    const limit = Math.min(Math.max(Number(request.query.limit ?? 50), 1), 100);
    // Keep the recipient envelope compatible with notifications written by the
    // earlier user-centric table, including records arriving during a rolling
    // deployment before the migration process has observed them.
    await app.dbClient.execute({
      sql: `INSERT OR IGNORE INTO notification_recipients (notification_id, user_id, read_at, created_at)
            SELECT id, user_id, read_at, created_at FROM notifications WHERE user_id = ?`,
      args: [request.principal!.userId],
    });
    const result = await app.dbClient.execute({
      sql: `SELECT n.id, n.type, n.title, n.body, n.href, r.read_at, n.created_at
            FROM notifications n JOIN notification_recipients r ON r.notification_id = n.id
            WHERE r.user_id = ? AND r.dismissed_at IS NULL ORDER BY n.created_at DESC LIMIT ?`,
      args: [request.principal!.userId, limit],
    });
    const unreadResult = await app.dbClient.execute({
      sql: 'SELECT COUNT(*) AS count FROM notification_recipients WHERE user_id = ? AND read_at IS NULL AND dismissed_at IS NULL',
      args: [request.principal!.userId],
    });
    const items = (result.rows as unknown as NotificationRow[]).map(toNotification);
    const unread = Number((unreadResult.rows[0] as { count?: number } | undefined)?.count ?? 0);
    return reply.send(successResponse({ items, unread }, 'Notifications retrieved'));
  });

  app.post<{ Body: { title: string; message: string; kind?: string; href?: string } }>('/', async (request, reply) => {
    if (request.principal!.role !== 'admin') return reply.forbidden('Only administrators can create notifications');
    const { title, message, kind = 'info', href = null } = request.body;
    if (!title?.trim() || !message?.trim()) return reply.badRequest('Notification title and message are required');
    const created = await createNotification(app, request.principal!.userId, { kind, title, message, href });
    return reply.code(201).send(successResponse(created, 'Notification created'));
  });

  app.patch<{ Params: { id: string }; Body: { read?: boolean } }>('/:id', async (request, reply) => {
    const readAt = request.body?.read === false ? null : new Date().toISOString();
    const result = await app.dbClient.execute({
      sql: 'UPDATE notification_recipients SET read_at = ? WHERE notification_id = ? AND user_id = ?',
      args: [readAt, request.params.id, request.principal!.userId],
    });
    if (result.rowsAffected === 0) return reply.notFound('Notification not found');
    return reply.send(successResponse({ id: request.params.id, readAt }, 'Notification state updated'));
  });

  app.post('/read-all', async (request, reply) => {
    const readAt = new Date().toISOString();
    await app.dbClient.execute({
      sql: 'UPDATE notification_recipients SET read_at = ? WHERE user_id = ? AND read_at IS NULL',
      args: [readAt, request.principal!.userId],
    });
    return reply.send(successResponse({ readAt }, 'All notifications marked as read'));
  });
}
