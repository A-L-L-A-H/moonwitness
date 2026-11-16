import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { validateOutboundUrl } from './security.js';
import { config } from './config.js';
import { WebhookDb } from './db.js';

/** One-way, idempotent import. It never deletes legacy rows. */
export function importLegacyWhatsAppWebhooks(target: WebhookDb, legacyUrl = config.WEBHOOKS_LEGACY_WHATSAPP_DATABASE_URL) {
  if (!legacyUrl) return { detected: 0, migrated: 0, skipped: 0 };
  const filename = legacyUrl.replace(/^file:/, '');
  const source = new Database(filename, { readonly: true });
  try {
    const exists = source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wa_webhooks'").get();
    if (!exists) return { detected: 0, migrated: 0, skipped: 0 };
    const rows = source.prepare('SELECT id,session_id,url,secret,events,is_active,created_at FROM wa_webhooks').all() as any[];
    let migrated = 0, skipped = 0;
    const transaction = target.db.transaction(() => {
      for (const row of rows) {
        let url: string;
        try { url = validateOutboundUrl(row.url, config.WEBHOOKS_ALLOW_HTTP, config.WEBHOOKS_ALLOW_PRIVATE_NETWORKS); } catch { skipped++; continue; }
        const duplicate = target.db.prepare('SELECT id FROM webhook_endpoints WHERE owner_type=? AND owner_id=? AND url=?').get('whatsapp-session', row.session_id, url) as { id: string } | undefined;
        const endpointId = duplicate?.id ?? `legacy-wa-${row.id}`;
        if (!duplicate) {
          target.db.prepare('INSERT INTO webhook_endpoints VALUES (?,?,?,?,?,?,?,?,?,?)').run(endpointId, 'whatsapp-session', row.session_id, `WhatsApp ${row.session_id}`, url, 'standard', row.secret ?? null, row.is_active ? 1 : 0, row.created_at || new Date().toISOString(), new Date().toISOString());
          migrated++;
        }
        let events: string[] = ['*']; try { events = JSON.parse(row.events || '["*"]'); } catch { skipped++; continue; }
        for (const event of events) {
          const pattern = event === 'message.received' || event === 'messages.upsert' ? 'whatsapp.message.received' : event;
          if (!(pattern === '*' || /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*(\.\*)?$/.test(pattern))) { skipped++; continue; }
          target.db.prepare('INSERT OR IGNORE INTO webhook_subscriptions VALUES (?,?,?,?,?,?)').run(randomUUID(), endpointId, pattern, row.is_active ? 1 : 0, new Date().toISOString(), new Date().toISOString());
        }
      }
    });
    transaction(); return { detected: rows.length, migrated, skipped };
  } finally { source.close(); }
}
