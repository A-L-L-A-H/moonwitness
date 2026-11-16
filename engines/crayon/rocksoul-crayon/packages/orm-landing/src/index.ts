import { landingTestimonials } from './schema/testimonials.js';
import { landingLeads } from './schema/leads.js';
import { landingFeatures } from './schema/features.js';

export * from './schema/testimonials.js';
export * from './schema/leads.js';
export * from './schema/features.js';
export * from './seed.js';


export const landingSchema = {
  landingTestimonials,
  landingLeads,
  landingFeatures,
};
