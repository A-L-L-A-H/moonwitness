import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const executionRecords = sqliteTable('execution_records', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  capabilityId: text('capability_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  status: text('status', { enum: ['ACCEPTED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] }).notNull().default('ACCEPTED'),
  inputJson: text('input_json').notNull(),
  resultJson: text('result_json'),
  errorCode: text('error_code'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
}, (table) => ({
  idempotencyIdentity: uniqueIndex('execution_records_actor_capability_idempotency_uq').on(table.actorId, table.capabilityId, table.idempotencyKey),
}));

export type ExecutionRecord = typeof executionRecords.$inferSelect;
export type NewExecutionRecord = typeof executionRecords.$inferInsert;
