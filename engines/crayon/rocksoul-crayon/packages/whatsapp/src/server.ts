import fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { whatsappPlugin, type WhatsAppPluginOptions } from './fastify-plugin.js';

export interface WhatsAppServerOptions extends WhatsAppPluginOptions {
  port?: number;
  host?: string;
  corsOrigin?: string | boolean;
}

/**
 * Build the Fastify WhatsApp standalone server instance.
 */
export async function buildWhatsAppServer(options: WhatsAppServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register CORS
  await app.register(cors, {
    origin: options.corsOrigin ?? '*',
  });

  // Register WhatsApp plugin
  await app.register(whatsappPlugin, {
    baseSessionsDir: options.baseSessionsDir || process.env.WA_SESSIONS_DIR,
    defaultClientOptions: options.defaultClientOptions,
    databaseUrl: options.databaseUrl || process.env.WA_DATABASE_URL,
    password: options.password || process.env.WA_DASHBOARD_PASSWORD,
  });

  return app;
}

// Auto-start when executed directly
async function main() {
  const port = Number(process.env.WA_PORT || 3001);
  const host = process.env.WA_HOST || '0.0.0.0';

  const app = await buildWhatsAppServer();

  try {
    await app.listen({ port, host });
    app.log.info(`🚀 WhatsApp Gateway Server listening on http://${host}:${port}`);
    app.log.info(`📱 Scan QR in browser: http://localhost:${port}/sessions/default/qr`);
    app.log.info(`📊 Health check: http://localhost:${port}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Check if running as main module
const isMain = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');
if (isMain) {
  void main();
}
