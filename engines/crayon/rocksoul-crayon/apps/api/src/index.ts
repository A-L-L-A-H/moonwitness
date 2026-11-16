import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  const isPretty = env.NODE_ENV === 'development' || Boolean(process.stdout.isTTY);
  const app = await buildApp({
    logger: isPretty
      ? {
          level: env.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
        }
      : {
          level: env.LOG_LEVEL,
        },
  });

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, closing server gracefully...`);
      try {
        await app.close();
        app.log.info('Server closed successfully.');
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error closing server');
        process.exit(1);
      }
    });
  }

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    app.log.info(`🚀 Fastify server is running on ${address}`);
    app.log.info(`📚 Swagger Documentation: ${address}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
