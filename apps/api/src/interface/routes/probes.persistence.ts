import { createActorContext, getDb, syncModels } from "@moonwitness/orm";
import { importLegacyProbes, probeEventModel, probeNodeModel } from "@moonwitness/addons/probes";
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

export async function ensureProbesSchema(): Promise<void> {
  await syncModels([probeNodeModel, probeEventModel]);
  await importLegacyProbes();
  const actor = createActorContext(null, "api");
  for (const node of DEFAULT_PROBE_NODES) {
    const existing = await probeNodeModel.repository.find({ node_key: node.id }, { limit: 1 });
    if (!existing[0]) {
      await probeNodeModel.repository.create(
        {
          node_key: node.id,
          name: node.name,
          target_url: node.targetUrl,
          category: node.category,
          enabled: true,
          metadata_json: null,
        },
        actor,
      );
    }
  }
}

export async function listProbeNodes(): Promise<ProbeNode[]> {
  await ensureProbesSchema();
  const rows = await probeNodeModel.repository.find(
    {},
    { orderBy: [{ field: "node_key", direction: "ASC" }] },
  );

  return rows.map((row) => ({
    id: row.node_key,
    name: row.name,
    targetUrl: row.target_url,
    category: row.category,
    enabled: row.enabled,
    createdAt:
      row.create_date instanceof Date ? row.create_date.toISOString() : String(row.create_date),
  }));
}

export async function listRecentProbeEvents(limit = 25): Promise<ProbeEvent[]> {
  await ensureProbesSchema();
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const rows = await probeEventModel.repository.find(
    {},
    {
      limit: boundedLimit,
      orderBy: [{ field: "checked_at", direction: "DESC" }],
    },
  );

  return rows.map((row) => ({
    id: row.id,
    nodeId: row.node_key,
    statusCode: row.status_code,
    ok: row.ok,
    latencyMs: row.latency_ms,
    actorSub: row.actor_sub ?? "system",
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
  const checkedAt = new Date().toISOString();
  const actor = createActorContext(params.actorSub, "api");

  const created = await probeEventModel.repository.create(
    {
      node_key: params.nodeId,
      status_code: params.statusCode,
      ok: params.ok,
      latency_ms: params.latencyMs,
      actor_sub: params.actorSub,
      checked_at: checkedAt,
      error_message: null,
    },
    actor,
  );

  // Retain up to 1000 recent events cleanly in SQLite and Postgres alike.
  await getDb().run(
    `DELETE FROM orm_probe_events
     WHERE id NOT IN (
       SELECT id FROM orm_probe_events ORDER BY checked_at DESC LIMIT 1000
     )`,
  );

  return {
    id: created.id,
    nodeId: created.node_key,
    statusCode: created.status_code,
    ok: created.ok,
    latencyMs: created.latency_ms,
    actorSub: created.actor_sub ?? params.actorSub,
    checkedAt: created.checked_at,
  };
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
