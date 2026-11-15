export type IssueStatus = "open" | "blocked" | "done" | "closed";
export type IssuePriority = "P0" | "P1" | "P2" | "P3";
export type ProjectStatus = "active" | "paused" | "done" | "archived";
export type MilestoneStatus = "planned" | "in_progress" | "done" | "blocked";
export type GitView = "status" | "log" | "diff" | "branches";
export type GitOperation =
  | "create_branch"
  | "switch_branch"
  | "commit"
  | "merge"
  | "rebase"
  | "abort_merge"
  | "abort_rebase"
  | "stash"
  | "stash_pop"
  | "fetch"
  | "pull"
  | "push";

export interface Issue {
  id: string;
  issue_key: string;
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignee: string;
  repository_id: string | null;
  repository_name: string | null;
  updated_at: string;
  closed_at?: string | null | undefined;
  project_id: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
}

export interface Repository {
  id: string;
  name: string;
  path: string;
  remote_url: string;
  default_branch: string;
  branch: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  description: string;
  due_at: string | null;
  status: MilestoneStatus;
}

export interface ActivityEvent {
  id: string;
  kind: string;
  message: string;
  created_at: string;
}

export interface Dashboard {
  stats: DashboardStats;
  issues: Issue[];
  repositories: Repository[];
  events: ActivityEvent[];
}

export interface DashboardStats {
  active: number;
  blocked: number;
  completed: number;
}

export interface GitSnapshot {
  name: string;
  branch: string;
  view: GitView | string;
  output: string;
}

export interface CloudBackupStatus {
  available: boolean;
  connected: boolean;
  account: string | null;
  lastBackupAt: string | null;
  error: string | null;
}

export interface S3GatewayStatus {
  running: boolean;
  endpoint: string | null;
  bucket: string;
  access_key: string | null;
  secret_key: string | null;
}

export interface CreateIssueArgs {
  title: string;
  description?: string | undefined;
  priority?: IssuePriority | undefined;
  projectId?: string | null | undefined;
  repositoryId?: string | null | undefined;
}

export interface UpdateIssueArgs {
  issueId: string;
  title: string;
  description: string;
  priority: IssuePriority;
  projectId?: string | null | undefined;
  repositoryId?: string | null | undefined;
}

export interface CreateProjectArgs {
  name: string;
  description?: string | undefined;
}

export interface UpdateProjectArgs {
  projectId: string;
  name: string;
  description: string;
  status: ProjectStatus;
}

export interface CreateMilestoneArgs {
  projectId: string;
  title: string;
  description?: string | undefined;
  dueAt?: string | null | undefined;
}

export interface UpdateMilestoneArgs {
  milestoneId: string;
  title: string;
  description: string;
  dueAt?: string | null | undefined;
}

export interface GitExecuteArgs {
  repositoryId: string;
  operation: GitOperation;
  branch?: string | undefined;
  message?: string | undefined;
}

export interface NativeCommands {
  get_dashboard: { args: Record<string, never>; result: Dashboard };
  list_events: { args: Record<string, never>; result: ActivityEvent[] };
  list_issues: { args: Record<string, never>; result: Issue[] };
  list_repositories: { args: Record<string, never>; result: Repository[] };
  list_projects: { args: Record<string, never>; result: Project[] };
  list_milestones: { args: Record<string, never>; result: Milestone[] };
  create_issue: { args: CreateIssueArgs; result: Issue };
  update_issue: { args: UpdateIssueArgs; result: void };
  delete_issue: { args: { issueId: string }; result: void };
  set_issue_status: { args: { issueId: string; status: IssueStatus }; result: void };
  create_project: { args: CreateProjectArgs; result: Project };
  update_project: { args: UpdateProjectArgs; result: void };
  delete_project: { args: { projectId: string }; result: void };
  create_milestone: { args: CreateMilestoneArgs; result: Milestone };
  update_milestone: { args: UpdateMilestoneArgs; result: void };
  delete_milestone: { args: { milestoneId: string }; result: void };
  set_milestone_status: {
    args: { milestoneId: string; status: MilestoneStatus };
    result: void;
  };
  add_repository: { args: { path: string }; result: Repository };
  git_snapshot: {
    args: { repositoryId: string; view?: GitView };
    result: GitSnapshot;
  };
  git_execute: { args: GitExecuteArgs; result: GitSnapshot };
  cloud_backup_status: { args: Record<string, never>; result: CloudBackupStatus };
  connect_google_drive: { args: Record<string, never>; result: CloudBackupStatus };
  disconnect_google_drive: { args: Record<string, never>; result: CloudBackupStatus };
  backup_to_google_drive: { args: Record<string, never>; result: CloudBackupStatus };
  restore_from_google_drive: { args: Record<string, never>; result: CloudBackupStatus };
  s3_gateway_status: { args: Record<string, never>; result: S3GatewayStatus };
  start_s3_gateway: { args: Record<string, never>; result: S3GatewayStatus };
  stop_s3_gateway: { args: Record<string, never>; result: S3GatewayStatus };
}

export type NativeCommand = keyof NativeCommands;
export type CommandArguments<Command extends NativeCommand> =
  NativeCommands[Command]["args"];
export type CommandResult<Command extends NativeCommand> =
  NativeCommands[Command]["result"];
