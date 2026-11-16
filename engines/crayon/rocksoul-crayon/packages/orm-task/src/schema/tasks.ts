import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users, timestampColumns, auditColumns } from '@rocksoul/orm-base';
import { projects } from '@rocksoul/orm-project';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), // e.g. "TASK-1001" or uuid
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status', { enum: ['backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled'] }).notNull().default('todo'),
  category: text('category').notNull().default('feature'), // 'feature', 'bug', 'documentation'
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
  assigneeId: text('assignee_id').references(() => users.id),
  dueDate: text('due_date'),
  description: text('description'),
  ...timestampColumns(),
  ...auditColumns(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
