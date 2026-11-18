"use client";

import { requestApiResponse } from "@moonwitness/contracts/sdk";
import type { MissionAlert, Workflow } from "@moonwitness/types";

const API_BASE = "/api/v1";

export interface CommandCenterStats {
  workflows: number;
  running: number;
  queued: number;
  paused: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  alerts: number;
}

export interface CommandCenterFeedItem {
  time: string;
  tag: string;
  msg: string;
}

export interface CommandCenterSnapshot {
  workflows: Workflow[];
  alerts: MissionAlert[];
  feed?: CommandCenterFeedItem[];
}

export class CommandCenterApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommandCenterApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApiResponse(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `HTTP ${response.status}`;
    throw new CommandCenterApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function fetchCommandCenterState(signal?: AbortSignal): Promise<CommandCenterSnapshot> {
  return requestJson<CommandCenterSnapshot>("/command-center/state", {
    method: "GET",
    signal,
  });
}

export function fetchCommandCenterStats(signal?: AbortSignal): Promise<CommandCenterStats> {
  return requestJson<CommandCenterStats>("/command-center/stats", {
    method: "GET",
    signal,
  });
}

export async function createCommandCenterWorkflow(input: {
  name: string;
  detail: string;
  status?: Workflow["status"];
}): Promise<Workflow> {
  const result = await requestJson<{ workflow: Workflow }>("/command-center/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.workflow;
}

export async function toggleCommandCenterWorkflow(id: string): Promise<Workflow> {
  const result = await requestJson<{ workflow: Workflow }>(
    `/command-center/workflows/${encodeURIComponent(id)}/toggle`,
    { method: "PATCH" },
  );
  return result.workflow;
}

export async function transitionCommandCenterWorkflow(
  id: string,
  status: Workflow["status"],
): Promise<Workflow> {
  const result = await requestJson<{ workflow: Workflow }>(
    `/command-center/workflows/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
  return result.workflow;
}

export async function dismissCommandCenterAlert(
  id: string,
): Promise<{ dismissed: boolean; id: string }> {
  return requestJson<{ dismissed: boolean; id: string }>(
    `/command-center/alerts/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
