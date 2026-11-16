import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'sqlite', schema: './src/schema.ts', out: './migrations', dbCredentials: { url: process.env.SCHEDULER_DATABASE_URL?.replace(/^file:/, '') || './data/scheduler.db' } });
