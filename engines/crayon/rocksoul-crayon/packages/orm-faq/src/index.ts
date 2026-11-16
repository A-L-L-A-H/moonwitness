import { faqCategories } from './schema/categories.js';
import { faqs } from './schema/faqs.js';

export * from './schema/categories.js';
export * from './schema/faqs.js';
export * from './seed.js';


export const faqSchema = {
  faqCategories,
  faqs,
};
