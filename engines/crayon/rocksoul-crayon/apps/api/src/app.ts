import fastify, { type FastifyError, type FastifyInstance, type FastifyServerOptions } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { registerCors } from './plugins/cors.js';
import { registerSensible } from './plugins/sensible.js';
import { registerView } from './plugins/view.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerDb } from './plugins/db.js';
import { registerDbLogger } from './plugins/logger-db.js';
import { registerAuth } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { statsRoutes } from './routes/stats.js';
import { authRoutes } from './routes/v1/auth.js';
import { modelRoutes } from './routes/v1/models.js';
import { aiRoutes } from './routes/v1/ai.js';
import { aiWorkspaceRoutes } from './routes/v1/ai-workspaces.js';
import { notificationRoutes } from './routes/v1/notifications.js';
import { mailRoutes } from './routes/v1/mail.js';
import { organizationContextRoutes } from './routes/v1/organizations.js';
import { errorResponse } from '@rocksoul/common';
import { registerAepWebSocket } from './plugins/aep-websocket.js';
import { internalFlowRoutes } from './routes/internal-flow.js';
import { operationalWorkflowRoutes } from './routes/v1/operational-workflow.js';

export interface RouteRegistryItem {
  method: string;
  url: string;
  tags: string[];
  description: string;
  authRequired: boolean;
}

declare module 'fastify' {
  interface FastifyInstance {
    routeRegistry: RouteRegistryItem[];
  }
}

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify(opts);

  // Programmatic Route Tracker Hook
  const routeRegistry: RouteRegistryItem[] = [];
  app.decorate('routeRegistry', routeRegistry);

  app.addHook('onRoute', (routeOptions) => {
    const methods = Array.isArray(routeOptions.method) ? routeOptions.method : [routeOptions.method];
    for (const m of methods) {
      if (m === 'HEAD') continue;
      routeRegistry.push({
        method: m,
        url: routeOptions.url,
        tags: (routeOptions.schema?.tags as string[]) || [],
        description: (routeOptions.schema?.description as string) || (routeOptions.schema?.summary as string) || '',
        authRequired: Boolean(routeOptions.preHandler),
      });
    }
  });

  // Core Plugins
  await app.register(fastifyCookie);
  await registerSensible(app);
  await registerCors(app);
  await registerView(app);
  await registerSwagger(app);
  await registerDb(app);
  await registerDbLogger(app);
  await registerAuth(app);
  await registerAepWebSocket(app);

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    const message = error.message || 'Internal Server Error';

    return reply.status(statusCode).send(
      errorResponse(
        {
          code: error.code || 'INTERNAL_ERROR',
          statusCode,
        },
        message
      )
    );
  });

  // Root Stats, Telemetry & Overview Dashboard
  await app.register(statsRoutes);

  // Routes: Ramping & bersih
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(modelRoutes, { prefix: '/api/v1/models' });
  await app.register(aiRoutes, { prefix: '/api/v1/ai' });
  await app.register(aiWorkspaceRoutes, { prefix: '/api/v1/ai' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(mailRoutes, { prefix: '/api/v1/mail' });
  await app.register(organizationContextRoutes, { prefix: '/api/v1/organizations' });
  await app.register(operationalWorkflowRoutes, { prefix: '/api/v1/operational' });
  await app.register(internalFlowRoutes);

  return app;
}
