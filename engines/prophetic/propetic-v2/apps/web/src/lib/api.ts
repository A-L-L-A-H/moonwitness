export type JsonObject = Record<string, unknown>;

export interface ProphetListItem {
  id: string;
  display_name: string;
  quranic_name: string;
  rid_root: string;
}

export interface ApiHealth {
  ok: boolean;
  version: string;
  database: string;
  prophetCount: number;
  dbSchemaVersion?: string;
  dataSchemaVersion?: string;
  seedFingerprint?: string;
  schemaFingerprint?: string;
}

export interface ProvenanceRef {
  source_id: string;
  ref: string;
  evidence: string;
}

export interface ProvenanceClaim {
  id: string;
  prophet_id?: string;
  category: string;
  statement: string;
  confidence: number;
  refs: ProvenanceRef[];
}

export interface GenealogyRelation {
  id: string;
  from: string;
  to: string;
  kind: string;
  confidence: string;
  refs: string[];
}

export interface EventNode {
  id: string;
  prophet_id: string;
  slot: string;
  summary: string;
  refs: string[];
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ApiError(response.status, `${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: (signal?: AbortSignal) => get<ApiHealth>("/api/v2/health", signal),
  prophets: (signal?: AbortSignal) => get<ProphetListItem[]>("/api/v2/prophets", signal),
  prophet: (id: string, signal?: AbortSignal) => get<JsonObject>(`/api/v2/prophets/${encodeURIComponent(id)}`, signal),
  leaderboards: (signal?: AbortSignal) => get<JsonObject>("/api/v2/leaderboards", signal),
  corpus: (signal?: AbortSignal) => get<JsonObject>("/api/v2/corpus", signal),
  docs: (signal?: AbortSignal) => get<JsonObject>("/api/v2/docs", signal),
  provenance: (signal?: AbortSignal) => get<JsonObject>("/api/v2/provenance", signal),
  timeline: (signal?: AbortSignal) => get<JsonObject>("/api/v2/timeline", signal),
  events: (signal?: AbortSignal) => get<JsonObject>("/api/v2/events", signal),
  genealogy: (signal?: AbortSignal) => get<JsonObject>("/api/v2/genealogy", signal),
  uncertainty: (signal?: AbortSignal) => get<JsonObject>("/api/v2/uncertainty", signal),
  validation: (signal?: AbortSignal) => get<JsonObject>("/api/v2/validation", signal),
  prophetProvenance: (id: string, signal?: AbortSignal) => get<{ claims: ProvenanceClaim[] }>(`/api/v2/prophets/${encodeURIComponent(id)}/provenance`, signal),
  prophetEvents: (id: string, signal?: AbortSignal) => get<{ events: EventNode[] }>(`/api/v2/prophets/${encodeURIComponent(id)}/events`, signal),
  prophetRelations: (id: string, signal?: AbortSignal) => get<{ relations: GenealogyRelation[] }>(`/api/v2/prophets/${encodeURIComponent(id)}/relations`, signal),
  prophetTimeline: (id: string, signal?: AbortSignal) => get<JsonObject>(`/api/v2/prophets/${encodeURIComponent(id)}/timeline`, signal),
};
