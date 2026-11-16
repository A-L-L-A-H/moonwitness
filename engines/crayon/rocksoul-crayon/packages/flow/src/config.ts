import { z } from 'zod';
const env = z.object({
  FLOW_HOST: z.string().default('0.0.0.0'), FLOW_PORT: z.coerce.number().int().positive().default(3003),
  FLOW_DATABASE_URL: z.string().default('file:./data/flow.db'), FLOW_INTERNAL_API_KEY: z.string().min(1).default('development-flow-internal-key'),
  FLOW_DEFAULT_TIMEOUT_MS: z.coerce.number().int().min(100).max(300_000).default(30_000), FLOW_MAX_NODES: z.coerce.number().int().min(1).max(1_000).default(100),
  FLOW_MAX_EDGES: z.coerce.number().int().min(0).max(2_000).default(200), FLOW_HTTP_ALLOWED_HOSTS: z.string().default(''),
  SCHEDULER_BASE_URL: z.string().default(''), SCHEDULER_API_KEY: z.string().default(''), FLOW_BASE_URL: z.string().default(''), ROCKSOUL_API_BASE_URL: z.string().default(''),
  WHATSAPP_BASE_URL: z.string().default(''), WHATSAPP_API_KEY: z.string().default(''), AI_BASE_URL: z.string().default(''),
}).parse(process.env);
export const config = { ...env, httpAllowedHosts: new Set(env.FLOW_HTTP_ALLOWED_HOSTS.split(',').map(v => v.trim()).filter(Boolean)) };
