import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDatabase } from './client.js';
import { ensureOperationalTables } from './operational-migrations.js';
import { resolve } from 'node:path';

export async function runMigrations(migrationsFolder?: string, databaseUrl?: string): Promise<void> {
  const folder = migrationsFolder || resolve(process.cwd(), 'drizzle');
  const { db, client } = createDatabase(databaseUrl);
  try {
    console.log(`Running migrations from ${folder}...`);
    await migrate(db, { migrationsFolder: folder });
    await ensureOperationalTables(client);
    console.log('Migrations applied successfully.');
  } finally {
    client.close();
  }
}

// Support running directly via `tsx src/migrate.ts`
if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
