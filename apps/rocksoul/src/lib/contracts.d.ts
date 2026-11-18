export type IssueStatus = "open" | "blocked" | "done" | "closed";
export type IssuePriority = "P0" | "P1" | "P2" | "P3";
export type ProjectStatus = "active" | "paused" | "done" | "archived";
export type MilestoneStatus = "planned" | "in_progress" | "done" | "blocked";
export type GitView = "status" | "log" | "diff" | "patch" | "branches";
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

export interface DiskVolumeStatus {
  drive: string;
  mount_path: string;
  available: boolean;
  total_gb: number;
  free_gb: number;
  used_pct: number;
  tier: string;
}

export interface EcosystemServiceStatus {
  id: string;
  name: string;
  url: string;
  status: string;
  http_status: number | null;
  latency_ms: number | null;
}

export interface AgentSessionActivity {
  session_id: string;
  updated_at: string;
  step_count: number;
  last_type: string;
  last_status: string;
  last_tool: string;
}

export interface RepoMonitorEntry {
  id: string;
  name: string;
  path: string;
  branch: string;
  head_hash: string;
  head_subject: string;
  head_age: string;
  dirty_count: number;
  staged_count: number;
  untracked_count: number;
  worktree_count: number;
  changed_files: string[];
  recent_commits: string[];
}

export interface PlanTrackerEntry {
  name: string;
  path: string;
  total_tasks: number;
  completed_tasks: number;
  partial_tasks: number;
}

export interface MonitorSnapshot {
  generated_at: string;
  disks: DiskVolumeStatus[];
  services: EcosystemServiceStatus[];
  agent_sessions: AgentSessionActivity[];
  repositories: RepoMonitorEntry[];
  plans: PlanTrackerEntry[];
}

export interface MidLoopbackCallback {
  code: string;
  state: string;
  redirect_uri: string;
}

export type MemoryCategory =
  | "working"
  | "project"
  | "episodic"
  | "semantic"
  | "procedural"
  | "preference";

