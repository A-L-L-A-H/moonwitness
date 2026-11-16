export interface ProjectSeedContext {
  now?: string;
}

export const initialProjectsData = [
  { id: 'proj_alpha', name: 'Alpha SaaS Core', code: 'ALPHA', description: 'Next-gen enterprise software development', status: 'in_progress', ownerId: '1', budget: 250000 },
  { id: 'proj_core', name: 'Design System & UI Components', code: 'DESIGN', description: 'Comprehensive shadcn/ui custom design system', status: 'in_progress', ownerId: '2', budget: 120000 },
];

export async function seedProjects(
  client: { execute: (query: { sql: string; args?: any[] } | string) => Promise<any> },
  context?: ProjectSeedContext
): Promise<void> {
  const now = context?.now || new Date().toISOString();
  console.log('📁 [orm-project] Seeding Projects...');

  for (const p of initialProjectsData) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO projects (id, org_id, name, code, description, status, owner_id, budget, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [p.id, 'org_rocksoul_default', p.name, p.code, p.description, p.status, p.ownerId, p.budget, now, now],
    });
  }
}
