import { text } from 'drizzle-orm/sqlite-core';

/**
 * Reusable Timestamp Logic helper for SQLite models
 */
export function timestampColumns() {
  return {
    createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  };
}
