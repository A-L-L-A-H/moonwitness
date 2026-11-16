import { z } from 'zod';
const env = z.object({
  WEBHOOKS_HOST: z.string().default('0.0.0.0'), WEBHOOKS_PORT: z.coerce.number().int().positive().default(3004),
  WEBHOOKS_DATABASE_URL: z.string().default('file:./data/webhook.db'), WEBHOOKS_INTERNAL_API_KEY: z.string().min(1).default('development-webhooks-internal-key'),
  WEBHOOKS_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(6), WEBHOOKS_DELIVERY_TIMEOUT_MS: z.coerce.number().int().min(100).max(300_000).default(10_000),
  WEBHOOKS_MAX_PAYLOAD_BYTES: z.coerce.number().int().min(1024).max(10_485_760).default(1_048_576), WEBHOOKS_ALLOW_HTTP: z.coerce.boolean().default(false), WEBHOOKS_ALLOW_PRIVATE_NETWORKS: z.coerce.boolean().default(false),
  FLOW_BASE_URL: z.string().default(''), FLOW_INTERNAL_API_KEY: z.string().default(''),
  WEBHOOKS_LEGACY_WHATSAPP_DATABASE_URL: z.string().default(''),
}).parse(process.env);
export const config = env;
