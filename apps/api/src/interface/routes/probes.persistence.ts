import { randomUUID } from "node:crypto";
import { applyMigrations, createActorContext, getDb, type Migration } from "@moonwitness/orm";
import { probeNodeModel, probeEventModel } from "../../infrastructure/persistence/domain/probes";
import { tryRecordAuditLog } from "../../infrastructure/audit/audit-log";
import { isBlockedRuntimeHost } from "../../shared/env";

export interface ProbeNode {
  id: string;
  name: string;
  targetUrl: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}

export interface ProbeEvent {
  id: string;
  nodeId: string;
  statusCode: number;
  ok: boolean;
  latencyMs: number;
  actorSub: string;
  checkedAt: string;
}

export const DEFAULT_PROBE_NODES = [
  {
    id: "id-provider",
    name: "MoonWitness ID",
    targetUrl: "https://id.moonwitness.biz.id/health",
    category: "identity",
  },
  {
    id: "core-api",
    name: "MoonWitness API",
    targetUrl: "https://api.moonwitness.biz.id/health",
    category: "api",
  },
  {
    id: "web-console",
    name: "Shadow Console",
    targetUrl: "https://moonwitness.biz.id/shadow",
    category: "console",
  },
  {
    id: "allah-sanctuary",
    name: "A-L-L-A-H Sanctuary",
    targetUrl: "https://a-l-l-a-h.com/",
    category: "sanctuary",
  },
  {
    id: "codex-edge",
    name: "Sovereign Codex Edge",
    targetUrl: "https://codex.a-l-l-a-h.com/api/codex",
    category: "governance",
  },
] as const;

export const probesMigrations: Migration[] = [
  {
    id: "001_create_igate_probes_tables",
    up: `
      CREATE TABLE IF NOT EXISTS igate_nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS igate_probe_events (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        ok INTEGER NOT NULL,
        latency_ms INTEGER NOT NULL,
        actor_sub TEXT NOT NULL,
        checked_at TEXT NOT NULL,
        FOREIGN KEY (node_id) REFERENCES igate_nodes(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_igate_probe_events_node_id ON igate_probe_events(node_id);
      CREATE INDEX IF NOT EXISTS idx_igate_probe_events_checked_at ON igate_probe_events(checked_at);
    `,
  },
];

export async function ensureProbesSchema(): Promise<void> {
  await applyMigrations(probesMigrations);
  const now = new Date().toISOString();
  const db = getDb();
  for (const node of DEFAULT_PROBE_NODES) {
    await db.run(
      `INSERT OR IGNORE INTO igate_nodes (id, name, target_url, category, enabled, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [node.id, node.name, node.targetUrl, node.category, now],
    );
    const actor = createActorContext(null, "api");
    try {
      const existing = await probeNodeModel.repository.find({
        node_key: node.id,
      } as any);
      const payload = {
        node_key: node.id,
        name: node.name,
        target_url: node.targetUrl,
        category: node.category,
        enabled: true,
        metadata_json: null,
      } as any;
      if (!existing[0]) {
        await probeNodeModel.repository.create(payload, actor);
      }
    } catch {
      // mirror best-effort
    }
  }
}

export async function listProbeNodes(): Promise<ProbeNode[]> {
  await ensureProbesSchema();
  const rows = await getDb().all<{
    id: string;
    name: string;
    target_url: string;
    category: string;
    enabled: number;
    created_at: string;
  }>(
    `SELECT id, name, target_url, category, enabled, created_at
     FROM igate_nodes
     ORDER BY id ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    targetUrl: row.target_url,
    category: row.category,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  }));
}

