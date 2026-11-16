import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const pricingPlans = sqliteTable('pricing_plans', {
  id: text('id').primaryKey(), // 'basic', 'professional', 'enterprise'
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: text('price').notNull(),
  frequency: text('frequency').notNull().default('/month'),
  features: text('features').notNull(), // JSON array string e.g. ["Up to 10 products", "Basic inventory tracking"]
  popular: integer('popular', { mode: 'boolean' }).notNull().default(false),
  current: integer('current', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  ...timestampColumns(),
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;
