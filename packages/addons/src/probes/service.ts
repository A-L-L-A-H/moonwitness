import {
  createActorContext,
  getDb,
  syncModels,
  SYSTEM_ACTOR,
  type ActorContext,
} from "@moonwitness/orm";
import { isBlockedRuntimeHost } from "@moonwitness/addon-runtime";
import { probeEventModel, probeNodeModel } from "./models.js";

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

export async function importLegacyProbes(): Promise<{ importedNodes: number }> {
  const db = getDb();
  let importedNodes = 0;
  try {
    const legacy = await db.get<{ name?: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'igate_nodes'",
    );
    if (!legacy?.name) return { importedNodes: 0 };

    const rows = await db.all<Record<string, unknown>>(
      "SELECT id, name, target_url, category, enabled FROM igate_nodes",
    );
    for (const row of rows) {
      const nodeKey = String(row.id);
      const existing = await probeNodeModel.repository.find({ node_key: nodeKey });
      if (existing.length > 0) continue;
      await probeNodeModel.repository.upsert(
        { node_key: nodeKey },
        {
          node_key: nodeKey,
          name: String(row.name),
          target_url: String(row.target_url),
          category: String(row.category),
          enabled: Boolean(row.enabled),
          metadata_json: null,
        },
        SYSTEM_ACTOR,
      );
      importedNodes += 1;
    }
  } catch {
    // Legacy table absent or Postgres without sqlite_master.
  }
  return { importedNodes };
}

export async function seedDefaultProbeNodes(): Promise<void> {
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
        SYSTEM_ACTOR,
      );
    }
  }
}

/** Ensures probe tables & seed nodes exist for standalone unit tests. */
export async function ensureProbesSchema(): Promise<void> {
  await syncModels([probeNodeModel, probeEventModel]);
  await importLegacyProbes();
  await seedDefaultProbeNodes();
}

export async function listProbeNodes(tenantId?: string): Promise<ProbeNode[]> {
  const rows = await probeNodeModel.repository.find(
    {},
    {
      orderBy: [{ field: "node_key", direction: "ASC" }],
      ...(tenantId ? { tenantId } : {}),
    },
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

export async function listRecentProbeEvents(limit = 25, tenantId?: string): Promise<ProbeEvent[]> {
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const rows = await probeEventModel.repository.find(
    {},
    {
      limit: boundedLimit,
      orderBy: [{ field: "checked_at", direction: "DESC" }],
      ...(tenantId ? { tenantId } : {}),
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
  actor?: ActorContext;
}): Promise<ProbeEvent> {
  const checkedAt = new Date().toISOString();
  const actor = params.actor ?? createActorContext(params.actorSub, "api");

  const created = await probeEventModel.repository.create(
    {
      node_key: params.nodeId,
      status_code: params.statusCode,
      ok: params.ok,
      latency_ms: params.latencyMs,
      actor_sub: actor.actorId ?? params.actorSub,
      checked_at: checkedAt,
      error_message: null,
    },
    actor,
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
  actorOrSub: ActorContext | string,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ProbeEvent> {
  const actor = typeof actorOrSub === "string" ? createActorContext(actorOrSub, "api") : actorOrSub;
  const actorSub = actor.actorId ?? "unknown";

  if (!validateProbeTargetUrl(node.targetUrl)) {
    return recordProbeEvent({
      nodeId: node.id,
      statusCode: 400,
      ok: false,
      latencyMs: 0,
      actorSub,
      actor,
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
    actor,
  });
}
