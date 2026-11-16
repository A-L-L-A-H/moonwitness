export interface ServicesSeedContext {
  now?: string;
}

export const initialPricingPlansData = [
  { id: 'basic', name: 'Basic', description: 'Perfect for small online stores and solo developers', price: '$19', frequency: '/month', features: ['Up to 10 products', 'Basic inventory tracking', 'Email support', 'Mobile-responsive themes'], popular: false, current: true, order: 1 },
  { id: 'professional', name: 'Professional', description: 'Ideal for growing businesses needing team collaboration', price: '$79', frequency: '/month', features: ['Up to 100 products', 'Advanced analytics', 'Priority email & chat support', 'API access', 'Custom domain'], popular: true, current: false, order: 2 },
  { id: 'enterprise', name: 'Enterprise', description: 'For high-volume stores requiring maximum performance', price: '$199', frequency: '/month', features: ['Unlimited products', 'Advanced reporting', 'Dedicated account manager', '24/7 Phone support', 'Custom integrations'], popular: false, current: false, order: 3 },
];

export const initialPricingFeaturesData = [
  { id: 'pf_1', name: "Fast Performance", description: "Lightning-fast response times and optimized performance for all your business needs.", icon: "Rocket", order: 1 },
  { id: 'pf_2', name: "Enterprise Security", description: "Bank-level security with end-to-end encryption and advanced threat protection.", icon: "Shield", order: 2 },
  { id: 'pf_3', name: "Instant Setup", description: "Get up and running in minutes with our streamlined onboarding process.", icon: "Zap", order: 3 },
  { id: 'pf_4', name: "Team Collaboration", description: "Seamless collaboration tools to keep your team connected and productive.", icon: "Users", order: 4 },
  { id: 'pf_5', name: "24/7 Support", description: "Round-the-clock expert support whenever you need help or have questions.", icon: "Headphones", order: 5 },
  { id: 'pf_6', name: "Real-time Analytics", description: "Monitor your business performance with real-time insights and detailed analytics.", icon: "Clock", order: 6 },
];

export async function seedServices(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: ServicesSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('💳 [orm-services] Seeding Pricing Plans & Features...');

  for (const p of initialPricingPlansData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO pricing_plans (id, name, description, price, frequency, features, popular, current, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [p.id, p.name, p.description, p.price, p.frequency, JSON.stringify(p.features), p.popular ? 1 : 0, p.current ? 1 : 0, p.order, now, now],
    });
  }

  for (const pf of initialPricingFeaturesData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO pricing_features (id, name, description, icon, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [pf.id, pf.name, pf.description, pf.icon, pf.order, now, now],
    });
  }
}
