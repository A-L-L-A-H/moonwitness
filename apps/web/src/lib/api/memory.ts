"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api/v1/memory";

export interface MemorySystemInfo {
  mode: string;
  gemini_configured: boolean;
  gemini_model: string;
  embeddings_enabled: boolean;
  embedding_model: string;
  drive_configured: boolean;
  moonwitness_sync_configured: boolean;
  max_upload_gb: number;
}

export interface MemoryCounts {
  archives: number;
  messages: number;
  knowledge: number;
  active_jobs: number;
  failed_jobs: number;
}

export interface MemoryBridgeStatus {
  configured: boolean;
  reachable: boolean;
  system: MemorySystemInfo | null;
  counts: MemoryCounts | null;
  error?: string;
}

export interface MemoryKnowledgeRecord {
  id: string;
  archive_id?: string;
  conversation_id?: string;
  kind: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  entities: string[];
  source_message_ids: string[];
  confidence: number;
  created_at?: string;
  updated_at?: string;
}

export interface MemoryKnowledgeResponse {
  configured: boolean;
  query: string;
  records: MemoryKnowledgeRecord[];
}

async function requestMemoryJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const serverError =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: unknown }).error
        : null;
    const message =
      typeof serverError === "string" && serverError.length > 0
        ? serverError
        : `Request failed with HTTP ${response.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export function fetchMemoryStatus(signal?: AbortSignal): Promise<MemoryBridgeStatus> {
  return requestMemoryJson<MemoryBridgeStatus>(`${API_BASE}/status`, signal);
}

export function fetchMemoryKnowledge(options?: {
  q?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<MemoryKnowledgeResponse> {
  const params = new URLSearchParams();
  const q = options?.q?.trim();
  if (q) {
    params.set("q", q);
  }
  if (options?.limit !== undefined) {
    params.set("limit", String(Math.min(100, Math.max(1, Math.trunc(options.limit)))));
  }
  const suffix = params.toString();
  return requestMemoryJson<MemoryKnowledgeResponse>(
    `${API_BASE}/knowledge${suffix ? `?${suffix}` : ""}`,
    options?.signal,
  );
}

export function getMemoryExportUrl(): string {
  return `${API_BASE}/export.ndjson`;
}

export function formatMemoryContextPrompt(record: MemoryKnowledgeRecord): string {
  const lines = [`[Archive Knowledge: ${record.title} (${record.kind})]`];
  if (record.summary.trim()) {
    lines.push(`Summary: ${record.summary.trim()}`);
  }
  if (record.content.trim()) {
    lines.push(record.content.trim());
  }
  if (record.tags.length > 0) {
    lines.push(`Tags: ${record.tags.join(", ")}`);
  }
  return lines.join("\n");
}

export function useMemoryStatus(enabled = true) {
  return useQuery({
    queryKey: ["memory", "status"],
    queryFn: ({ signal }) => fetchMemoryStatus(signal),
    enabled,
    staleTime: 30_000,
    retry: 0,
  });
}

export function useMemoryKnowledge(query: string, enabled: boolean, limit = 12) {
  const normalizedQuery = query.trim();
  return useQuery({
    queryKey: ["memory", "knowledge", normalizedQuery, limit],
    queryFn: ({ signal }) => fetchMemoryKnowledge({ q: normalizedQuery, limit, signal }),
    enabled,
    staleTime: 15_000,
    retry: 0,
  });
}
