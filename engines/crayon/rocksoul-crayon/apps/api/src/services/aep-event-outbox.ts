import { sql, type DbConnection, type DatabaseContext } from '@rocksoul/orm';
import type { AepApplicationEvent } from './aep-events.js';

type SqlClient = DbConnection['client'];

export type AepOutboxRecord = {
  readonly id: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly resource: string;
  readonly recordId?: string;
  readonly principalId?: string;
  readonly payload: unknown;
  readonly createdAt: string;
  readonly attempts: number;
};

/** Durable outbox primitives. Callers must invoke enqueue in the mutation transaction. */
export async function enqueueAepEvent(
  client: SqlClient,
  event: AepApplicationEvent,
  principalId?: string,
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO aep_event_outbox (id, event_id, event_type, resource, record_id, principal_id, payload_json, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `outbox_${event.eventId}`,
      event.eventId,
      event.eventType,
      event.resource,
      event.recordId ?? null,
      principalId ?? null,
      JSON.stringify(event.payload),
      new Date(event.timestamp).toISOString(),
    ],
  });
}

/** Drizzle transaction variant used when the domain mutation and outbox row must commit together. */
export async function enqueueAepEventInTransaction(
  tx: DatabaseContext,
  event: AepApplicationEvent,
  principalId?: string,
): Promise<void> {
  const executor = tx as DatabaseContext & { run(query: ReturnType<typeof sql>): Promise<unknown> };
  await executor.run(sql`INSERT INTO aep_event_outbox
    (id, event_id, event_type, resource, record_id, principal_id, payload_json, created_at)
    VALUES (${`outbox_${event.eventId}`}, ${event.eventId}, ${event.eventType}, ${event.resource},
      ${event.recordId ?? null}, ${principalId ?? null}, ${JSON.stringify(event.payload)},
      ${new Date(event.timestamp).toISOString()})`);
}

export async function readPendingAepEvents(
  client: SqlClient,
  limit = 100,
): Promise<readonly AepOutboxRecord[]> {
  const boundedLimit = Math.max(1, Math.min(1_000, Math.floor(limit)));
  const result = await client.execute({
    sql: `SELECT id, event_id, event_type, resource, record_id, principal_id, payload_json, created_at, attempts
          FROM aep_event_outbox WHERE published_at IS NULL ORDER BY created_at, id LIMIT ?`,
    args: [boundedLimit],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    eventId: String(row.event_id),
    eventType: String(row.event_type),
    resource: String(row.resource),
    recordId: row.record_id == null ? undefined : String(row.record_id),
    principalId: row.principal_id == null ? undefined : String(row.principal_id),
    payload: JSON.parse(String(row.payload_json)),
    createdAt: String(row.created_at),
    attempts: Number(row.attempts ?? 0),
  }));
}

export async function claimAepOutboxBatch(client: SqlClient, workerId: string, limit = 100, leaseMs = 30_000): Promise<readonly AepOutboxRecord[]> {
  const boundedLimit = Math.max(1, Math.min(1_000, Math.floor(limit)));
  const leaseUntil = new Date(Date.now() - Math.max(1_000, Math.min(300_000, Math.floor(leaseMs)))).toISOString();
  await client.execute({
    sql: `UPDATE aep_event_outbox SET claim_token = ?, claimed_at = ? WHERE published_at IS NULL AND (claimed_at IS NULL OR claimed_at < ?) AND id IN (SELECT id FROM aep_event_outbox WHERE published_at IS NULL AND (claimed_at IS NULL OR claimed_at < ?) ORDER BY created_at, id LIMIT ?)`,
    args: [workerId, new Date().toISOString(), leaseUntil, leaseUntil, boundedLimit],
  });
  const result = await client.execute({
    sql: `SELECT id, event_id, event_type, resource, record_id, principal_id, payload_json, created_at, attempts FROM aep_event_outbox WHERE published_at IS NULL AND claim_token = ? ORDER BY created_at, id LIMIT ?`,
    args: [workerId, boundedLimit],
  });
  return result.rows.map((row) => ({
    id: String(row.id), eventId: String(row.event_id), eventType: String(row.event_type), resource: String(row.resource),
    recordId: row.record_id == null ? undefined : String(row.record_id), principalId: row.principal_id == null ? undefined : String(row.principal_id),
    payload: JSON.parse(String(row.payload_json)), createdAt: String(row.created_at), attempts: Number(row.attempts ?? 0),
  }));
}

export async function markAepEventPublished(client: SqlClient, id: string): Promise<void> {
  await client.execute({
    sql: `UPDATE aep_event_outbox SET published_at = ?, attempts = attempts + 1 WHERE id = ? AND published_at IS NULL`,
    args: [new Date().toISOString(), id],
  });
}

export async function markAepEventAttempted(client: SqlClient, id: string): Promise<void> {
  await client.execute({
    sql: `UPDATE aep_event_outbox SET attempts = attempts + 1 WHERE id = ? AND published_at IS NULL`,
    args: [id],
  });
}

export async function dispatchAepOutboxOnce(client: SqlClient, limit = 100, workerId = `aep-worker-${process.pid}`): Promise<number> {
  const pending = await claimAepOutboxBatch(client, workerId, limit);
  let dispatched = 0;
  for (const event of pending) {
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO aep_event_log (event_id, event_type, resource, record_id, principal_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [event.eventId, event.eventType, event.resource, event.recordId ?? null, event.principalId ?? null, JSON.stringify(event.payload), event.createdAt],
      });
      await markAepEventPublished(client, event.id);
      dispatched += 1;
    } catch {
      await markAepEventAttempted(client, event.id).catch(() => undefined);
    }
  }
  return dispatched;
}

export function startAepOutboxDispatcher(client: SqlClient, intervalMs = 500): () => void {
  const boundedInterval = Math.max(100, Math.min(60_000, Math.floor(intervalMs)));
  let cycles = 0;
  const timer = setInterval(() => {
    cycles += 1;
    void dispatchAepOutboxOnce(client).catch(() => undefined);
    if (cycles % 120 === 0) void pruneAepEventLog(client).catch(() => undefined);
  }, boundedInterval);
  timer.unref?.();
  void dispatchAepOutboxOnce(client).catch(() => undefined);
  return () => clearInterval(timer);
}

export async function pruneAepEventLog(client: SqlClient, maxAgeMs = 7 * 24 * 60 * 60 * 1_000, maxRows = 100_000): Promise<void> {
  const age = Math.max(60_000, Math.min(366 * 24 * 60 * 60 * 1_000, Math.floor(maxAgeMs)));
  const rows = Math.max(1_000, Math.min(1_000_000, Math.floor(maxRows)));
  await client.execute({
    sql: 'DELETE FROM aep_event_log WHERE created_at < ?',
    args: [new Date(Date.now() - age).toISOString()],
  });
  await client.execute({
    sql: 'DELETE FROM aep_event_log WHERE sequence <= (SELECT COALESCE(MAX(sequence), 0) - ? FROM aep_event_log)',
    args: [rows],
  });
}
