export interface LandingSeedContext {
  now?: string;
}

export const initialTestimonialsData = [
  { id: 'test_1', name: 'Alexandra Mitchell', role: 'Senior Frontend Developer', quote: 'This platform has completely transformed our development workflow. The component system is so well-architected that even complex applications feel simple to build.', image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1' },
  { id: 'test_2', name: 'James Thompson', role: 'Technical Lead', quote: 'After trying countless frameworks, this is the one that finally clicked. The documentation is exceptional.', image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1' },
  { id: 'test_3', name: 'Priya Sharma', role: 'Product Designer', quote: 'The design system is beautiful and consistent. I can prototype ideas quickly and hand them off with confidence.', image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2' },
  { id: 'test_4', name: 'Robert Kim', role: 'Engineering Manager', quote: 'We migrated our entire application to this platform in just two weeks. The performance improvements were immediate.', image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2' },
];

export const initialFeaturesData = [
  { id: 'feat_1', title: 'Curated Component Library', description: 'Hand-picked blocks and templates for quality and reliability.', icon: 'Package', category: 'main', order: 1 },
  { id: 'feat_2', title: 'Free & Premium Options', description: 'Start free, upgrade to premium collections when you need more.', icon: 'Crown', category: 'main', order: 2 },
  { id: 'feat_3', title: 'Ready-to-Use Templates', description: 'Copy-paste components that just work out of the box.', icon: 'Layout', category: 'main', order: 3 },
  { id: 'feat_4', title: 'Multiple Frameworks', description: 'React, Next.js, and Vite compatibility for flexible development.', icon: 'BarChart3', category: 'secondary', order: 4 },
];

export async function seedLanding(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: LandingSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('🚀 [orm-landing] Seeding Landing Testimonials, Leads & Features...');

  for (const t of initialTestimonialsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO landing_testimonials (id, name, role, quote, image, rating, is_featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 5, 1, ?, ?)
      `,
      args: [t.id, t.name, t.role, t.quote, t.image, now, now],
    });
  }

  for (const lf of initialFeaturesData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO landing_features (id, title, description, icon, category, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [lf.id, lf.title, lf.description, lf.icon, lf.category, lf.order, now, now],
    });
  }

  await client.execute({
    sql: `
      INSERT OR REPLACE INTO landing_leads (id, first_name, last_name, email, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)
    `,
    args: ['lead_1', 'John', 'Doe', 'john.doe@enterprise.com', 'Enterprise Consultation', 'We want to inquire about on-premise licensing.', now, now],
  });
}
