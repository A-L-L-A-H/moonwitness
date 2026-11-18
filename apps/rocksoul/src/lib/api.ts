import { invoke, type InvokeArgs } from "@tauri-apps/api/core";
import type {
  ActivityEvent,
  CommandArguments,
  CommandResult,
  Issue,
  IssuePriority,
  IssueStatus,
  Milestone,
  MilestoneStatus,
  NativeCommand,
  Project,
  ProjectStatus,
  Repository,
  MemoryRecord,
  MemoryCategory,
  MemoryStatus,
  WorkSessionRecord,
  ResumePointRecord,
  ExperienceRecord,
  LessonRecord,
  SoulJournalEntry,
} from "./contracts";

const issueStatuses: readonly IssueStatus[] = ["open", "blocked", "done", "closed"] as const;
const milestoneStatuses: readonly MilestoneStatus[] = ["planned", "in_progress", "done", "blocked"] as const;

function readPreview<Value>(key: string, fallback: Value): Value {
  try {
    const stored = localStorage.getItem(`rocksoul:${key}`);
    return stored === null ? fallback : (JSON.parse(stored) as Value) ?? fallback;
  } catch {
    return fallback;
  }
}

function writePreview(key: string, value: unknown): void {
  localStorage.setItem(`rocksoul:${key}`, JSON.stringify(value));
}

function timestamp(): string {
  return new Date().toISOString();
}

