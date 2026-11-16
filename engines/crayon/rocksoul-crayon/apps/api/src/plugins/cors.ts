import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from '../config/env.js';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true,
  });
}