export async function listRecentProbeEvents(limit = 25): Promise<ProbeEvent[]> {
  await ensureProbesSchema();
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const rows = await getDb().all<{
    id: string;
    node_id: string;
    status_code: number;
    ok: number;
    latency_ms: number;
    actor_sub: string;
    checked_at: string;
  }>(
    `SELECT id, node_id, status_code, ok, latency_ms, actor_sub, checked_at
     FROM igate_probe_events
     ORDER BY checked_at DESC
     LIMIT ?`,
    [boundedLimit],
  );

  return rows.map((row) => ({
    id: row.id,
    nodeId: row.node_id,
    statusCode: row.status_code,
    ok: row.ok === 1,
    latencyMs: row.latency_ms,
    actorSub: row.actor_sub,
    checkedAt: row.checked_at,
  }));
}

export function validateProbeTargetUrl(rawUrl: string): boolean {
  try {
    const target = new URL(rawUrl);
    if (target.protocol !== "https:" && target.protocol !== "http:") return false;
    const loopback =
      target.hostname === "localhost" ||
      target.hostname === "127.0.0.1" ||
      target.hostname === "[::1]";
    if (isBlockedRuntimeHost(target.hostname) && !loopback) return false;
    return true;
  } catch {
    return false;
  }
}

export async function recordProbeEvent(params: {
  nodeId: string;
  statusCode: number;
  ok: boolean;
  latencyMs: number;
  actorSub: string;
}): Promise<ProbeEvent> {
  await ensureProbesSchema();
  const record: ProbeEvent = {
    id: randomUUID(),
    nodeId: params.nodeId,
    statusCode: params.statusCode,
    ok: params.ok,
    latencyMs: params.latencyMs,
    actorSub: params.actorSub,
    checkedAt: new Date().toISOString(),
  };

  const db = getDb();
  await db.run(
    `INSERT INTO igate_probe_events
     (id, node_id, status_code, ok, latency_ms, actor_sub, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.nodeId,
      record.statusCode,
      record.ok ? 1 : 0,
      record.latencyMs,
      record.actorSub,
      record.checkedAt,
    ],
  );

  // Retain up to 1000 events (bounded audit retention)
  await db.run(
    `DELETE FROM igate_probe_events
     WHERE id NOT IN (
       SELECT id FROM igate_probe_events ORDER BY checked_at DESC LIMIT 1000
     )`,
  );

  // Best-effort mirror to ORM + audit
  const actor = createActorContext(params.actorSub, "api");
  try {
    await probeEventModel.repository.create(
      {
        node_key: record.nodeId,
        status_code: record.statusCode,
        ok: record.ok,
        latency_ms: record.latencyMs,
        actor_sub: record.actorSub,
        checked_at: record.checkedAt,
        error_message: null,
      } as any,
      actor,
    );
    await tryRecordAuditLog({
      domain: "probes",
      entity: "probe_event",
      entityId: record.id,
      action: "EXECUTE",
      actor,
      actorRole: null,
      correlationId: actor.requestId ?? null,
      requestPath: null,
      outcome: record.ok ? "success" : "failure",
      before: null,
      after: { nodeId: record.nodeId, statusCode: record.statusCode, ok: record.ok },
      metadata: null,
      occurredAt: record.checkedAt,
    });
  } catch {
    // mirror best-effort
  }

  return record;
}

export async function executeProbeForNode(
  node: ProbeNode,
  actorSub: string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ProbeEvent> {
  if (!validateProbeTargetUrl(node.targetUrl)) {
    return recordProbeEvent({
      nodeId: node.id,
      statusCode: 400,
      ok: false,
      latencyMs: 0,
      actorSub,
    });
  }

  const startedAt = Date.now();
  let statusCode: number;
  let probeOk: boolean;

  try {
    const response = await fetchFn(node.targetUrl, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    statusCode = response.status;
    probeOk = response.ok;
  } catch {
    statusCode = 0;
    probeOk = false;
  }

  const latencyMs = Math.max(0, Date.now() - startedAt);
  return recordProbeEvent({
    nodeId: node.id,
    statusCode,
    ok: probeOk,
    latencyMs,
    actorSub,
  });
}
