import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createActorContext, syncModels } from "@moonwitness/orm";
import {
  alertModel,
  importLegacyCommandCenter,
  workflowModel,
} from "@moonwitness/addons/command-center";
import { listAuditLogs } from "@moonwitness/addons/audit";

export interface CommandCenterFeedItem {
  time: string;
  tag: string;
  msg: string;
}

export const workflowStatusSchema = z.enum([
  "Queued",
  "Running",
  "Paused",
  "Succeeded",
  "Failed",
  "Cancelled",
]);
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;

/** Legal state transitions for a workflow. Absent pairs are rejected. */
export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  Queued: ["Running", "Cancelled"],
  Running: ["Paused", "Succeeded", "Failed", "Cancelled"],
  Paused: ["Running", "Cancelled"],
  Succeeded: [],
  Failed: [],
  Cancelled: [],
};

export function canTransitionWorkflow(current: WorkflowStatus, next: WorkflowStatus): boolean {
  return WORKFLOW_TRANSITIONS[current]?.includes(next) ?? false;
}

export const alertLevelSchema = z.enum(["high", "medium", "low"]);
export type AlertLevel = z.infer<typeof alertLevelSchema>;

export interface PersistedWorkflow {
  id: string;
  name: string;
  detail: string;
  status: WorkflowStatus;
}

export interface PersistedAlert {
  id: string;
  text: string;
  ago: string;
  level: AlertLevel;
}

export const createWorkflowInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  detail: z.string().trim().min(1).max(280),
  status: workflowStatusSchema.optional().default("Queued"),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowInputSchema>;

export const commandCenterIdParamSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

const INITIAL_WORKFLOWS: readonly PersistedWorkflow[] = [
  {
    id: "wf-1",
    name: "Content Analysis Agent",
    detail: "Scanning new sources…",
    status: "Running",
  },
  {
    id: "wf-2",
    name: "Poster Generation Batch",
    detail: "Creating visuals (12/15)…",
    status: "Running",
  },
  {
    id: "wf-3",
    name: "Fact Check Pipeline",
    detail: "Verifying 8 items…",
    status: "Running",
  },
  {
    id: "wf-4",
    name: "Cross-Post Scheduler",
    detail: "Preparing tomorrow's posts…",
    status: "Queued",
  },
  {
    id: "wf-5",
    name: "Research Signal Watcher",
    detail: "Monitoring global feeds…",
    status: "Running",
  },
];

const INITIAL_ALERTS: readonly PersistedAlert[] = [
  { id: "a-1", text: "High volume of signals from MENA region", ago: "12m ago", level: "high" },
  { id: "a-2", text: "Source verification needed for 3 items", ago: "1h ago", level: "medium" },
  { id: "a-3", text: "Publishing queue delayed (2 items)", ago: "3h ago", level: "low" },
];

export async function ensureCommandCenterSchema(): Promise<void> {
  await syncModels([workflowModel, alertModel]);
  await importLegacyCommandCenter();
}

async function seedActorDefaultsIfEmpty(actorId: string): Promise<void> {
  await ensureCommandCenterSchema();
  const actor = createActorContext(actorId, "api");
  const existingWf = await workflowModel.repository.find({ actor_id: actorId }, { limit: 1 });
  if (existingWf.length === 0) {
    for (let i = 0; i < INITIAL_WORKFLOWS.length; i += 1) {
      const wf = INITIAL_WORKFLOWS[i]!;
      await workflowModel.repository.upsert(
        { actor_id: actorId, workflow_key: wf.id },
        {
          workflow_key: wf.id,
          actor_id: actorId,
          name: wf.name,
          detail: wf.detail,
          workflow_status: wf.status,
          sort_order: i,
          metadata_json: null,
        },
        actor,
      );
    }
  }

  const existingAlerts = await alertModel.repository.find({ actor_id: actorId }, { limit: 1 });
  if (existingAlerts.length === 0) {
    for (const alert of INITIAL_ALERTS) {
      await alertModel.repository.upsert(
        { actor_id: actorId, alert_key: alert.id },
        {
          alert_key: alert.id,
          actor_id: actorId,
          text: alert.text,
          ago_label: alert.ago,
          level: alert.level,
          dismissed: false,
          dismissed_at: null,
        },
        actor,
      );
    }
  }
}

export async function getCommandCenterState(actorId: string): Promise<{
  workflows: PersistedWorkflow[];
  alerts: PersistedAlert[];
  feed: CommandCenterFeedItem[];
}> {
  await seedActorDefaultsIfEmpty(actorId);
  const wfRows = await workflowModel.repository.find(
    { actor_id: actorId },
    { orderBy: [{ field: "sort_order", direction: "ASC" }] },
  );

  const alertRows = await alertModel.repository.find({
    actor_id: actorId,
    dismissed: false,
  });

  const feed: CommandCenterFeedItem[] = [];
  try {
    const recentLogs = await listAuditLogs({ limit: 8 });
    for (const log of recentLogs) {
      const parsedTime = Date.parse(log.occurredAt);
      const time = Number.isFinite(parsedTime)
        ? `${new Date(parsedTime).toISOString().slice(11, 16)}Z`
        : "UTC";
      feed.push({
        time,
        tag: log.domain.toUpperCase(),
        msg: `${log.action} ${log.entity} · ${log.entityId}`,
      });
    }
  } catch {
    // ops_audit_logs may not be migrated in isolated unit test suites
  }
  if (feed.length === 0) {
    feed.push({
      time: `${new Date().toISOString().slice(11, 16)}Z`,
      tag: "SYSTEM",
      msg: "Command Center online — telemetry nominal",
    });
  }

  return {
    workflows: wfRows.map((row) => ({
      id: row.workflow_key,
      name: row.name,
      detail: row.detail,
      status: workflowStatusSchema.parse(row.workflow_status),
    })),
    alerts: alertRows.map((row) => ({
      id: row.alert_key,
      text: row.text,
      ago: row.ago_label ?? "just now",
      level: alertLevelSchema.parse(row.level),
    })),
    feed,
  };
}

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

