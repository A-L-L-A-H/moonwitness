import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestampColumns } from '@rocksoul/orm-base';

export const landingTestimonials = sqliteTable('landing_testimonials', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  image: text('image'),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull().default(5),
  company: text('company'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(true),
  ...timestampColumns(),
});

export type LandingTestimonial = typeof landingTestimonials.$inferSelect;
export type NewLandingTestimonial = typeof landingTestimonials.$inferInsert;
