import type { ActorContext } from "@moonwitness/orm";
import {
  projectProjectModel,
  projectSyncLogModel,
  projectTaskModel,
  type ProjectTaskPriority,
  type ProjectTaskStatus,
} from "./models.js";

export interface GitHubIssueInput {
  number: number;
  title: string;
  body?: string | null;
  state: "open" | "closed";
  url?: string | null;
  labels?: string[];
  assignee?: string | null;
}

export interface GitHubIssueWebhookPayload {
  repository?: { full_name?: string };
  issue?: {
    number: number;
    title: string;
    body?: string | null;
    state: "open" | "closed";
    html_url?: string;
    labels?: Array<string | { name?: string }>;
    assignee?: { login?: string } | null;
  };
}

export interface GitHubSyncResult {
  repo: string;
  projectId: string;
  projectCode: string;
  synced: number;
  created: number;
  updated: number;
}

export interface ProjectBoardSummary {
  projects: number;
  tasks: number;
  syncLogs: number;
  byStatus: Record<string, number>;
  groups: Array<{ task_status?: string; count?: number; [key: string]: unknown }>;
}

/** Normalize an arbitrary name or `owner/repo` string into a canonical `project.project.code`. */
export function slugifyProjectCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Infer canonical task priority from GitHub issue label names. */
export function inferTaskPriorityFromLabels(labels: string[] = []): ProjectTaskPriority {
  const lower = labels.map((label) => label.toLowerCase());
  if (lower.some((label) => label.includes("p0") || label.includes("critical"))) {
    return "critical";
  }
  if (lower.some((label) => label.includes("urgent") || label.includes("blocker"))) {
    return "urgent";
  }
  if (
    lower.some(
      (label) => label.includes("p1") || label.includes("high") || label.includes("security"),
    )
  ) {
    return "high";
  }
  if (lower.some((label) => label.includes("p3") || label.includes("low"))) {
    return "low";
  }
  return "normal";
}

/** Map GitHub open/closed state onto Kanban task_status while preserving in-flight stages. */
export function mapGitHubIssueStatus(
  state: "open" | "closed",
  existingStatus?: ProjectTaskStatus,
): ProjectTaskStatus {
  if (state === "closed") return "done";
  if (
    existingStatus === "in_progress" ||
    existingStatus === "review" ||
    existingStatus === "backlog"
  ) {
    return existingStatus;
  }
  return "todo";
}

/** Normalize GitHub `issues` webhook JSON into a `{ repo, issue }` pair. */
export function parseGitHubIssueWebhookPayload(
  payload: GitHubIssueWebhookPayload,
): { repo: string; issue: GitHubIssueInput } | null {
  const repo = payload.repository?.full_name?.trim();
  const issue = payload.issue;
  if (!repo || !issue || typeof issue.number !== "number" || typeof issue.title !== "string") {
    return null;
  }
  return {
    repo,
    issue: {
      number: issue.number,
      title: issue.title,
      body: issue.body ?? "",
      state: issue.state === "closed" ? "closed" : "open",
      url: issue.html_url ?? null,
      labels: (issue.labels ?? [])
        .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
        .filter(Boolean),
      assignee: issue.assignee?.login ?? null,
    },
  };
}

/** Fetch non-PR GitHub issues for `owner/name` via the GitHub REST API. */
export async function fetchGitHubIssues(
  repo: string,
  state: "open" | "closed" | "all" = "all",
  token?: string,
): Promise<GitHubIssueInput[]> {
  const normalizedRepo = repo.trim();
  if (!normalizedRepo || !normalizedRepo.includes("/")) {
    throw new Error("Repository must be in 'owner/name' format");
  }

  const headers: Record<string, string> = {
    "User-Agent": "moonwitness-project-addon",
    Accept: "application/vnd.github+json",
  };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${normalizedRepo}/issues?state=${state}&per_page=100`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${normalizedRepo}`);
  }

  const raw = (await response.json()) as Array<{
    number: number;
    title: string;
    body?: string | null;
    state: "open" | "closed";
    html_url?: string;
    labels?: Array<string | { name?: string }>;
    assignee?: { login?: string } | null;
    pull_request?: unknown;
  }>;

  return raw
    .filter((entry) => !entry.pull_request)
    .map((entry) => ({
      number: entry.number,
      title: entry.title,
      body: entry.body ?? "",
      state: entry.state,
      url: entry.html_url ?? null,
      labels: (entry.labels ?? [])
        .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
        .filter(Boolean),
      assignee: entry.assignee?.login ?? null,
    }));
}

