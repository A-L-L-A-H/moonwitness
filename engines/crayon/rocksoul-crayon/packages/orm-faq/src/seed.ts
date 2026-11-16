export interface FaqSeedContext {
  now?: string;
}

export const initialFaqCategoriesData = [
  { name: "General", slug: "general" },
  { name: "Account", slug: "account" },
  { name: "Billing", slug: "billing" },
  { name: "Technical", slug: "technical" },
  { name: "Privacy", slug: "privacy" },
  { name: "Security", slug: "security" },
  { name: "Support", slug: "support" },
];

export const initialFaqsData = [
  { id: 1, question: "What is ShadcnStore Admin?", answer: "ShadcnStore Admin is a comprehensive admin dashboard template built with React, TypeScript, and shadcn/ui components. It provides a complete solution for managing your business operations.", category: "general" },
  { id: 2, question: "How do I get started?", answer: "You can get started by signing up for an account, choosing a plan that fits your needs, and following our quick setup guide to configure your dashboard.", category: "general" },
  { id: 3, question: "Do you offer a free trial?", answer: "Yes, we offer a 14-day free trial for all new users. No credit card is required to start the trial, and you can explore all features during this period.", category: "general" },
  { id: 4, question: "What browsers are supported?", answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge.", category: "technical" },
  { id: 5, question: "How do I contact support?", answer: "You can contact our support team through the support page or by email.", category: "support" },
];

export async function seedFaq(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: FaqSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('❓ [orm-faq] Seeding FAQ Categories & FAQs...');

  let catIdx = 1;
  for (const cat of initialFaqCategoriesData) {
    const catId = `faq_cat_${cat.slug}`;
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO faq_categories (id, name, slug, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [catId, cat.name, cat.slug, catIdx++, now, now],
    });
  }

  for (const f of initialFaqsData) {
    const catId = `faq_cat_${f.category}`;
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO faqs (id, category_id, question, answer, is_published, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `,
      args: [String(f.id), catId, f.question, f.answer, f.id, now, now],
    });
  }
}
