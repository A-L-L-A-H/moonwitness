import { z } from "zod";
import { defineModel } from "@moonwitness/orm";

export const PROJECT_STATUSES = ["planned", "active", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TASK_STAGES = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type ProjectTaskStatus = (typeof PROJECT_TASK_STAGES)[number];

export const PROJECT_TASK_PRIORITIES = ["low", "normal", "high", "urgent", "critical"] as const;
export type ProjectTaskPriority = (typeof PROJECT_TASK_PRIORITIES)[number];

export const projectProjectSchema = z.object({
  code: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  summary: z.string().max(2000).default(""),
  project_status: z.enum(PROJECT_STATUSES).default("active"),
  github_repo: z.string().max(200).nullable().default(null),
  color: z.string().max(32).default("#3b82f6"),
});

export const projectMoveStageInputSchema = z.object({
  task_status: z.enum(PROJECT_TASK_STAGES),
});

export const projectTaskSchema = z.object({
  project_code: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).default(""),
  priority: z.enum(PROJECT_TASK_PRIORITIES).default("normal"),
  task_status: z.enum(PROJECT_TASK_STAGES).default("todo"),
  estimated_hours: z.number().nonnegative().default(0),
  assignee: z.string().max(120).nullable().default(null),
  labels: z.array(z.string()).default([]),
  due_date: z.string().max(64).nullable().default(null),
  github_issue_number: z.number().int().positive().nullable().default(null),
  github_repo: z.string().max(200).nullable().default(null),
  github_url: z.string().max(500).nullable().default(null),
  github_state: z.enum(["open", "closed"]).nullable().default(null),
});

export const projectSyncLogSchema = z.object({
  repo: z.string().min(1).max(200),
  project_code: z.string().min(1).max(120),
  synced_count: z.number().int().min(0).default(0),
  created_count: z.number().int().min(0).default(0),
  updated_count: z.number().int().min(0).default(0),
  status: z.enum(["ok", "error"]).default("ok"),
  error_message: z.string().max(1000).nullable().default(null),
});

export const projectProjectModel = defineModel({
  name: "project.project",
  table: "pj_projects",
  schema: projectProjectSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["code", "name", "summary", "github_repo"],
  publicFields: ["code", "name", "summary", "project_status", "github_repo", "color"],
  relations: {
    tasks: {
      model: "project.task",
      type: "one2many",
      targetField: "code",
      inverseField: "project_code",
    },
  },
  indexes: [
    { fields: ["tenant_id", "code"], unique: true },
    { fields: ["project_status"] },
    { fields: ["github_repo"] },
  ],
});

export const projectTaskModel = defineModel({
  name: "project.task",
  table: "pj_tasks",
  schema: projectTaskSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["project_code", "title", "description", "assignee", "github_repo"],
  publicFields: [
    "project_code",
    "title",
    "priority",
    "task_status",
    "estimated_hours",
    "assignee",
    "labels",
    "due_date",
    "github_issue_number",
    "github_repo",
    "github_url",
    "github_state",
  ],
  relations: {
    project_code: { model: "project.project", targetField: "code" },
  },
  computed: {
    is_github_synced: {
      depends: ["github_issue_number"],
      compute: (record) =>
        record.github_issue_number !== null && record.github_issue_number !== undefined,
    },
  },
  actions: {
    move_stage: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Move Task Stage",
      input: projectMoveStageInputSchema,
      handler: async ({ record, input, repository, actor }) => {
        const parsed = input as z.infer<typeof projectMoveStageInputSchema>;
        return repository.update(String(record!.id), { task_status: parsed.task_status }, actor);
      },
    },
    mark_done: {
      scope: "record",
      roles: ["editor", "admin"],
      label: "Mark Done",
      handler: async ({ record, repository, actor }) =>
        repository.update(String(record!.id), { task_status: "done" }, actor),
    },
  },
  indexes: [
    { fields: ["project_code"] },
    { fields: ["priority"] },
    { fields: ["task_status"] },
    { fields: ["tenant_id", "project_code", "task_status"] },
    { fields: ["tenant_id", "github_repo", "github_issue_number"], unique: true },
  ],
});

export const projectSyncLogModel = defineModel({
  name: "project.sync_log",
  table: "pj_sync_logs",
  schema: projectSyncLogSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["repo", "project_code", "status"],
  publicFields: [
    "repo",
    "project_code",
    "synced_count",
    "created_count",
    "updated_count",
    "status",
    "error_message",
  ],
  indexes: [{ fields: ["tenant_id", "repo"] }, { fields: ["project_code"] }],
});

export const PROJECT_MODEL_NAMES = ["project.project", "project.task", "project.sync_log"] as const;
