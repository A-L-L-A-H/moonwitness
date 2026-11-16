import type { FastifyInstance } from 'fastify';
import { successResponse } from '@rocksoul/common';
import { randomUUID } from 'node:crypto';

export async function organizationContextRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request, reply) => {
    const result = await app.dbClient.execute({
      sql: `SELECT o.id, o.name, o.code, o.currency, o.is_active, m.role, CASE WHEN u.org_id = o.id THEN 1 ELSE 0 END AS current
            FROM organization_members m JOIN organizations o ON o.id = m.organization_id JOIN users u ON u.id = m.user_id
            WHERE m.user_id = ? AND o.is_active = 1 ORDER BY o.name`,
      args: [request.principal!.userId],
    });
    return reply.send(successResponse((result.rows as unknown[]).map((row) => row), 'Organization contexts retrieved'));
  });

  app.post<{ Params: { id: string } }>('/:id/switch', async (request, reply) => {
    const membership = await app.dbClient.execute({ sql: 'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?', args: [request.params.id, request.principal!.userId] });
    if (membership.rows.length === 0) return reply.forbidden('You are not a member of this organization');
    await app.dbClient.execute({ sql: 'UPDATE users SET org_id = ?, updated_at = ? WHERE id = ?', args: [request.params.id, new Date().toISOString(), request.principal!.userId] });
    return reply.send(successResponse({ organizationId: request.params.id }, 'Organization context switched'));
  });

  app.post<{ Params: { id: string }; Body: { userId: string; role?: string } }>('/:id/members', async (request, reply) => {
    if (request.principal!.role !== 'admin') return reply.forbidden('Only administrators can manage organization membership');
    const { userId, role = 'member' } = request.body;
    if (!userId) return reply.badRequest('userId is required');
    const now = new Date().toISOString();
    try {
      await app.dbClient.execute({ sql: 'INSERT INTO organization_members (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)', args: [`mem_${randomUUID()}`, request.params.id, userId, role, now] });
    } catch (error: unknown) {
      if (String(error).includes('UNIQUE constraint')) return reply.badRequest('User is already a member');
      throw error;
    }
    return reply.code(201).send(successResponse({ organizationId: request.params.id, userId, role }, 'Organization member added'));
  });

  app.get<{ Params: { id: string } }>('/:id/members', async (request, reply) => {
    if (request.principal!.role !== 'admin') return reply.forbidden('Only administrators can list organization membership');
    const result = await app.dbClient.execute({ sql: `SELECT m.user_id AS userId, u.name, u.email, m.role, m.created_at AS createdAt FROM organization_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? ORDER BY u.name`, args: [request.params.id] });
    return reply.send(successResponse(result.rows, 'Organization members retrieved'));
  });

  app.delete<{ Params: { id: string; userId: string } }>('/:id/members/:userId', async (request, reply) => {
    if (request.principal!.role !== 'admin') return reply.forbidden('Only administrators can remove organization membership');
    const result = await app.dbClient.execute({ sql: 'DELETE FROM organization_members WHERE organization_id = ? AND user_id = ?', args: [request.params.id, request.params.userId] });
    if (result.rowsAffected === 0) return reply.notFound('Organization membership not found');
    return reply.send(successResponse({ organizationId: request.params.id, userId: request.params.userId, removed: true }, 'Organization member removed'));
  });
}
