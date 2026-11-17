import { randomUUID } from "node:crypto";
import { z } from "zod";
import { applyMigrations, createActorContext, getDb, type Migration } from "@moonwitness/orm";
import { workflowModel, alertModel } from "../../infrastructure/persistence/domain/command-control";
import { tryRecordAuditLog } from "../../infrastructure/audit/audit-log";

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

export const commandCenterMigrations: Migration[] = [
  {
    id: "cc_001_create_command_center_workflows",
    up: `
      CREATE TABLE IF NOT EXISTS command_center_workflows (
        id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        name TEXT NOT NULL,
        detail TEXT NOT NULL,
        workflow_status TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (actor_id, id)
      )
    `,
  },
  {
    id: "cc_002_create_command_center_alerts",
    up: `
      CREATE TABLE IF NOT EXISTS command_center_alerts (
        id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        text TEXT NOT NULL,
        ago TEXT NOT NULL,
        level TEXT NOT NULL,
        dismissed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        dismissed_at TEXT,
        PRIMARY KEY (actor_id, id)
      )
    `,
  },
];

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
  await applyMigrations(commandCenterMigrations);
}

async function seedActorDefaultsIfEmpty(actorId: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    const wfCount = await tx.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM command_center_workflows WHERE actor_id = ?",
      [actorId],
    );
    if ((wfCount?.count ?? 0) === 0) {
      for (let i = 0; i < INITIAL_WORKFLOWS.length; i += 1) {
        const wf = INITIAL_WORKFLOWS[i]!;
        await tx.run(
          `INSERT OR IGNORE INTO command_center_workflows (
             id, actor_id, name, detail, workflow_status, sort_order, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [wf.id, actorId, wf.name, wf.detail, wf.status, i, now, now],
        );
      }
    }

    const alertCount = await tx.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM command_center_alerts WHERE actor_id = ?",
      [actorId],
    );
    if ((alertCount?.count ?? 0) === 0) {
      for (const alert of INITIAL_ALERTS) {
        await tx.run(
          `INSERT OR IGNORE INTO command_center_alerts (
             id, actor_id, text, ago, level, dismissed, created_at, dismissed_at
           ) VALUES (?, ?, ?, ?, ?, 0, ?, NULL)`,
          [alert.id, actorId, alert.text, alert.ago, alert.level, now],
        );
      }
    }
  });
}

function mapWorkflow(row: Record<string, unknown>): PersistedWorkflow {
  return {
    id: String(row.id),
    name: String(row.name),
    detail: String(row.detail),
    status: workflowStatusSchema.parse(String(row.workflow_status)),
  };
}

function mapAlert(row: Record<string, unknown>): PersistedAlert {
  return {
    id: String(row.id),
    text: String(row.text),
    ago: String(row.ago),
    level: alertLevelSchema.parse(String(row.level)),
  };
}

export async function getCommandCenterState(actorId: string): Promise<{
  workflows: PersistedWorkflow[];
  alerts: PersistedAlert[];
}> {
  await seedActorDefaultsIfEmpty(actorId);
  const sortedWf = await getDb().all<Record<string, unknown>>(
    `SELECT id, name, detail, workflow_status
       FROM command_center_workflows
      WHERE actor_id = ?
      ORDER BY CASE WHEN sort_order < 0 THEN 0 ELSE 1 END ASC, sort_order ASC, rowid ASC`,
    [actorId],
  );

  const alertRows = await getDb().all<Record<string, unknown>>(
    `SELECT id, text, ago, level
       FROM command_center_alerts
      WHERE actor_id = ? AND dismissed = 0
      ORDER BY rowid ASC`,
    [actorId],
  );

  return {
    workflows: sortedWf.map(mapWorkflow),
    alerts: alertRows.map(mapAlert),
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
  const workflows = await getDb().all<{ workflow_status: string }>(
    `SELECT workflow_status FROM command_center_workflows WHERE actor_id = ?`,
    [actorId],
  );
  const alerts = await getDb().get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM command_center_alerts WHERE actor_id = ? AND dismissed = 0`,
    [actorId],
  );
  const counts: Record<WorkflowStatus, number> = {
    Queued: 0,
    Running: 0,
    Paused: 0,
    Succeeded: 0,
    Failed: 0,
    Cancelled: 0,
  };
  for (const row of workflows) {
    const status = workflowStatusSchema.safeParse(String(row.workflow_status));
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
    alerts: alerts?.count ?? 0,
  };
}

export async function createCommandCenterWorkflow(
  actorId: string,
  input: CreateWorkflowInput,
): Promise<PersistedWorkflow> {
  await seedActorDefaultsIfEmpty(actorId);
  const parsed = createWorkflowInputSchema.parse(input);
  const now = new Date().toISOString();
  const id = `wf-${randomUUID()}`;

  const minSortRow = await getDb().get<{ min_sort: number | null }>(
    "SELECT MIN(sort_order) AS min_sort FROM command_center_workflows WHERE actor_id = ?",
    [actorId],
  );
  const nextSort = Math.min(0, Number(minSortRow?.min_sort ?? 0)) - 1;

  await getDb().run(
    `INSERT INTO command_center_workflows (
       id, actor_id, name, detail, workflow_status, sort_order, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, actorId, parsed.name, parsed.detail, parsed.status, nextSort, now, now],
  );

  // Best-effort mirror to ORM + audit
  const actor = createActorContext(actorId, "api");
  try {
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
    await tryRecordAuditLog({
      domain: "command-center",
      entity: "workflow",
      entityId: id,
      action: "CREATE",
      actor,
      actorRole: null,
      correlationId: actor.requestId ?? null,
      requestPath: null,
      outcome: "success",
      before: null,
      after: { id, name: parsed.name, status: parsed.status },
      metadata: null,
      occurredAt: now,
    });
  } catch {
    // mirror best-effort
  }

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
  const row = await getDb().get<Record<string, unknown>>(
    `SELECT id, name, detail, workflow_status
       FROM command_center_workflows
      WHERE actor_id = ? AND id = ?`,
    [actorId, workflowId],
  );
  if (!row) return null;

  const current = workflowStatusSchema.parse(String(row.workflow_status));
  if (!canTransitionWorkflow(current, nextStatus)) {
    const error = new Error(
      `Cannot transition workflow from ${current} to ${nextStatus}`,
    ) as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }
  const now = new Date().toISOString();

  await getDb().run(
    `UPDATE command_center_workflows
        SET workflow_status = ?, updated_at = ?
      WHERE actor_id = ? AND id = ?`,
    [nextStatus, now, actorId, workflowId],
  );

  // Best-effort mirror + audit
  const actor = createActorContext(actorId, "api");
  try {
    const existing = await workflowModel.repository.find({
      actor_id: actorId,
      workflow_key: workflowId,
    });
    const payload = {
      workflow_key: workflowId,
      actor_id: actorId,
      name: String(row.name),
      detail: String(row.detail),
      workflow_status: nextStatus,
      sort_order: 0,
      metadata_json: null,
    };
    if (existing[0]) {
      await workflowModel.repository.update(existing[0].id, payload, actor);
    } else {
      await workflowModel.repository.create(payload, actor);
    }
    await tryRecordAuditLog({
      domain: "command-center",
      entity: "workflow",
      entityId: workflowId,
      action: "UPDATE",
      actor,
      actorRole: null,
      correlationId: actor.requestId ?? null,
      requestPath: null,
      outcome: "success",
      before: { status: current },
      after: { status: nextStatus },
      metadata: null,
      occurredAt: now,
    });
  } catch {
    // mirror best-effort
  }

  return {
    id: String(row.id),
    name: String(row.name),
    detail: String(row.detail),
    status: nextStatus,
  };
}

export async function toggleCommandCenterWorkflow(
  actorId: string,
  workflowId: string,
): Promise<PersistedWorkflow | null> {
  await seedActorDefaultsIfEmpty(actorId);
  const row = await getDb().get<Record<string, unknown>>(
    `SELECT id, name, detail, workflow_status
       FROM command_center_workflows
      WHERE actor_id = ? AND id = ?`,
    [actorId, workflowId],
  );
  if (!row) return null;

  const current = workflowStatusSchema.parse(String(row.workflow_status));
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
  const existing = await getDb().get<{ id: string }>(
    `SELECT id
       FROM command_center_alerts
      WHERE actor_id = ? AND id = ? AND dismissed = 0`,
    [actorId, alertId],
  );
  if (!existing) return false;

  const now = new Date().toISOString();
  await getDb().run(
    `UPDATE command_center_alerts
        SET dismissed = 1, dismissed_at = ?
      WHERE actor_id = ? AND id = ?`,
    [now, actorId, alertId],
  );

  const actor = createActorContext(actorId, "api");
  try {
    const existing = await alertModel.repository.find({
      actor_id: actorId,
      alert_key: alertId,
    });
    if (existing[0]) {
      await alertModel.repository.update(
        existing[0].id,
        { dismissed: true, dismissed_at: now },
        actor,
      );
    }
    await tryRecordAuditLog({
      domain: "command-center",
      entity: "alert",
      entityId: alertId,
      action: "UPDATE",
      actor,
      actorRole: null,
      correlationId: actor.requestId ?? null,
      requestPath: null,
      outcome: "success",
      before: { dismissed: false },
      after: { dismissed: true },
      metadata: null,
      occurredAt: now,
    });
  } catch {
    // mirror best-effort
  }
  return true;
}
