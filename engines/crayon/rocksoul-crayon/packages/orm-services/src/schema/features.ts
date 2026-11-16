import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const pricingFeatures = sqliteTable('pricing_features', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  ...timestampColumns(),
});

export type PricingFeature = typeof pricingFeatures.$inferSelect;
export type NewPricingFeature = typeof pricingFeatures.$inferInsert;