function isJsonObject(value: string): boolean {
  try {
    return !Array.isArray(JSON.parse(value)) && typeof JSON.parse(value) === "object";
  } catch {
    return false;
  }
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function call<Command extends NativeCommand>(
  command: Command,
  args?: CommandArguments<Command>,
): Promise<CommandResult<Command>> {
  const commandArgs = (args ?? {}) as CommandArguments<Command>;
  if (isDesktop()) {
    return invoke(command, commandArgs as unknown as InvokeArgs) as Promise<CommandResult<Command>>;
  }

  const issues = readPreview<Issue[]>("issues", []);
  const repositories = readPreview<Repository[]>("repositories", []);
  const projects = readPreview<Project[]>("projects", []);
  const milestones = readPreview<Milestone[]>("milestones", []);
  const events = readPreview<ActivityEvent[]>("events", []);
  const memories = readPreview<MemoryRecord[]>("memories", []);
  const workSessions = readPreview<WorkSessionRecord[]>("work_sessions", []);
  const resumePoints = readPreview<ResumePointRecord[]>("resume_points", []);
  const experiences = readPreview<ExperienceRecord[]>("experiences", []);
  const lessons = readPreview<LessonRecord[]>("lessons", []);
  const payload = commandArgs as Record<string, unknown>;
  const stringArg = (key: string): string | undefined => payload[key] as string | undefined;

  if (
    command === "cloud_backup_status" ||
    command === "connect_google_drive" ||
    command === "disconnect_google_drive" ||
    command === "backup_to_google_drive" ||
    command === "restore_from_google_drive"
  ) {
    return {
      available: false,
      connected: false,
      account: null,
      lastBackupAt: null,
      error: "Google Drive backup is only available in the native desktop app.",
    } as unknown as CommandResult<Command>;
  }
  if (
    command === "s3_gateway_status" ||
    command === "start_s3_gateway" ||
    command === "stop_s3_gateway"
  ) {
    return {
      running: false,
      endpoint: null,
      bucket: "rocksoul",
      access_key: null,
      secret_key: null,
    } as unknown as CommandResult<Command>;
  }

  if (command === "capture_memory" || command === "create_memory") {
    const category = (stringArg("category") || "working") as MemoryCategory;
    if (!["working", "project", "episodic", "semantic", "procedural", "preference"].includes(category)) {
      throw new Error("Unsupported memory category.");
    }
    const title = (stringArg("title") || "").trim();
    const content = (stringArg("content") || "").trim();
    if (!title || !content) throw new Error("Memory title and content cannot be empty.");
    const memory: MemoryRecord = {
      id: crypto.randomUUID(),
      category,
      title,
      content,
      sourceType: stringArg("sourceType") || "owner",
      sourceRef: stringArg("sourceRef") || "",
      confidence: stringArg("confidence") || "owner",
      status: "active",
      retention: stringArg("retention") || "keep",
      projectId: (payload["projectId"] as string | null) || null,
      repositoryId: (payload["repositoryId"] as string | null) || null,
      issueId: (payload["issueId"] as string | null) || null,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };
    writePreview("memories", [memory, ...memories]);
    return memory as unknown as CommandResult<Command>;
  }
  if (command === "search_memories") {
    const query = (stringArg("query") || "").trim().toLowerCase();
    const category = stringArg("category") as MemoryCategory | undefined;
    const filtered = memories.filter((memory) =>
      memory.status !== "deleted"
      && (!category || memory.category === category)
      && (!query || `${memory.title} ${memory.content} ${memory.sourceRef}`.toLowerCase().includes(query)),
    );
    return filtered as unknown as CommandResult<Command>;
  }
  if (command === "update_memory") {
    const memoryId = stringArg("memoryId");
    const selected = memories.find((memory) => memory.id === memoryId);
    if (!selected) throw new Error("Memory not found.");
    const category = stringArg("category") as MemoryCategory;
    const status = stringArg("status") as MemoryStatus;
    if (!["working", "project", "episodic", "semantic", "procedural", "preference"].includes(category)) {
      throw new Error("Unsupported memory category.");
    }
    if (!["active", "corrected", "archived", "deleted"].includes(status)) {
      throw new Error("Unsupported memory status.");
    }
    const title = (stringArg("title") || "").trim();
    const content = (stringArg("content") || "").trim();
    if (!title || !content) throw new Error("Memory title and content cannot be empty.");
    const updated: MemoryRecord = {
      ...selected,
      title,
      content,
      category,
      status,
      retention: stringArg("retention") || selected.retention,
      sourceRef: stringArg("sourceRef") || "",
      updatedAt: timestamp(),
    };
    writePreview("memories", memories.map((memory) => memory.id === memoryId ? updated : memory));
    return updated as unknown as CommandResult<Command>;
  }
  if (command === "delete_memory") {
    const memoryId = stringArg("memoryId");
    if (!memories.some((memory) => memory.id === memoryId)) throw new Error("Memory not found.");
    writePreview(
      "memories",
      memories.map((memory) => memory.id === memoryId
        ? { ...memory, status: "deleted", updatedAt: timestamp() }
        : memory),
    );
    return undefined as unknown as CommandResult<Command>;
  }
  if (command === "create_work_session") {
    const name = (stringArg("name") || "").trim();
    if (!name) throw new Error("Work session name cannot be empty.");
    const context = stringArg("contextJson") || "{}";
    if (!isJsonObject(context)) throw new Error("Context JSON must be an object.");
    const session: WorkSessionRecord = {
      id: crypto.randomUUID(),
      name,
      status: "active",
      projectId: (payload["projectId"] as string | null) || null,
      repositoryId: (payload["repositoryId"] as string | null) || null,
      issueId: (payload["issueId"] as string | null) || null,
      contextJson: context,
      createdAt: timestamp(),
      updatedAt: timestamp(),
      closedAt: null,
    };
    writePreview("work_sessions", [session, ...workSessions]);
    return session as unknown as CommandResult<Command>;
  }
  if (command === "list_work_sessions") {
    return workSessions as unknown as CommandResult<Command>;
  }
  if (command === "close_work_session") {
    const sessionId = stringArg("sessionId");
    if (!workSessions.some((session) => session.id === sessionId)) throw new Error("Work session not found.");
    writePreview(
      "work_sessions",
      workSessions.map((session) => session.id === sessionId
        ? { ...session, status: "closed", closedAt: timestamp(), updatedAt: timestamp() }
        : session),
    );
    return undefined as unknown as CommandResult<Command>;
  }
  if (command === "create_resume_point") {
    const workSessionId = stringArg("workSessionId");
    if (!workSessions.some((session) => session.id === workSessionId)) throw new Error("Work session not found.");
    const title = (stringArg("title") || "").trim();
    const summary = (stringArg("summary") || "").trim();
    if (!title || !summary) throw new Error("Resume point title and summary cannot be empty.");
    const context = stringArg("contextJson") || "{}";
    if (!isJsonObject(context)) throw new Error("Context JSON must be an object.");
    const point: ResumePointRecord = {
      id: crypto.randomUUID(),
      workSessionId: workSessionId || "",
      title,
      summary,
      contextJson: context,
      createdAt: timestamp(),
    };
    writePreview("resume_points", [point, ...resumePoints]);
    return point as unknown as CommandResult<Command>;
  }
  if (command === "list_resume_points") {
    return resumePoints as unknown as CommandResult<Command>;
  }
  if (command === "create_experience") {
    const title = (stringArg("title") || "").trim();
    const summary = (stringArg("summary") || "").trim();
    if (!title || !summary) throw new Error("Experience title and summary cannot be empty.");
    const evidence = stringArg("evidenceJson") || "{}";
    if (!isJsonObject(evidence)) throw new Error("Evidence JSON must be an object.");
    const experience: ExperienceRecord = {
      id: crypto.randomUUID(),
      title,
      summary,
      evidenceJson: evidence,
      taskId: (payload["taskId"] as string | null) || null,
      runId: (payload["runId"] as string | null) || null,
      artifactId: (payload["artifactId"] as string | null) || null,
      status: "observed",
      createdAt: timestamp(),
    };
    writePreview("experiences", [experience, ...experiences]);
    return experience as unknown as CommandResult<Command>;
  }
  if (command === "create_lesson") {
    const proposal = (stringArg("proposal") || "").trim();
    if (!proposal) throw new Error("Lesson proposal cannot be empty.");
    const experienceId = (payload["experienceId"] as string | null) || null;
    if (experienceId && !experiences.some((experience) => experience.id === experienceId)) {
      throw new Error("Experience not found.");
    }
    const lesson: LessonRecord = {
      id: crypto.randomUUID(),
      experienceId,
      proposal,
      status: "proposed",
      acceptedAt: null,
      createdAt: timestamp(),
    };
    writePreview("lessons", [lesson, ...lessons]);
    return lesson as unknown as CommandResult<Command>;
  }
  if (command === "resolve_lesson") {
    const lessonId = stringArg("lessonId");
    const status = stringArg("status");
    if (status !== "accepted" && status !== "rejected") {
      throw new Error("Lesson status must be accepted or rejected.");
    }
    const selected = lessons.find((lesson) => lesson.id === lessonId);
    if (!selected) throw new Error("Lesson not found.");
    const resolved: LessonRecord = {
      ...selected,
      status,
      acceptedAt: status === "accepted" ? timestamp() : null,
    };
    writePreview("lessons", lessons.map((lesson) => lesson.id === lessonId ? resolved : lesson));
    return resolved as unknown as CommandResult<Command>;
  }
  if (command === "list_soul_journal") {
    const entries: SoulJournalEntry[] = [
      ...experiences.map((experience) => ({
        id: experience.id,
        kind: "experience" as const,
        title: experience.title,
        summary: experience.summary,
        status: experience.status,
        evidenceJson: experience.evidenceJson,
        createdAt: experience.createdAt,
      })),
      ...lessons.map((lesson) => ({
        id: lesson.id,
        kind: "lesson" as const,
        title: "Lesson proposal",
        summary: lesson.proposal,
        status: lesson.status,
        evidenceJson: "{}",
        createdAt: lesson.createdAt,
      })),
    ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return entries as unknown as CommandResult<Command>;
  }

  if (command === "get_dashboard") {
    const completedIssues = issues.filter(issue => ["done", "closed"].includes(issue.status));
    return {
      stats: {
        active: issues.length - completedIssues.length,
        blocked: issues.filter(issue => issue.status === "blocked").length,
        completed: completedIssues.length,
      },
      issues,
      repositories,
      events,
    } as unknown as CommandResult<Command>;
  }
  if (command === "list_issues") return issues as unknown as CommandResult<Command>;
  if (command === "list_repositories") return repositories as unknown as CommandResult<Command>;
  if (command === "list_projects") return projects as unknown as CommandResult<Command>;
  if (command === "list_milestones") return milestones as unknown as CommandResult<Command>;
  if (command === "list_events") return events as unknown as CommandResult<Command>;

  if (command === "create_issue") {
    const title = stringArg("title") ?? "";
    const priority = stringArg("priority") as IssuePriority | undefined;
    const projectId = stringArg("projectId") || null;
    const repositoryId = stringArg("repositoryId") || null;
    if (!title.trim()) throw new Error("Issue title cannot be empty.");
    if (!["P0", "P1", "P2", "P3"].includes(priority || "P2")) {
      throw new Error("Priority must be P0, P1, P2, or P3.");
    }
    if (projectId && !projects.some(project => project.id === projectId)) {
      throw new Error("Select an existing project.");
    }
    if (repositoryId && !repositories.some(repository => repository.id === repositoryId)) {
      throw new Error("Select an existing repository.");
    }
    const highestIssueNumber = issues.reduce((highest, issue) => {
      const match = /^DX-(\d+)$/.exec(issue.issue_key);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    const repository = repositories.find(entry => entry.id === repositoryId);
    const issue: Issue = {
      id: crypto.randomUUID(),
      issue_key: `DX-${String(highestIssueNumber + 1).padStart(3, "0")}`,
      title: title.trim(),
      description: stringArg("description") || "",
      priority: priority || "P2",
      status: "open",
      assignee: "",
      repository_id: repositoryId,
      repository_name: repository?.name || "",
      updated_at: timestamp(),
      project_id: projectId,
    };
    writePreview("issues", [issue, ...issues]);
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "issue",
        message: `Created ${issue.issue_key} — ${issue.title}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return issue as unknown as CommandResult<Command>;
  }

  if (command === "set_issue_status") {
    const issueId = stringArg("issueId");
    const status = stringArg("status") as IssueStatus | undefined;
    if (!status || !issueStatuses.includes(status)) throw new Error("Unsupported issue status.");
    const selectedIssue = issues.find(issue => issue.id === issueId);
    if (!selectedIssue) throw new Error("Issue not found.");
    const updatedIssue: Issue = {
      ...selectedIssue,
      status,
      closed_at: ["done", "closed"].includes(status)
        ? (selectedIssue.closed_at as string | null) || timestamp()
        : null,
      updated_at: timestamp(),
    };
    writePreview("issues", issues.map(issue => (issue.id === issueId ? updatedIssue : issue)));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "issue",
        message: `${selectedIssue.issue_key} moved to ${status.toUpperCase()}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return updatedIssue as unknown as CommandResult<Command>;
  }

  if (command === "update_issue") {
    const issueId = stringArg("issueId");
    const selectedIssue = issues.find(issue => issue.id === issueId);
    if (!selectedIssue) throw new Error("Issue not found.");
    const projectId = stringArg("projectId") || null;
    const repositoryId = stringArg("repositoryId") || null;
    const repository = repositories.find(entry => entry.id === repositoryId);
    if (projectId && !projects.some(project => project.id === projectId)) {
      throw new Error("Select an existing Project.");
    }
    if (repositoryId && !repository) throw new Error("Select an existing Repository.");
    const title = stringArg("title") ?? "";
    const priority = stringArg("priority") as IssuePriority;
    if (!title.trim()) throw new Error("Issue title cannot be empty.");
    if (!["P0", "P1", "P2", "P3"].includes(priority)) {
      throw new Error("Priority must be P0, P1, P2, or P3.");
    }
    const updatedIssue: Issue = {
      ...selectedIssue,
      title: title.trim(),
      description: stringArg("description") ?? "",
      priority,
      project_id: projectId,
      repository_id: repositoryId,
      repository_name: repository?.name || "",
      updated_at: timestamp(),
    };
    writePreview("issues", issues.map(issue => (issue.id === issueId ? updatedIssue : issue)));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "issue",
        message: `Updated ${updatedIssue.issue_key}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "delete_issue") {
    const issueId = stringArg("issueId");
    const selectedIssue = issues.find(issue => issue.id === issueId);
    if (!selectedIssue) throw new Error("Issue not found.");
    writePreview("issues", issues.filter(issue => issue.id !== issueId));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "issue",
        message: `Deleted ${selectedIssue.issue_key}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "create_project") {
    const project: Project = {
      id: crypto.randomUUID(),
      name: stringArg("name") ?? "",
      description: stringArg("description") || "",
      status: "active",
    };
    writePreview("projects", [project, ...projects]);
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "project",
        message: `Created project ${project.name}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return project as unknown as CommandResult<Command>;
  }

  if (command === "update_project") {
    const projectId = stringArg("projectId");
    const selectedProject = projects.find(project => project.id === projectId);
    if (!selectedProject) throw new Error("Project not found.");
    const name = stringArg("name") ?? "";
    const status = stringArg("status") as ProjectStatus;
    if (!name.trim()) throw new Error("Project name cannot be empty.");
    if (!["active", "paused", "done", "archived"].includes(status)) {
      throw new Error("Unsupported project status.");
    }
    const updatedProject: Project = {
      ...selectedProject,
      name: name.trim(),
      description: stringArg("description") ?? "",
      status,
    };
    writePreview("projects", projects.map(project => (project.id === projectId ? updatedProject : project)));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "project",
        message: `Updated project ${updatedProject.name}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "delete_project") {
    const projectId = stringArg("projectId");
    const selectedProject = projects.find(project => project.id === projectId);
    if (!selectedProject) throw new Error("Project not found.");
    writePreview("projects", projects.filter(project => project.id !== projectId));
    writePreview("milestones", milestones.filter(milestone => milestone.project_id !== projectId));
    writePreview(
      "issues",
      issues.map(issue => (issue.project_id === projectId ? { ...issue, project_id: null } : issue)),
    );
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "project",
        message: `Deleted project ${selectedProject.name}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "create_milestone") {
    const projectId = stringArg("projectId") ?? "";
    const title = stringArg("title") ?? "";
    const project = projects.find(entry => entry.id === projectId);
    if (!title.trim()) throw new Error("Milestone title cannot be empty.");
    if (!project) throw new Error("Select an existing project.");
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      project_id: projectId,
      project_name: project.name,
      title: title.trim(),
      description: stringArg("description") || "",
      due_at: stringArg("dueAt") || null,
      status: "planned",
    };
    writePreview("milestones", [milestone, ...milestones]);
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "milestone",
        message: `Created milestone ${milestone.title}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return milestone as unknown as CommandResult<Command>;
  }

  if (command === "set_milestone_status") {
    const milestoneId = stringArg("milestoneId");
    const status = stringArg("status") as MilestoneStatus | undefined;
    if (!status || !milestoneStatuses.includes(status)) throw new Error("Unsupported milestone status.");
    const selectedMilestone = milestones.find(milestone => milestone.id === milestoneId);
    if (!selectedMilestone) throw new Error("Milestone not found.");
    const updatedMilestone: Milestone = {
      ...selectedMilestone,
      status,
    };
    writePreview("milestones", milestones.map(milestone => (milestone.id === milestoneId ? updatedMilestone : milestone)));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "milestone",
        message: `${selectedMilestone.title} moved to ${status.toUpperCase()}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "update_milestone") {
    const milestoneId = stringArg("milestoneId");
    const selectedMilestone = milestones.find(milestone => milestone.id === milestoneId);
    if (!selectedMilestone) throw new Error("Milestone not found.");
    const title = stringArg("title") ?? "";
    if (!title.trim()) throw new Error("Milestone title cannot be empty.");
    const updatedMilestone: Milestone = {
      ...selectedMilestone,
      title: title.trim(),
      description: stringArg("description") ?? "",
      due_at: stringArg("dueAt") || null,
    };
    writePreview("milestones", milestones.map(milestone => (milestone.id === milestoneId ? updatedMilestone : milestone)));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "milestone",
        message: `Updated milestone ${updatedMilestone.title}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "delete_milestone") {
    const milestoneId = stringArg("milestoneId");
    const selectedMilestone = milestones.find(milestone => milestone.id === milestoneId);
    if (!selectedMilestone) throw new Error("Milestone not found.");
    writePreview("milestones", milestones.filter(milestone => milestone.id !== milestoneId));
    writePreview("events", [
      {
        id: crypto.randomUUID(),
        kind: "milestone",
        message: `Deleted milestone ${selectedMilestone.title}`,
        created_at: timestamp(),
      },
      ...events,
    ]);
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "get_monitor_snapshot") {
    return {
      generated_at: timestamp(),
      disks: [],
      services: [],
      agent_sessions: [],
      repositories: repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        path: repo.path,
        branch: repo.branch || repo.default_branch || "unknown",
        head_hash: "",
        head_subject: "Native desktop required for live Git worktree inspection.",
        head_age: "",
        dirty_count: 0,
        staged_count: 0,
        untracked_count: 0,
        worktree_count: 0,
        changed_files: [],
        recent_commits: [],
      })),
      plans: [],
    } as unknown as CommandResult<Command>;
  }

  if (command === "open_ecosystem_url") {
    const rawUrl = (stringArg("url") ?? "").trim();
    const allowlisted = [
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3002",
      "http://localhost:3002",
      "http://127.0.0.1:8000",
      "http://localhost:8000",
      "http://127.0.0.1:8787",
      "http://localhost:8787",
    ];
    const matched = allowlisted.some((origin) => {
      if (!rawUrl.startsWith(origin)) return false;
      const suffix = rawUrl.slice(origin.length);
      return suffix === "" || suffix.startsWith("/") || suffix.startsWith("?") || suffix.startsWith("#");
    });
    if (!matched || /\s/.test(rawUrl)) {
      throw new Error("Only local MoonWitness endpoints on ports 3000, 3002, 8000, or 8787 may be opened.");
    }
    if (typeof window !== "undefined" && typeof window.open === "function") {
      window.open(rawUrl, "_blank", "noopener,noreferrer");
    }
    return undefined as unknown as CommandResult<Command>;
  }

  if (command === "add_repository") {
    throw new Error("Repository registration is available in the native desktop app.");
  }
  if (command === "git_execute") {
    throw new Error("Git write operations require the native desktop app.");
  }
  if (command === "git_snapshot") {
    const repositoryId = stringArg("repositoryId");
    const repository = repositories.find(entry => entry.id === repositoryId);
    if (!repository) throw new Error("Repository is not registered in browser preview.");
    return {
      name: repository.name,
      branch: repository.branch || repository.default_branch || "unknown",
      view: stringArg("view") || "status",
      output: "Native Git inspection is available in the desktop app.",
    } as unknown as CommandResult<Command>;
  }

  if (command === "await_mid_loopback_callback") {
    throw new Error("Loopback sign-in requires the native desktop app.");
  }

  throw new Error(`Unsupported native command: ${command}`);
}
