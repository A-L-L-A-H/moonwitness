import type { FastifyInstance } from 'fastify';
import { successResponse, errorResponse } from '@rocksoul/common';
import { modelRegistry, ModelConflictError, ModelCrud } from '@rocksoul/orm';
import { authorize, isDiscoverable, protectedSelfFields, type AuthorizationAction } from '../../security/authorization.js';
import { aepEventHub } from '../../services/aep-events.js';
import { enqueueAepEventInTransaction } from '../../services/aep-event-outbox.js';
import { randomUUID } from 'node:crypto';

const taskStatuses = new Set(['backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled']);
const taskPriorities = new Set(['low', 'medium', 'high', 'critical']);
const resourceResolutions = new Set(['canonical', 'candidate', 'unresolved', 'missing', 'stale']);
function validBoundedInput(model: string, input: Record<string, unknown>): string | undefined {
  if (model === 'tasks') {
    if (input.status !== undefined && (!taskStatuses.has(String(input.status)))) return 'Invalid task status';
    if (input.priority !== undefined && (!taskPriorities.has(String(input.priority)))) return 'Invalid task priority';
  }
  if (model === 'resource_references' && input.resolution !== undefined && !resourceResolutions.has(String(input.resolution))) return 'Invalid resource resolution';
  return undefined;
}

function authorizeModel(request: any, reply: any, model: string, action: AuthorizationAction, record?: Record<string, unknown>): boolean {
  const decision = authorize(request.principal, model, action, record);
  if (decision.allowed) return true;
  reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to perform this operation'));
  return false;
}

function canListModel(request: any, reply: any, model: string): boolean {
  const decision = authorize(request.principal, model, 'read');
  if (decision.allowed && (decision.scope === 'all' || (decision.scope === 'self' && ['mails', 'chat_conversations', 'chat_messages', 'calendars', 'calendar_events'].includes(model)))) return true;
  reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to list this resource'));
  return false;
}

