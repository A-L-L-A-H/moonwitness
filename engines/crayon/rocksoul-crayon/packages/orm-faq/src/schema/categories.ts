import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const faqCategories = sqliteTable('faq_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  ...timestampColumns(),
});

export type FaqCategory = typeof faqCategories.$inferSelect;
export type NewFaqCategory = typeof faqCategories.$inferInsert;
