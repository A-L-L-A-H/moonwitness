import type { FastifyPluginAsync } from 'fastify';
import { ai, type ExecutionContext } from '@rocksoul/ai-base';
import { successResponse, errorResponse } from '@rocksoul/common';
import { z } from 'zod';

const chatBodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  threadId: z.string().optional(),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
  repositoryId: z.string().optional(),
  workspaceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const aiRoutes: FastifyPluginAsync = async (app) => {
  // Pre-handler hook to enforce authentication across all AI endpoints
  app.addHook('preHandler', app.authenticate);

  /**
   * GET /api/v1/ai/agents
   * List available agents and their readiness status
   */
  app.get('/agents', {
    schema: {
      tags: ['AI Engine'],
      summary: 'List available AI agents',
      description: 'Returns all registered AI agents with their status (FOUNDATION, IMPLEMENTED, etc.)',
    },
  }, async (_request, reply) => {
    const agents = ai.getAgents();
    return reply.send(successResponse(agents, 'Available agents retrieved successfully'));
  });

  app.get('/threads', async (request, reply) => {
    const threads = await ai.memory.listThreads(request.principal!.userId);
    return reply.send(successResponse(threads, 'AI threads retrieved successfully'));
  });

  app.get('/threads/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const thread = await ai.memory.getThread(id);
    if (!thread) return reply.status(404).send(errorResponse({ code: 'THREAD_NOT_FOUND', statusCode: 404 }, 'AI thread not found'));
    if (request.principal!.role !== 'admin' && thread.metadata.ownerUserId !== request.principal!.userId) return reply.status(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to inspect this AI thread'));
    return reply.send(successResponse({ thread, messages: await ai.memory.getMessages(id) }, 'AI thread history retrieved successfully'));
  });

  /**
   * POST /api/v1/ai/chat
   * Contextual chat with orchestrator/assistant
   */
  app.post('/chat', {
    schema: {
      tags: ['AI Engine'],
      summary: 'Send prompt to AI Engine',
      description: 'Processes conversational or task-oriented prompts within user execution context',
    },
  }, async (request, reply) => {
    const parsed = chatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          { code: 'VALIDATION_ERROR', statusCode: 400, details: parsed.error.format() },
          'Invalid chat request body'
        )
      );
    }

    const { prompt, threadId, agentId, projectId, repositoryId, workspaceId, metadata } = parsed.data;

    // Parse scopes safely from apiKey if available
    let permissions: string[] = [];
    if (request.apiKey?.scopes) {
      try {
        permissions = JSON.parse(request.apiKey.scopes);
      } catch {
        permissions = [request.apiKey.scopes];
      }
    }

    // Convert existing Fastify auth & request context into AI ExecutionContext
    const context: ExecutionContext = {
      requestId: request.id,
      userId: request.user?.id || null,
      organizationId: request.user?.orgId || null,
      projectId: projectId || null,
      repositoryId: repositoryId || null,
      workspaceId: workspaceId || null,
      permissions,
      metadata: {
        source: 'fastify-api',
        userRole: request.user?.role,
        apiKeyId: request.apiKey?.id,
        ...metadata,
      },
    };

    try {
      const run = await ai.chat({
        prompt,
        context,
        threadId,
        agentId,
      });
      run.metadata = { ...(run.metadata || {}), ownerUserId: request.principal!.userId };

      return reply.send(successResponse(run, 'AI execution completed'));
    } catch (err: any) {
      request.log.error({ err }, 'Error in AI chat execution');
      return reply.status(500).send(
        errorResponse(
          { code: 'AI_EXECUTION_ERROR', statusCode: 500 },
          'AI execution failed'
        )
      );
    }
  });

  /**
   * POST /api/v1/ai/runs
   * Initiate execution run
   */
  app.post('/runs', {
    schema: {
      tags: ['AI Engine'],
      summary: 'Initiate AI execution run',
    },
  }, async (request, reply) => {
    const parsed = chatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          { code: 'VALIDATION_ERROR', statusCode: 400, details: parsed.error.format() },
          'Invalid run request body'
        )
      );
    }

    const { prompt, threadId, agentId, projectId, repositoryId, workspaceId, metadata } = parsed.data;

    let permissions: string[] = [];
    if (request.apiKey?.scopes) {
      try {
        permissions = JSON.parse(request.apiKey.scopes);
      } catch {
        permissions = [request.apiKey.scopes];
      }
    }

    const context: ExecutionContext = {
      requestId: request.id,
      userId: request.user?.id || null,
      organizationId: request.user?.orgId || null,
      projectId: projectId || null,
      repositoryId: repositoryId || null,
      workspaceId: workspaceId || null,
      permissions,
      metadata: {
        source: 'fastify-api',
        userRole: request.user?.role,
        apiKeyId: request.apiKey?.id,
        ...metadata,
      },
    };

    try {
      const run = ai.start({
        prompt,
        context,
        threadId,
        agentId,
      });
      run.metadata = { ...(run.metadata || {}), ownerUserId: request.principal!.userId };

      return reply.status(201).send(successResponse(run, 'AI Run created successfully'));
    } catch {
      return reply.status(500).send(
        errorResponse(
          { code: 'AI_RUN_ERROR', statusCode: 500 },
          'Failed to start AI run'
        )
      );
    }
  });

  /**
   * GET /api/v1/ai/runs/:id
   * Get run details by ID
   */
  app.get('/runs/:id', {
    schema: {
      tags: ['AI Engine'],
      summary: 'Get AI run details',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = ai.getRun(id);

    if (!run) {
      return reply.status(404).send(
        errorResponse({ code: 'RUN_NOT_FOUND', statusCode: 404 }, `AI Run with ID "${id}" not found`)
      );
    }
    if (request.principal!.role !== 'admin' && run.metadata?.ownerUserId !== request.principal!.userId) {
      return reply.status(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to inspect this AI run'));
    }

    return reply.send(successResponse(run, 'AI Run retrieved successfully'));
  });

  /**
   * POST /api/v1/ai/runs/:id/cancel
   * Cancel an active or pending run
   */
  app.post('/runs/:id/cancel', {
    schema: {
      tags: ['AI Engine'],
      summary: 'Cancel AI run',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = ai.getRun(id);
    if (run && request.principal!.role !== 'admin' && run.metadata?.ownerUserId !== request.principal!.userId) {
      return reply.status(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to cancel this AI run'));
    }
    const cancelled = ai.cancelRun(id);

    if (!cancelled) {
      return reply.status(400).send(
        errorResponse(
          { code: 'CANCEL_FAILED', statusCode: 400 },
          `AI Run "${id}" could not be cancelled or does not exist`
        )
      );
    }

    return reply.send(successResponse({ runId: id, status: 'cancelled' }, 'AI Run cancelled successfully'));
  });
};
