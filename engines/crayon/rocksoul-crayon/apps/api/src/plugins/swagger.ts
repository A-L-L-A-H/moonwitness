import type { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Rocksoul Fastify API',
        description: 'Clean Fastify Monorepo REST API documentation with Odoo-style Model Registry & Auth',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'Provide raw API Key generated from /api/v1/auth/api-keys (e.g. rs_live_...)',
          },
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'token',
            description: 'Provide session token obtained from /api/v1/auth/login',
          },
        },
      },
      tags: [
        { name: 'Authentication', description: 'User login, registration, and profile' },
        { name: 'API Key Management', description: 'Generate and manage API keys' },
        { name: 'Models Registry', description: 'Odoo ir.model introspection' },
        { name: 'Models Dynamic CRUD', description: 'Generic CRUD operations for any registered model' },
        { name: 'System', description: 'System healthcheck and diagnostic endpoints' },
      ],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}
