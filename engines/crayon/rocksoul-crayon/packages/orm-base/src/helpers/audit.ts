import { text } from 'drizzle-orm/sqlite-core';

/**
 * Reusable Audit Logic helper for SQLite models
 */
export function auditColumns() {
  return {
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
  };
}
