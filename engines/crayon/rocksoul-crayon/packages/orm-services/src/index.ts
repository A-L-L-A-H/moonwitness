import { pricingPlans } from './schema/plans.js';
import { pricingFeatures } from './schema/features.js';

export * from './schema/plans.js';
export * from './schema/features.js';
export * from './seed.js';


export const servicesSchema = {
  pricingPlans,
  pricingFeatures,
};