export async function getCommandCenterStats(actorId: string): Promise<CommandCenterStats> {
  await seedActorDefaultsIfEmpty(actorId);
  const [workflows, activeAlerts] = await Promise.all([
    workflowModel.repository.find({ actor_id: actorId }),
    alertModel.repository.find({ actor_id: actorId, dismissed: false }),
  ]);
  const counts: Record<WorkflowStatus, number> = {
    Queued: 0,
    Running: 0,
    Paused: 0,
    Succeeded: 0,
    Failed: 0,
    Cancelled: 0,
  };
  for (const row of workflows) {
    const status = workflowStatusSchema.safeParse(row.workflow_status);
    if (status.success) counts[status.data] += 1;
  }
  return {
    workflows: workflows.length,
    running: counts.Running,
    queued: counts.Queued,
    paused: counts.Paused,
    succeeded: counts.Succeeded,
    failed: counts.Failed,
    cancelled: counts.Cancelled,
    alerts: activeAlerts.length,
  };
}

export async function createCommandCenterWorkflow(
  actorId: string,
  input: CreateWorkflowInput,
): Promise<PersistedWorkflow> {
  await seedActorDefaultsIfEmpty(actorId);
  const parsed = createWorkflowInputSchema.parse(input);
  const id = `wf-${randomUUID()}`;

  const existing = await workflowModel.repository.find(
    { actor_id: actorId },
    { orderBy: [{ field: "sort_order", direction: "ASC" }], limit: 1 },
  );
  const minSort = existing[0]?.sort_order ?? 0;
  const nextSort = Math.min(0, minSort) - 1;

  const actor = createActorContext(actorId, "api");
  await workflowModel.repository.create(
    {
      workflow_key: id,
      actor_id: actorId,
      name: parsed.name,
      detail: parsed.detail,
      workflow_status: parsed.status,
      sort_order: nextSort,
      metadata_json: null,
    },
    actor,
  );

  return {
    id,
    name: parsed.name,
    detail: parsed.detail,
    status: parsed.status,
  };
}

export async function transitionCommandCenterWorkflow(
  actorId: string,
  workflowId: string,
  nextStatus: WorkflowStatus,
): Promise<PersistedWorkflow | null> {
  await seedActorDefaultsIfEmpty(actorId);
  const matches = await workflowModel.repository.find({
    actor_id: actorId,
    workflow_key: workflowId,
  });
  const row = matches[0];
  if (!row) return null;

  const current = workflowStatusSchema.parse(row.workflow_status);
  if (!canTransitionWorkflow(current, nextStatus)) {
    const error = new Error(
      `Cannot transition workflow from ${current} to ${nextStatus}`,
    ) as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const actor = createActorContext(actorId, "api");
  await workflowModel.repository.update(row.id, { workflow_status: nextStatus }, actor);

  return {
    id: row.workflow_key,
    name: row.name,
    detail: row.detail,
    status: nextStatus,
  };
}

export async function toggleCommandCenterWorkflow(
  actorId: string,
  workflowId: string,
): Promise<PersistedWorkflow | null> {
  await seedActorDefaultsIfEmpty(actorId);
  const matches = await workflowModel.repository.find({
    actor_id: actorId,
    workflow_key: workflowId,
  });
  const row = matches[0];
  if (!row) return null;

  const current = workflowStatusSchema.parse(row.workflow_status);
  const nextStatus: WorkflowStatus =
    current === "Queued"
      ? "Running"
      : current === "Paused"
        ? "Running"
        : current === "Running"
          ? "Paused"
          : current;
  if (nextStatus === current) {
    const error = new Error(`Cannot toggle workflow in terminal state ${current}`) as Error & {
      statusCode?: number;
    };
    error.statusCode = 409;
    throw error;
  }
  return transitionCommandCenterWorkflow(actorId, workflowId, nextStatus);
}

export async function dismissCommandCenterAlert(
  actorId: string,
  alertId: string,
): Promise<boolean> {
  await seedActorDefaultsIfEmpty(actorId);
  const matches = await alertModel.repository.find({
    actor_id: actorId,
    alert_key: alertId,
    dismissed: false,
  });
  const existing = matches[0];
  if (!existing) return false;

  const now = new Date().toISOString();
  const actor = createActorContext(actorId, "api");
  await alertModel.repository.update(existing.id, { dismissed: true, dismissed_at: now }, actor);
  return true;
}
