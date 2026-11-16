import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const systemLogs = sqliteTable('system_logs', {
  id: text('id').primaryKey(),
  level: text('level', { enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] }).notNull().default('info'),
  message: text('message').notNull(),
  reqId: text('req_id'),
  method: text('method'),
  url: text('url'),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'), // milliseconds
  context: text('context'), // JSON stringified metadata/stacktrace
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
