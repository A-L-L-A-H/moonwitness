import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { systemLogs, type NewSystemLog } from '@rocksoul/orm';

declare module 'fastify' {
  interface FastifyInstance {
    logToDb: (entry: {
      level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
      message: string;
      reqId?: string;
      method?: string;
      url?: string;
      statusCode?: number;
      responseTime?: number;
      context?: Record<string, unknown> | string;
    }) => Promise<void>;
  }
}

async function dbLoggerPlugin(app: FastifyInstance): Promise<void> {
  // Helper untuk mencatat log langsung ke database SQLite (system_logs)
  const logToDb = async (entry: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    message: string;
    reqId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    responseTime?: number;
    context?: Record<string, unknown> | string;
  }) => {
    try {
      const record: NewSystemLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        level: entry.level,
        message: entry.message,
        reqId: entry.reqId,
        method: entry.method,
        url: entry.url,
        statusCode: entry.statusCode,
        responseTime: entry.responseTime ? Math.round(entry.responseTime) : undefined,
        context:
          typeof entry.context === 'object'
            ? JSON.stringify(entry.context)
            : entry.context,
        createdAt: new Date().toISOString(),
      };

      await app.db.insert(systemLogs).values(record);
    } catch (err) {
      // Pastikan kegagalan penulisan log tidak merusak alur aplikasi
      app.log.error(err, 'Failed to persist system log to SQLite database');
    }
  };

  app.decorate('logToDb', logToDb);

  // Hook onResponse: Catat setiap request HTTP yang selesai diproses
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Lewati log internal /health jika tidak ingin memenuhi database, atau simpan
    const isHealthCheck = request.url === '/health';
    if (isHealthCheck && reply.statusCode === 200) {
      return;
    }

    const responseTime = reply.elapsedTime;
    const level = reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info';
    const message = `HTTP ${request.method} ${request.url} ${reply.statusCode} - ${responseTime.toFixed(2)}ms`;

    await logToDb({
      level,
      message,
      reqId: String(request.id),
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime,
      context: {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });
  });

  // Hook onError: Catat error yang terjadi saat pemrosesan request
  app.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    await logToDb({
      level: 'error',
      message: `Error on ${request.method} ${request.url}: ${error.message}`,
      reqId: String(request.id),
      method: request.method,
      url: request.url,
      context: {
        name: error.name,
        stack: error.stack,
      },
    });
  });
}

export const registerDbLogger = fp(dbLoggerPlugin, {
  name: 'rocksoul-db-logger',
  dependencies: ['rocksoul-db'],
});
