import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const landingFeatures = sqliteTable('landing_features', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  category: text('category', { enum: ['main', 'secondary'] }).notNull().default('main'),
  orderIndex: integer('order_index').notNull().default(0),
  ...timestampColumns(),
});

export type LandingFeature = typeof landingFeatures.$inferSelect;
export type NewLandingFeature = typeof landingFeatures.$inferInsert;
