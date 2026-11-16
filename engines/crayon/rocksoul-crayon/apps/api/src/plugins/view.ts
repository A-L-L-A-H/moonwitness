import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function viewPlugin(app: FastifyInstance): Promise<void> {
  const candidates = [
    resolve(__dirname, '../../views'),
    resolve(__dirname, '../views'),
    resolve(process.cwd(), 'apps/api/views'),
    resolve(process.cwd(), 'views'),
  ];
  const viewsDir = candidates.find((dir) => existsSync(dir)) || candidates[0];

  await app.register(fastifyView, {
    engine: {
      ejs,
    },
    root: viewsDir,
    propertyName: 'view',
  });
}

export const registerView = fp(viewPlugin, {
  name: 'rocksoul-view',
});