export type MemoryStatus = "active" | "corrected" | "archived" | "deleted";

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  sourceType: string;
  sourceRef: string;
  confidence: string;
  status: MemoryStatus;
  retention: string;
  projectId: string | null;
  repositoryId: string | null;
  issueId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSessionRecord {
  id: string;
  name: string;
  status: "active" | "closed" | "interrupted";
  projectId: string | null;
  repositoryId: string | null;
  issueId: string | null;
  contextJson: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface ResumePointRecord {
  id: string;
  workSessionId: string;
  title: string;
  summary: string;
  contextJson: string;
  createdAt: string;
}

export interface ExperienceRecord {
  id: string;
  title: string;
  summary: string;
  evidenceJson: string;
  taskId: string | null;
  runId: string | null;
  artifactId: string | null;
  status: "observed" | "verified" | "rejected";
  createdAt: string;
}

export interface LessonRecord {
  id: string;
  experienceId: string | null;
  proposal: string;
  status: "proposed" | "accepted" | "rejected";
  acceptedAt: string | null;
  createdAt: string;
}

export interface SoulJournalEntry {
  id: string;
  kind: "experience" | "lesson";
  title: string;
  summary: string;
  status: string;
  evidenceJson: string;
  createdAt: string;
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

export interface CaptureMemoryArgs {
  title: string;
  content: string;
  category?: MemoryCategory;
  sourceRef?: string;
  projectId?: string | null;
}

export interface CreateMemoryArgs {
  category: MemoryCategory;
  title: string;
  content: string;
  sourceType: string;
  sourceRef: string;
  confidence: string;
  retention: string;
  projectId?: string | null;
  repositoryId?: string | null;
  issueId?: string | null;
}

export interface UpdateMemoryArgs {
  memoryId: string;
  title: string;
  content: string;
  category: MemoryCategory;
  status: MemoryStatus;
  retention: string;
  sourceRef: string;
}

export interface CreateWorkSessionArgs {
  name: string;
  projectId?: string | null;
  repositoryId?: string | null;
  issueId?: string | null;
  contextJson?: string;
}

export interface CreateResumePointArgs {
  workSessionId: string;
  title: string;
  summary: string;
  contextJson?: string;
}

export interface CreateExperienceArgs {
  title: string;
  summary: string;
  evidenceJson?: string;
  taskId?: string | null;
  runId?: string | null;
  artifactId?: string | null;
}

export interface NativeCommands {
  await_mid_loopback_callback: { args: { authorizeUrl: string }; result: MidLoopbackCallback };
  get_dashboard: { args: Record<string, never>; result: Dashboard };
  list_events: { args: Record<string, never>; result: ActivityEvent[] };
  get_monitor_snapshot: { args: Record<string, never>; result: MonitorSnapshot };
  open_ecosystem_url: { args: { url: string }; result: void };
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
  capture_memory: { args: CaptureMemoryArgs; result: MemoryRecord };
  create_memory: { args: CreateMemoryArgs; result: MemoryRecord };
  search_memories: {
    args: { query?: string; category?: MemoryCategory };
    result: MemoryRecord[];
  };
  update_memory: { args: UpdateMemoryArgs; result: MemoryRecord };
  delete_memory: { args: { memoryId: string }; result: void };
  create_work_session: { args: CreateWorkSessionArgs; result: WorkSessionRecord };
  list_work_sessions: { args: Record<string, never>; result: WorkSessionRecord[] };
  close_work_session: { args: { sessionId: string }; result: void };
  create_resume_point: { args: CreateResumePointArgs; result: ResumePointRecord };
  list_resume_points: { args: Record<string, never>; result: ResumePointRecord[] };
  create_experience: { args: CreateExperienceArgs; result: ExperienceRecord };
  create_lesson: {
    args: { experienceId?: string | null; proposal: string };
    result: LessonRecord;
  };
  resolve_lesson: {
    args: { lessonId: string; status: "accepted" | "rejected" };
    result: LessonRecord;
  };
  list_soul_journal: { args: Record<string, never>; result: SoulJournalEntry[] };
}

export type NativeCommand = keyof NativeCommands;
export type CommandArguments<Command extends NativeCommand> =
  NativeCommands[Command]["args"];
export type CommandResult<Command extends NativeCommand> =
  NativeCommands[Command]["result"];

export type RocksoulDomain =
  | "threshold"
  | "archive"
  | "studio"
  | "riot_deck"
  | "signal_room";

export type RocksoulPolicyMode = "assisted" | "supervised" | "autonomous";
export type RocksoulRisk = "read_only" | "local_write" | "external" | "destructive" | "irreversible";

export type RocksoulToolAction =
  | "read_repository"
  | "read_selected_path"
  | "create_worktree"
  | "write_worktree"
  | "run_declared_check"
  | "read_credential"
  | "commit_isolated_branch"
  | "push_owner_branch"
  | "merge_owner_branch"
  | "delete_data"
  | "request_network"
  | "export_artifact";

export type RocksoulApprovalStatus =
  | "pending"
  | "granted"
  | "denied"
  | "expired"
  | "revoked";

export interface RocksoulEventEnvelope {
  eventId: string;
  objectiveId: string | null;
  planId: string | null;
  runId: string | null;
  stepId: string | null;
  artifactId: string | null;
  domain: RocksoulDomain;
  kind: string;
  timestamp: string;
  actor: string;
  reason: string;
  provenance: string;
}

export interface RocksoulProviderSpec {
  providerId: string;
  version: string;
  executable: string;
  argvTemplate: string[];
  cwdScope: string;
  networkAllowed: boolean;
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface RocksoulToolRequest {
  action: RocksoulToolAction;
  target: string;
  arguments: Record<string, unknown>;
  risk: RocksoulRisk;
  runId: string | null;
}

export interface RocksoulApproval {
  approvalId: string;
  action: RocksoulToolAction;
  target: string;
  arguments: Record<string, unknown>;
  risk: RocksoulRisk;
  runId: string;
  status: RocksoulApprovalStatus;
  expiresAt: string;
}
