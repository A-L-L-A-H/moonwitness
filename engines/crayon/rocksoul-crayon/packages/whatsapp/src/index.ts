import { WhatsAppClient } from './client.js';
import type { WhatsAppClientOptions } from './types.js';

export * from './types.js';
export * from './utils.js';
export * from './client.js';
export * from './manager.js';
export * from './db.js';
export * from './auth.js';
export * from './fastify-plugin.js';
export * from './server.js';

/**
 * Factory helper to instantiate a single WhatsAppClient.
 */
export function createWhatsAppClient(options?: WhatsAppClientOptions): WhatsAppClient {
  return new WhatsAppClient(options);
}
