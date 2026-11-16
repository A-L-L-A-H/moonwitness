import type { FastifyPluginAsync } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { ai, type ExecutionContext } from '@rocksoul/ai-base';
import { modelRegistry, ModelCrud } from '@rocksoul/orm';
import { z } from 'zod';
import { errorResponse, successResponse } from '@rocksoul/common';
import { authorize } from '../security/authorization.js';

const requestSchema = z.object({
  capability: z.string().min(1).max(128), input: z.record(z.unknown()),
  ownerUserId: z.string().min(1).max(256), idempotencyKey: z.string().min(1).max(256),
});
const aiSchema = z.object({ prompt: z.string().min(1).max(32_000), threadId: z.string().optional(), agentId: z.string().optional(), projectId: z.string().optional(), repositoryId: z.string().optional(), workspaceId: z.string().optional(), metadata: z.record(z.unknown()).optional(), ownerUserId: z.string().min(1).max(256), idempotencyKey: z.string().min(1).max(256) });
const inflight = new Map<string, Promise<unknown>>();

function validKey(value: unknown): boolean {
  const actual = Buffer.from(String(value ?? ''));
  const expected = Buffer.from(process.env.FLOW_INTERNAL_API_KEY || 'development-flow-internal-key');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function fail(reply: any, status: number, code: string, message: string) { return reply.status(status).send(errorResponse({ code, statusCode: status }, message)); }

export const internalFlowRoutes: FastifyPluginAsync = async (app) => {
  app.post('/internal/flow/capability', async (request, reply) => {
    if (!validKey(request.headers['x-flow-internal-key'])) return fail(reply, 401, 'UNAUTHORIZED', 'Internal authentication required');
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', 'Invalid capability request');
    const { capability, input, ownerUserId, idempotencyKey } = parsed.data;
    const key = `${ownerUserId}:${capability}:${idempotencyKey}`;
    const existing = inflight.get(key); if (existing) return reply.send(successResponse(await existing, 'Capability execution completed'));
    const work = (async () => {
      if (capability === 'ai.chat') { const aiInput = aiSchema.safeParse({ ...input, ownerUserId, idempotencyKey }); if (!aiInput.success) throw Object.assign(new Error('Invalid AI capability input'), { statusCode: 400, code: 'VALIDATION_ERROR' }); return executeAi(app, aiInput.data); }
      const match = /^(projects|tasks)\.(list|get|create|update|delete)$/.exec(capability);
      if (!match) throw Object.assign(new Error('Capability is not available to Flow'), { statusCode: 403, code: 'CAPABILITY_FORBIDDEN' });
      const [, resource, operation] = match; const action = operation === 'list' || operation === 'get' ? 'read' : operation as 'create'|'update'|'delete';
      const principal = { userId: ownerUserId, role: 'user' as const };
      const decision = authorize(principal, resource, action); if (!decision.allowed) throw Object.assign(new Error('Capability authorization denied'), { statusCode: 403, code: 'FORBIDDEN' });
      const model = modelRegistry.get(resource); if (!model) throw new Error('Resource unavailable');
      if (action === 'read') return operation === 'list' ? ModelCrud.findMany(app.db, model, { page: Number(input.page || 1), limit: Math.min(100, Number(input.limit || 20)) }) : ModelCrud.findById(app.db, model, String(input.id));
      if (action === 'create') return ModelCrud.create(app.db, model, input, ownerUserId);
      if (action === 'update') { const { id, expectedVersion, ...changes } = input; return ModelCrud.update(app.db, model, String(id), changes, ownerUserId, { expectedVersion: typeof expectedVersion === 'string' ? expectedVersion : undefined }); }
      return { id: String(input.id), deleted: await ModelCrud.delete(app.db, model, String(input.id)) };
    })();
    inflight.set(key, work); try { return reply.send(successResponse(await work, 'Capability execution completed')); } catch (error: any) { return fail(reply, error.statusCode || 502, error.code || 'CAPABILITY_FAILED', error.statusCode ? error.message : 'Capability execution failed'); } finally { inflight.delete(key); }
  });
  app.post('/internal/flow/ai', async (request, reply) => {
    if (!validKey(request.headers['x-flow-internal-key'])) return fail(reply, 401, 'UNAUTHORIZED', 'Internal authentication required');
    const parsed = aiSchema.safeParse(request.body); if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', 'Invalid AI request');
    const { ownerUserId, idempotencyKey } = parsed.data; const key = `${ownerUserId}:ai.chat:${idempotencyKey}`; const existing = inflight.get(key); if (existing) return reply.send(successResponse(await existing, 'AI execution completed'));
    const work = executeAi(app, parsed.data); inflight.set(key, work); try { return reply.send(successResponse(await work, 'AI execution completed')); } catch { return fail(reply, 502, 'AI_EXECUTION_FAILED', 'AI execution failed'); } finally { inflight.delete(key); }
  });
};

async function executeAi(app: any, input: z.infer<typeof aiSchema>) {
  const context: ExecutionContext = { requestId: `flow-${input.idempotencyKey}`, userId: input.ownerUserId, organizationId: null, projectId: input.projectId || null, repositoryId: input.repositoryId || null, workspaceId: input.workspaceId || null, permissions: [], metadata: { source: 'flow-runtime', ...input.metadata } };
  const run = await ai.chat({ prompt: input.prompt, context, threadId: input.threadId, agentId: input.agentId });
  run.metadata = { ...(run.metadata || {}), ownerUserId: input.ownerUserId };
  return run;
}
