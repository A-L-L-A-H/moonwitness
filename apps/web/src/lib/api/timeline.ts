"use client";

import { useQuery } from "@tanstack/react-query";
import type { TimelineEvent, Era, TimelineFilters, TimelineStats } from "@moonwitness/types";

const API_BASE = "/api/v1";
const MAX_TIMELINE_PAGE_SIZE = 100;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchTimelineEvents(
  filters: TimelineFilters = {},
  apiBase = API_BASE,
  signal?: AbortSignal,
): Promise<{ data: TimelineEvent[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.era) params.set("era", filters.era);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit !== undefined)
    params.set("limit", String(Math.min(Math.max(filters.limit, 1), MAX_TIMELINE_PAGE_SIZE)));
  if (filters.offset) params.set("offset", String(filters.offset));

  return fetchJson<{ data: TimelineEvent[]; total: number }>(
    `${apiBase}/timeline/events?${params}`,
    signal,
  );
}

export function useTimelineEvents(filters: TimelineFilters = {}) {
  const params = new URLSearchParams();
  if (filters.era) params.set("era", filters.era);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit !== undefined)
    params.set("limit", String(Math.min(Math.max(filters.limit, 1), MAX_TIMELINE_PAGE_SIZE)));
  if (filters.offset) params.set("offset", String(filters.offset));

  return useQuery({
    queryKey: ["timeline", "events", params.toString()],
    queryFn: ({ signal }) => fetchTimelineEvents(filters, API_BASE, signal),
    staleTime: 30_000,
  });
}

export async function fetchTimelineEvent(
  id: string,
  signal?: AbortSignal,
): Promise<{ data: TimelineEvent }> {
  return fetchJson<{ data: TimelineEvent }>(
    `${API_BASE}/timeline/events/${encodeURIComponent(id)}`,
    signal,
  );
}

export function useTimelineEvent(id: string | null) {
  return useQuery({
    queryKey: ["timeline", "event", id],
    queryFn: ({ signal }) => fetchTimelineEvent(id!, signal),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useTimelineRelatedEvents(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  return useQuery({
    queryKey: ["timeline", "related", uniqueIds],
    queryFn: ({ signal }) => fetchTimelineRelatedEvents(uniqueIds, signal),
    enabled: uniqueIds.length > 0,
    staleTime: 30_000,
  });
}

export async function fetchTimelineRelatedEvents(
  ids: string[],
  signal?: AbortSignal,
): Promise<TimelineEvent[]> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return [];
  const responses = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        return await fetchTimelineEvent(id, signal);
      } catch {
        return null;
      }
    }),
  );
  return responses.flatMap((response) => (response ? [response.data] : []));
}

export function useTimelineStats() {
  return useQuery({
    queryKey: ["timeline", "stats"],
    queryFn: ({ signal }) =>
      fetchJson<{ data: TimelineStats }>(`${API_BASE}/timeline/stats`, signal),
    staleTime: 60_000,
  });
}

export function useTimelineEras() {
  return useQuery({
    queryKey: ["timeline", "eras"],
    queryFn: ({ signal }) => fetchJson<{ data: Era[] }>(`${API_BASE}/timeline/eras`, signal),
    staleTime: 60_000,
  });
}
