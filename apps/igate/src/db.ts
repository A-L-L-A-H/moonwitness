import type { D1DatabaseLike, IgateNodeRecord, IgateProbeEventRecord } from "./types";

const INITIALIZED_DBS = new WeakMap<D1DatabaseLike, Promise<void>>();

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS igate_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    category TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS igate_probe_events (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    ok INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    actor_sub TEXT NOT NULL,
    checked_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_igate_probe_checked ON igate_probe_events (checked_at)`,
];

const DEFAULT_EDGE_NODES = [
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

/** Initialize IGate D1 tables and canonical edge probe targets once per binding. */
export async function ensureIgateSchema(db: D1DatabaseLike): Promise<void> {
  const existing = INITIALIZED_DBS.get(db);
  if (existing) return existing;

  const initPromise = (async () => {
    const nowIso = new Date().toISOString();
    const statements = [
      ...SCHEMA_STATEMENTS.map((sql) => db.prepare(sql)),
      ...DEFAULT_EDGE_NODES.map((node) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO igate_nodes
             (id, name, target_url, category, enabled, created_at)
             VALUES (?, ?, ?, ?, 1, ?)`,
          )
          .bind(node.id, node.name, node.targetUrl, node.category, nowIso),
      ),
    ];

    if (typeof db.batch === "function") {
      await db.batch(statements);
    } else {
      for (const stmt of statements) {
        await stmt.run();
      }
    }
  })();

  INITIALIZED_DBS.set(db, initPromise);
  return initPromise;
}

/** Verify D1 database connectivity using an active query. */
export async function checkIgateDatabaseReady(db: D1DatabaseLike | undefined): Promise<boolean> {
  if (!db) return false;
  try {
    await db.prepare("SELECT 1 AS ok").first<{ ok?: number }>();
    return true;
  } catch {
    return false;
  }
}

/** List configured IGate edge nodes ordered by id. */
export async function listIgateNodes(db: D1DatabaseLike): Promise<IgateNodeRecord[]> {
  await ensureIgateSchema(db);
  const rows = await db
    .prepare(
      `SELECT id, name, target_url, category, enabled, created_at
       FROM igate_nodes
       ORDER BY id ASC`,
    )
    .all<{
      id: string;
      name: string;
      target_url: string;
      category: string;
      enabled: number;
      created_at: string;
    }>();

  return rows.results.map((row) => ({
    id: row.id,
    name: row.name,
    targetUrl: row.target_url,
    category: row.category,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  }));
}

/** Persist a live edge HTTP probe outcome into D1 audit telemetry. */
export async function recordProbeEvent(
  db: D1DatabaseLike,
  params: {
    readonly nodeId: string;
    readonly statusCode: number;
    readonly ok: boolean;
    readonly latencyMs: number;
    readonly actorSub: string;
  },
): Promise<IgateProbeEventRecord> {
  await ensureIgateSchema(db);
  const record: IgateProbeEventRecord = {
    id: crypto.randomUUID(),
    nodeId: params.nodeId,
    statusCode: params.statusCode,
    ok: params.ok,
    latencyMs: params.latencyMs,
    actorSub: params.actorSub,
    checkedAt: new Date().toISOString(),
  };

  await db
    .prepare(
      `INSERT INTO igate_probe_events
       (id, node_id, status_code, ok, latency_ms, actor_sub, checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.nodeId,
      record.statusCode,
      record.ok ? 1 : 0,
      record.latencyMs,
      record.actorSub,
      record.checkedAt,
    )
    .run();

  return record;
}

/** List most recent edge probe results recorded in D1. */
export async function listRecentProbeEvents(
  db: D1DatabaseLike,
  limit = 25,
): Promise<IgateProbeEventRecord[]> {
  await ensureIgateSchema(db);
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const rows = await db
    .prepare(
      `SELECT id, node_id, status_code, ok, latency_ms, actor_sub, checked_at
       FROM igate_probe_events
       ORDER BY checked_at DESC
       LIMIT ?`,
    )
    .bind(boundedLimit)
    .all<{
      id: string;
      node_id: string;
      status_code: number;
      ok: number;
      latency_ms: number;
      actor_sub: string;
      checked_at: string;
    }>();

  return rows.results.map((row) => ({
    id: row.id,
    nodeId: row.node_id,
    statusCode: row.status_code,
    ok: row.ok === 1,
    latencyMs: row.latency_ms,
    actorSub: row.actor_sub,
    checkedAt: row.checked_at,
  }));
}
