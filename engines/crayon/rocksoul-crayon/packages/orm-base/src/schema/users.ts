import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations } from './organizations.js';
import { timestampColumns } from '../helpers/timestamps.js';
import { auditColumns } from '../helpers/audit.js';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  orgId: text('org_id').references(() => organizations.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'),
  plan: text('plan').default('Basic'),
  billing: text('billing'),
  status: text('status').default('Active'),
  phone: text('phone'),
  website: text('website'),
  location: text('location'),
  bio: text('bio'),
  company: text('company'),
  timezone: text('timezone'),
  language: text('language'),
  joinedDate: text('joined_date'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: text('last_login_at'),
  ...timestampColumns(),
  ...auditColumns(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

