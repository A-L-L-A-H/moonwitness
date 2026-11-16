import type { FastifyInstance } from 'fastify';
import { successResponse, type HealthStatus } from '@rocksoul/common';
import { env } from '../config/env.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        description: 'Check service health and uptime',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string' },
                  uptime: { type: 'number' },
                  environment: { type: 'string' },
                  version: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const data: HealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: '1.0.0',
      };

      return reply.code(200).send(successResponse(data, 'Service is healthy'));
    }
  );
}
