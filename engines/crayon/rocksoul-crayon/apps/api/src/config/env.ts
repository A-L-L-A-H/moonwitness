import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().default('file:./data/sqlite.db'),
  DASHBOARD_PASSWORD: z.string().default('Youknowm@2026'),
  ROCKSOUL_ASSETS_BASE_URL: z.string().default('https://raw.githubusercontent.com/bjo163/rocksoul-assets/main'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('âŒ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
