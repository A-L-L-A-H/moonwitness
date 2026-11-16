import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';
import { faqCategories } from './categories.js';

export const faqs = sqliteTable('faqs', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => faqCategories.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
  orderIndex: integer('order_index').notNull().default(0),
  ...timestampColumns(),
});

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