/**
 * Idempotently synchronize GitHub issues into the centralized `@moonwitness/orm`
 * `project.project`, `project.task`, and `project.sync_log` models.
 */
export async function syncGitHubIssuesToOrm(
  repo: string,
  issues: GitHubIssueInput[],
  actor: ActorContext,
): Promise<GitHubSyncResult> {
  const normalizedRepo = repo.trim();
  if (!normalizedRepo || !normalizedRepo.includes("/")) {
    throw new Error("Repository must be in 'owner/name' format");
  }

  const projectRepo = projectProjectModel.repository.forActor(actor);
  const taskRepo = projectTaskModel.repository.forActor(actor);
  const syncLogRepo = projectSyncLogModel.repository.forActor(actor);

  const projectCode = slugifyProjectCode(normalizedRepo);
  const existingProjects = await projectRepo.find({ code: projectCode }, { limit: 1 });
  const project =
    existingProjects[0] ??
    (await projectRepo.create({
      code: projectCode,
      name: normalizedRepo,
      summary: `GitHub Issues synced from ${normalizedRepo}`,
      project_status: "active",
      github_repo: normalizedRepo,
      color: "#6366f1",
    }));

  let created = 0;
  let updated = 0;

  for (const issue of issues) {
    const existing = (
      await taskRepo.find(
        { github_repo: normalizedRepo, github_issue_number: issue.number },
        { limit: 1 },
      )
    )[0];

    const labels = issue.labels ?? [];
    const formattedTitle = `#${issue.number} ${issue.title.trim()}`;
    const priority = inferTaskPriorityFromLabels(labels);

    if (existing) {
      await taskRepo.update(existing.id, {
        project_code: project.code,
        title: formattedTitle,
        description: (issue.body ?? existing.description ?? "").slice(0, 4000),
        task_status: mapGitHubIssueStatus(issue.state, existing.task_status as ProjectTaskStatus),
        priority,
        assignee: issue.assignee ?? existing.assignee ?? null,
        labels,
        github_url: issue.url ?? existing.github_url ?? null,
        github_state: issue.state,
      });
      updated += 1;
    } else {
      await taskRepo.create({
        project_code: project.code,
        title: formattedTitle,
        description: (issue.body ?? "").slice(0, 4000),
        task_status: mapGitHubIssueStatus(issue.state),
        priority,
        assignee: issue.assignee ?? null,
        labels,
        github_issue_number: issue.number,
        github_repo: normalizedRepo,
        github_url: issue.url ?? null,
        github_state: issue.state,
      });
      created += 1;
    }
  }

  await syncLogRepo.create({
    repo: normalizedRepo,
    project_code: project.code,
    synced_count: issues.length,
    created_count: created,
    updated_count: updated,
    status: "ok",
    error_message: null,
  });

  return {
    repo: normalizedRepo,
    projectId: project.id,
    projectCode: project.code,
    synced: issues.length,
    created,
    updated,
  };
}

/** Aggregate project and Kanban task status counts for a tenant (optionally scoped to one project). */
export async function getProjectBoardSummary(
  tenantId: string,
  projectCode?: string,
): Promise<ProjectBoardSummary> {
  const taskFilters = projectCode ? { project_code: projectCode } : {};
  const [projects, tasks, syncLogs, groups] = await Promise.all([
    projectProjectModel.repository.count({}, { tenantId }),
    projectTaskModel.repository.count(taskFilters, { tenantId }),
    projectSyncLogModel.repository.count(projectCode ? { project_code: projectCode } : {}, {
      tenantId,
    }),
    projectTaskModel.repository.readGroup({
      filters: taskFilters,
      groupBy: ["task_status"],
      tenantId,
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const group of groups) {
    byStatus[String(group.task_status)] = Number(group.count ?? 0);
  }

  return { projects, tasks, syncLogs, byStatus, groups };
}