export async function modelRoutes(app: FastifyInstance): Promise<void> {
  // Protect semua model routes dengan authentication (API Key atau Bearer Token)
  app.addHook('preHandler', app.authenticate);

  // 1. Introspeksi seluruh Model terdaftar (Odoo ir.model style)
  app.get(
    '/',
    {
      schema: {
        description: 'Get all registered models and their schema metadata (Odoo ir.model style)',
        tags: ['Models Registry'],
      },
    },
    async (request, reply) => {
      const models = modelRegistry.list().filter(model => isDiscoverable(request.principal, model.name));
      return reply.code(200).send(successResponse(models, 'Registered models retrieved successfully'));
    }
  );

  // 2. AutoMenu Hierarchical Tree (Odoo ir.ui.menu style)
  app.get(
    '/menu',
    {
      schema: {
        description: 'Get auto-generated navigation menu tree grouped by category',
        tags: ['Models Registry'],
      },
    },
    async (request, reply) => {
      const menu = modelRegistry.getMenu().map(group => ({ ...group, items: group.items.filter(item => isDiscoverable(request.principal, item.name)) })).filter(group => group.items.length);
      return reply.code(200).send(successResponse(menu, 'Navigation menu tree retrieved successfully'));
    }
  );

  // 3. UI-Driven Model Metadata (AutoTable & AutoCRUD schema)
  app.get<{ Params: { model: string } }>(
    '/:model/metadata',
    {
      schema: {
        description: 'Get UI-driven metadata (autotable columns, autocrud form fields, and relations)',
        tags: ['Models Registry'],
        params: {
          type: 'object',
          required: ['model'],
          properties: { model: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { model: modelName } = request.params;
      const modelDef = modelRegistry.get(modelName);

      if (!modelDef) {
        return reply.notFound(`Model '${modelName}' not found in registry`);
      }
      if (!authorizeModel(request, reply, modelDef.name, 'read')) return;

      return reply.code(200).send(
        successResponse(
          {
            name: modelDef.name,
            tableName: modelDef.tableName,
            primaryKey: modelDef.primaryKey,
            searchableFields: modelDef.searchableFields,
            defaultOrderField: modelDef.defaultOrderField,
            description: modelDef.description,
            ui: modelDef.ui,
          },
          `Metadata for model '${modelName}' retrieved successfully`
        )
      );
    }
  );

  // 2. Dynamic List & Search Records: /api/v1/models/:model
  app.get<{
    Params: { model: string };
    Querystring: {
      page?: number;
      limit?: number;
      search?: string;
      order?: string;
      direction?: 'asc' | 'desc';
      [key: string]: unknown;
    };
  }>(
    '/:model',
    {
      schema: {
        description: 'Dynamic list/search records for any registered model',
        tags: ['Models Dynamic CRUD'],
        params: {
          type: 'object',
          required: ['model'],
          properties: { model: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { model: modelName } = request.params;
      const modelDef = modelRegistry.get(modelName);

      if (!modelDef) {
        return reply.notFound(`Model '${modelName}' not found in registry`);
      }
      if (!canListModel(request, reply, modelDef.name)) return;

      const { page, limit, search, order, direction, ...filter } = request.query;
      if (request.principal?.role === 'user') {
        if (modelDef.name === 'mails') filter.userId = request.principal.userId;
        if (modelDef.name === 'chat_conversations') filter.createdBy = request.principal.userId;
        if (modelDef.name === 'chat_messages') {
          const conversationModel = modelRegistry.get('chat_conversations');
          if (conversationModel) {
            const conversations = await ModelCrud.findMany<{ id: string }>(app.db, conversationModel, { limit: 100, filter: { createdBy: request.principal.userId } });
            filter.conversationId = conversations.items.map((conversation) => conversation.id);
          }
        }
        if (modelDef.name === 'calendars' || modelDef.name === 'calendar_events') filter.userId = request.principal.userId;
      }

      const result = await ModelCrud.findMany(app.db, modelDef, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search,
        order,
        direction,
        filter: filter as Record<string, unknown>,
      });

      return reply.code(200).send(successResponse(result, `Records for model '${modelName}' retrieved`));
    }
  );

  // 3. Dynamic Read Record by ID: /api/v1/models/:model/:id
  app.get<{
    Params: { model: string; id: string };
  }>(
    '/:model/:id',
    {
      schema: {
        description: 'Get a single record by ID for any registered model',
        tags: ['Models Dynamic CRUD'],
        params: {
          type: 'object',
          required: ['model', 'id'],
          properties: {
            model: { type: 'string' },
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { model: modelName, id } = request.params;
      const modelDef = modelRegistry.get(modelName);

      if (!modelDef) {
        return reply.notFound(`Model '${modelName}' not found in registry`);
      }
      if (!authorizeModel(request, reply, modelDef.name, 'read')) return;

      const record = await ModelCrud.findById(app.db, modelDef, id);
      if (!record) {
        return reply.notFound(`Record with id '${id}' not found in model '${modelName}'`);
      }
      if (!authorizeModel(request, reply, modelDef.name, 'read', record as Record<string, unknown>)) return;

      return reply.code(200).send(successResponse(record, 'Record retrieved'));
    }
  );

  // 4. Dynamic Create Record: POST /api/v1/models/:model
  app.post<{
    Params: { model: string };
    Body: Record<string, unknown>;
  }>(
    '/:model',
    {
      schema: {
        description: 'Create a new record in any registered model',
        tags: ['Models Dynamic CRUD'],
        params: {
          type: 'object',
          required: ['model'],
          properties: { model: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { model: modelName } = request.params;
      const modelDef = modelRegistry.get(modelName);

      if (!modelDef) {
        return reply.notFound(`Model '${modelName}' not found in registry`);
      }
      if (!authorizeModel(request, reply, modelDef.name, 'create')) return;

      try {
        const input = { ...(request.body || {}) };
        const validationError = validBoundedInput(modelDef.name, input);
        if (validationError) return reply.badRequest(validationError);
        if (modelDef.name === 'mails' && request.principal?.role === 'user') input.userId = request.principal.userId;
        if (modelDef.name === 'chat_conversations' && request.principal?.role === 'user') input.createdBy = request.principal.userId;
        if (modelDef.name === 'chat_messages' && request.principal?.role === 'user') input.senderId = request.principal.userId;
        if ((modelDef.name === 'calendars' || modelDef.name === 'calendar_events') && request.principal?.role === 'user') input.userId = request.principal.userId;
      const event = { eventId: randomUUID(), eventType: 'resource.created' as const, resource: modelDef.name, recordId: '', principalId: request.principal!.userId, timestamp: Date.now(), payload: undefined as unknown };
      const created = await app.db.transaction(async (tx) => {
        const record = await ModelCrud.create(tx, modelDef, input, request.principal!.userId);
        event.recordId = String((record as Record<string, unknown>).id ?? '');
        event.payload = record;
        await enqueueAepEventInTransaction(tx, event, request.principal!.userId);
        return record;
      });
      aepEventHub.publish(event);
        return reply.code(201).send(successResponse(created, `Record created in model '${modelName}'`));
      } catch (err: unknown) {
        const error = err as Error & { code?: string; cause?: { message?: string } };
        const fullMsg = `${error.message || ''} ${error.cause?.message || ''}`;
        if (fullMsg.includes('UNIQUE constraint') || fullMsg.includes('SQLITE_CONSTRAINT')) {
          return reply.badRequest(`Unique constraint violation: ${fullMsg}`);
        }
        throw err;
      }
    }
  );

  // 5. Dynamic Update Record: PUT/PATCH /api/v1/models/:model/:id
  const updateHandler = async (
    request: any,
    reply: any
  ) => {
    const { model: modelName, id } = request.params;
    const modelDef = modelRegistry.get(modelName);

    if (!modelDef) {
      return reply.notFound(`Model '${modelName}' not found in registry`);
    }
    if (!authorizeModel(request, reply, modelDef.name, 'update')) return;

    const existing = await ModelCrud.findById(app.db, modelDef, id);
    if (!existing) return reply.notFound(`Record with id '${id}' not found in model '${modelName}'`);
    if (!authorizeModel(request, reply, modelDef.name, 'update', existing as Record<string, unknown>)) return;
    if (modelDef.name === 'users' && request.principal?.role === 'user' && Object.keys(request.body || {}).some(field => protectedSelfFields.has(field))) {
      return reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to modify protected account fields'));
    }
    if (['review_items', 'research_cases', 'research_work_items'].includes(modelDef.name) && Object.prototype.hasOwnProperty.call(request.body || {}, 'status')) {
      return reply.code(400).send(errorResponse({ code: 'WORKFLOW_TRANSITION_REQUIRED', statusCode: 400 }, 'Use the dedicated workflow transition endpoint for status changes'));
    }

    try {
      const event = { eventId: randomUUID(), eventType: 'resource.updated' as const, resource: modelDef.name, recordId: id, principalId: request.principal!.userId, timestamp: Date.now(), payload: undefined as unknown };
      const input = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {};
      const validationError = validBoundedInput(modelDef.name, input);
      if (validationError) return reply.badRequest(validationError);
      const expectedVersion = typeof input.expectedVersion === 'string' ? input.expectedVersion : undefined;
      const updated = await app.db.transaction(async (tx) => {
        const record = await ModelCrud.update(tx, modelDef, id, input, request.principal!.userId, { expectedVersion });
        event.payload = record;
        if (record) await enqueueAepEventInTransaction(tx, event, request.principal!.userId);
        return record;
      });
      if (!updated) {
        return reply.notFound(`Record with id '${id}' not found in model '${modelName}'`);
      }

      aepEventHub.publish(event);

      return reply.code(200).send(successResponse(updated, `Record '${id}' in model '${modelName}' updated`));
    } catch (err: unknown) {
      if (err instanceof ModelConflictError) {
        return reply.code(409).send(errorResponse({
          code: err.code,
          statusCode: err.statusCode,
          details: { id: err.recordId, expectedVersion: err.expectedVersion, actualVersion: err.actualVersion },
        }, 'The record changed before your update was applied'));
      }
      const error = err as Error & { code?: string; cause?: { message?: string } };
      const fullMsg = `${error.message || ''} ${error.cause?.message || ''}`;
      if (fullMsg.includes('UNIQUE constraint') || fullMsg.includes('SQLITE_CONSTRAINT')) {
        return reply.badRequest(`Unique constraint violation: ${fullMsg}`);
      }
      throw err;
    }
  };

  app.put('/:model/:id', { schema: { tags: ['Models Dynamic CRUD'] } }, updateHandler);
  app.patch('/:model/:id', { schema: { tags: ['Models Dynamic CRUD'] } }, updateHandler);

  // 6. Dynamic Delete Record: DELETE /api/v1/models/:model/:id
  app.delete<{
    Params: { model: string; id: string };
  }>(
    '/:model/:id',
    {
      schema: {
        description: 'Delete a record by ID in any registered model',
        tags: ['Models Dynamic CRUD'],
        params: {
          type: 'object',
          required: ['model', 'id'],
          properties: {
            model: { type: 'string' },
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { model: modelName, id } = request.params;
      const modelDef = modelRegistry.get(modelName);

      if (!modelDef) {
        return reply.notFound(`Model '${modelName}' not found in registry`);
      }
      if (!authorizeModel(request, reply, modelDef.name, 'delete')) return;

      const existing = await ModelCrud.findById(app.db, modelDef, id);
      if (!existing) return reply.notFound(`Record with id '${id}' not found in model '${modelName}'`);
      if (!authorizeModel(request, reply, modelDef.name, 'delete', existing as Record<string, unknown>)) return;

      if (modelDef.name === 'organizations') {
        // Clear active user context and memberships before deleting the referenced organization.
        await app.dbClient.execute({ sql: 'UPDATE users SET org_id = NULL WHERE org_id = ?', args: [id] });
        await app.dbClient.execute({ sql: 'DELETE FROM organization_members WHERE organization_id = ?', args: [id] });
      }

      const event = { eventId: randomUUID(), eventType: 'resource.deleted' as const, resource: modelDef.name, recordId: id, principalId: request.principal!.userId, timestamp: Date.now(), payload: { id, deleted: true } };
      const deleted = await app.db.transaction(async (tx) => {
        const result = await ModelCrud.delete(tx, modelDef, id);
        if (result) await enqueueAepEventInTransaction(tx, event, request.principal!.userId);
        return result;
      });
      if (!deleted) {
        return reply.notFound(`Record with id '${id}' not found in model '${modelName}'`);
      }

      aepEventHub.publish(event);
      return reply.code(200).send(successResponse({ id, deleted: true }, `Record '${id}' deleted`));
    }
  );
}
