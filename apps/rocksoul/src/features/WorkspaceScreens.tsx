import React, { useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, GitBranch, Pencil, Plus, RefreshCw, Trash2, Workflow, X } from "lucide-react";
import { thumbArchiveUrl, thumbRiotUrl, thumbSignalUrl, thumbStudioUrl } from "../assets/art";
import { IssueRow } from "../components";
import { AnarchyStarSigil, TelemetryWaveformSvg } from "../components/ui/RocksoulVectors";
import { call } from "../lib";
import type {
  ActivityEvent,
  CreateMilestoneArgs,
  CreateProjectArgs,
  GitOperation,
  GitSnapshot,
  GitView,
  Issue,
  IssueStatus,
  Milestone,
  MilestoneStatus,
  Project,
  ProjectStatus,
  Repository,
  UpdateMilestoneArgs,
  UpdateProjectArgs,
} from "../lib/contracts";

export interface PitProps {
  issues: Issue[];
  projects: Project[];
  projectFilter: string;
  onProjectFilter: (projectId: string) => void;
  onCreate: () => void;
  onStatusChange: (issueId: string, status: IssueStatus) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}

export function Pit({
  issues,
  projects,
  projectFilter,
  onProjectFilter,
  onCreate,
  onStatusChange,
  onEdit,
  onDelete,
}: PitProps) {
  const [filter, setFilter] = useState<string>("all");
  const visible = issues.filter(
    (issue) =>
      (filter === "all" || issue.status === filter) &&
      (!projectFilter || issue.project_id === projectFilter),
  );

  return (
    <section className="page-content workspace-page">
      <PageTitle
        kicker="01 / WORK QUEUE"
        title="THE PIT"
        subtitle="Every loose end. Every sharp edge. One place to throw down."
        artSrc={thumbRiotUrl}
        artCode="SECTOR 01 // THE PIT"
        action={
          <button className="riot-button" onClick={onCreate}>
            <Plus size={16} /> NEW ISSUE
          </button>
        }
      />
      <div className="filter-strip">
        {(["all", "open", "blocked", "done", "closed"] as const).map((key) => (
          <button
            key={key}
            className={filter === key ? "selected" : ""}
            onClick={() => setFilter(key)}
          >
            {key.toUpperCase()}{" "}
            <b>{key === "all" ? issues.length : issues.filter((issue) => issue.status === key).length}</b>
          </button>
        ))}
        <select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(event) => onProjectFilter(event.target.value)}
        >
          <option value="">ALL PROJECTS</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="large-issue-list">
        {visible.map((issue) => (
          <IssueRow
            key={issue.id}
            issue={issue}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {!visible.length && (
          <div className="empty-state large-empty">
            <b>NOTHING IN THIS CORNER.</b>
            <span>Create an issue or change the current filter.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export interface GitProps {
  repositories: Repository[];
  initialSelectedId?: string | undefined;
  initialView?: GitView | undefined;
  onAddRepository: (path: string) => Promise<Repository>;
  onRefresh: () => Promise<void>;
}

interface PendingOperation {
  operation: GitOperation;
  label: string;
}

export function Git({
  repositories,
  initialSelectedId,
  initialView,
  onAddRepository,
  onRefresh,
}: GitProps) {
  const [path, setPath] = useState("");
  const [selected, setSelected] = useState(initialSelectedId || repositories[0]?.id || "");
  const [snapshot, setSnapshot] = useState<GitSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedView, setSelectedView] = useState<GitView>(initialView || "status");
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | null>(null);
  const [operationBranch, setOperationBranch] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [operationPreview, setOperationPreview] = useState("");
  const autoLoadKeyRef = useRef<string>("");

  useEffect(() => {
    if (!initialView) return;
    const targetId =
      initialSelectedId && repositories.some((repo) => repo.id === initialSelectedId)
        ? initialSelectedId
        : repositories[0]?.id || "";
    if (!targetId) return;
    const key = `${targetId}:${initialView}`;
    if (autoLoadKeyRef.current === key) return;
    autoLoadKeyRef.current = key;
    let active = true;

    const loadInitial = async () => {
      setSelected(targetId);
      setSelectedView(initialView);
      setLoading(true);
      setError("");
      try {
        const result = await call("git_snapshot", { repositoryId: targetId, view: initialView });
        if (active) setSnapshot(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInitial();
    return () => {
      active = false;
    };
  }, [initialSelectedId, initialView, repositories]);

  async function inspect(kind: GitView = selectedView) {
    if (!selected) return;
    setSelectedView(kind);
    setLoading(true);
    setError("");
    try {
      setSnapshot(await call("git_snapshot", { repositoryId: selected, view: kind }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!path.trim()) return;
    setError("");
    setNotice("");
    try {
      const repository = await onAddRepository(path.trim());
      setPath("");
      setNotice(`Connected ${repository.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function runOperation() {
    if (!pendingOperation || !selected) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await call("git_execute", {
        repositoryId: selected,
        operation: pendingOperation.operation,
        branch: ["create_branch", "switch_branch", "merge", "rebase"].includes(
          pendingOperation.operation,
        )
          ? operationBranch
          : undefined,
        message: pendingOperation.operation === "commit" ? commitMessage : undefined,
      });
      setSnapshot(result);
      setSelectedView("status");
      setNotice(`${pendingOperation.label} completed.`);
      setPendingOperation(null);
      setOperationBranch("");
      setCommitMessage("");
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function reviewOperation(operation: PendingOperation) {
    setPendingOperation(operation);
    setOperationBranch("");
    setCommitMessage("");
    setOperationPreview("");
    if (!selected) return;
    try {
      const [status, diff] = await Promise.all([
        call("git_snapshot", { repositoryId: selected, view: "status" }),
        call("git_snapshot", { repositoryId: selected, view: "diff" }),
      ]);
      setOperationPreview(
        `${status.output || "Clean working tree."}\n\nDIFF SUMMARY\n${diff.output || "No unstaged changes."}`,
      );
    } catch (e) {
      setOperationPreview(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="page-content workspace-page">
      <PageTitle
        kicker="03 / SOURCE CONTROL"
        title="GIT JUNGLE"
        subtitle="Your checkouts. Your branches. No remote dependency required."
        artSrc={thumbArchiveUrl}
        artCode="SECTOR 03 // GIT JUNGLE"
        action={
          <button className="outline-button" onClick={onRefresh}>
            <RefreshCw size={15} /> REFRESH
          </button>
        }
      />
      <div className="git-layout">
        <div className="riot-panel repo-panel">
          <div className="panel-heading cream">
            <span>REGISTERED REPOSITORIES</span>
            <span>{repositories.length} LOCAL</span>
          </div>
          {repositories.map((repo) => (
            <button
              key={repo.id}
              className={`repo-select ${selected === repo.id ? "selected" : ""}`}
              onClick={() => {
                setSelected(repo.id);
                setSnapshot(null);
              }}
            >
              <GitBranch size={18} />
              <span>
                <b>{repo.name}</b>
                <small>{repo.path}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
          <form className="add-repo" onSubmit={add}>
            <label className="field-label">
              ADD LOCAL CHECKOUT
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\\Projects\\my-repo or /home/me/repo"
              />
            </label>
            <button className="riot-button" disabled={!path.trim()}>
              <Plus size={15} /> CONNECT
            </button>
          </form>
        </div>
        <div className="riot-panel git-inspector">
          <div className="panel-heading purple-head">
            <span>WORKTREE INSPECTOR</span>
            <span className="micro-label">LOCAL GIT CONTROLS</span>
          </div>
          <div className="git-actions">
            {(["status", "log", "diff", "patch", "branches"] as const).map((key) => (
              <button
                key={key}
                className={`outline-button ${selectedView === key ? "selected" : ""}`}
                aria-pressed={selectedView === key}
                onClick={() => inspect(key)}
                disabled={!selected || loading}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="git-actions git-write-actions">
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "create_branch", label: "Create branch" })}
            >
              NEW BRANCH
            </button>
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "switch_branch", label: "Switch branch" })}
            >
              SWITCH
            </button>
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "commit", label: "Commit changes" })}
            >
              COMMIT
            </button>
            {(["fetch", "pull", "push"] as const).map((operation) => (
              <button
                key={operation}
                className="outline-button"
                disabled={!selected || loading}
                onClick={() =>
                  reviewOperation({
                    operation: operation as GitOperation,
                    label: operation.toUpperCase(),
                  })
                }
              >
                {operation.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="git-actions git-write-actions">
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "merge", label: "Merge branch" })}
            >
              MERGE
            </button>
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "rebase", label: "Rebase onto branch" })}
            >
              REBASE
            </button>
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "abort_merge", label: "Abort merge" })}
            >
              ABORT MERGE
            </button>
            <button
              className="outline-button"
              disabled={!selected || loading}
              onClick={() => reviewOperation({ operation: "abort_rebase", label: "Abort rebase" })}
            >
              ABORT REBASE
            </button>
          </div>
          {loading ? (
            <div className="empty-state">
              <RefreshCw className="spin" />
              <span>READING THE REPOSITORY...</span>
            </div>
          ) : error ? (
            <pre className="terminal-output error-output">{error}</pre>
          ) : snapshot ? (
            <>
              <div className="git-meta">
                <b>{snapshot.name}</b>
                <span>⑂ {snapshot.branch}</span>
              </div>
              <pre className="terminal-output">
                {snapshot.output || (snapshot.view === "status" ? "Clean working tree." : "No results.")}
              </pre>
            </>
          ) : (
            <div className="empty-state">
              <GitBranch size={30} />
              <b>SELECT A REPOSITORY.</b>
              <span>Inspect local status, recent commits, diffs, and branches.</span>
            </div>
          )}
          {notice && (
            <p className="inline-notice" role="status">
              {notice}
            </p>
          )}
        </div>
      </div>
      {pendingOperation && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setPendingOperation(null)}
        >
          <section
            className="issue-dialog git-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="git-confirm-title"
          >
            <header className="dialog-head">
              <div>
                <span className="eyebrow">GIT / WRITE OPERATION</span>
                <h2 id="git-confirm-title">
                  REVIEW ACTION<span>!</span>
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setPendingOperation(null)}
                aria-label="Cancel Git operation"
              >
                <X />
              </button>
            </header>
            <p className="git-confirm-warning">
              This action changes the selected local repository. Review the target and current worktree before
              confirming.
            </p>
            <div className="git-confirm-target">
              <span>REPOSITORY</span>
              <b>{repositories.find((repository) => repository.id === selected)?.name || "Unavailable"}</b>
              <span>OPERATION</span>
              <b>{pendingOperation.label}</b>
            </div>
            {["create_branch", "switch_branch", "merge", "rebase"].includes(pendingOperation.operation) && (
              <label className="field-label">
                BRANCH NAME
                <input
                  autoFocus
                  value={operationBranch}
                  onChange={(event) => setOperationBranch(event.target.value)}
                  placeholder="feature/your-change"
                />
              </label>
            )}
            {pendingOperation.operation === "commit" && (
              <label className="field-label">
                COMMIT MESSAGE
                <input
                  autoFocus
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="Describe this change"
                />
              </label>
            )}
            <div className="git-confirm-preview">
              <span>REPOSITORY PREVIEW</span>
              <pre>{operationPreview || "Loading repository status and diff summary..."}</pre>
            </div>
            <footer className="dialog-foot">
              <button className="outline-button" onClick={() => setPendingOperation(null)}>
                CANCEL
              </button>
              <button
                className="riot-button"
                disabled={
                  loading ||
                  (["create_branch", "switch_branch", "merge", "rebase"].includes(
                    pendingOperation.operation,
                  ) &&
                    !operationBranch.trim()) ||
                  (pendingOperation.operation === "commit" && !commitMessage.trim())
                }
                onClick={runOperation}
              >
                CONFIRM {pendingOperation.label.toUpperCase()}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

export interface WarRoomProps {
  projects: Project[];
  milestones: Milestone[];
  issues: Issue[];
  onCreateProject: (args: CreateProjectArgs) => Promise<Project | void>;
  onUpdateProject: (args: UpdateProjectArgs) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onCreateMilestone: (args: CreateMilestoneArgs) => Promise<Milestone | void>;
  onUpdateMilestone: (args: UpdateMilestoneArgs) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onMilestoneStatus: (milestoneId: string, status: MilestoneStatus) => void;
  onProjectIssues: (projectId: string) => void;
}

export function WarRoom({
  projects,
  milestones,
  issues,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onMilestoneStatus,
  onProjectIssues,
}: WarRoomProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notice, setNotice] = useState("");
  const [editingProject, setEditingProject] = useState("");
  const [editingMilestone, setEditingMilestone] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectStatus, setEditProjectStatus] = useState<ProjectStatus>("active");
  const [editMilestoneTitle, setEditMilestoneTitle] = useState("");
  const [editMilestoneDescription, setEditMilestoneDescription] = useState("");
  const [editMilestoneDate, setEditMilestoneDate] = useState("");
  const activeProjectId = projects.some((project) => project.id === projectId)
    ? projectId
    : projects[0]?.id || "";

  async function submitProject(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await onCreateProject({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function submitMilestone(event: React.FormEvent) {
    event.preventDefault();
    if (!activeProjectId || !milestoneTitle.trim()) return;
    try {
      await onCreateMilestone({
        projectId: activeProjectId,
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim(),
        dueAt: dueAt || undefined,
      });
      setMilestoneTitle("");
      setMilestoneDescription("");
      setDueAt("");
      setNotice("MILESTONE ADDED TO THE PLAN.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function removeProject(project: Project) {
    if (
      !window.confirm(
        `Delete "${project.name}"? Its milestones will be removed; linked issues and repositories will be kept without the project.`,
      )
    )
      return;
    try {
      await onDeleteProject(project.id);
      setNotice(`Deleted project ${project.name}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveProject(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onUpdateProject({
        projectId: editingProject,
        name: editProjectName,
        description: editProjectDescription,
        status: editProjectStatus,
      });
      setEditingProject("");
      setNotice("PROJECT UPDATED.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function removeMilestone(milestone: Milestone) {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) return;
    try {
      await onDeleteMilestone(milestone.id);
      setNotice(`Deleted milestone ${milestone.title}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveMilestone(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onUpdateMilestone({
        milestoneId: editingMilestone,
        title: editMilestoneTitle,
        description: editMilestoneDescription,
        dueAt: editMilestoneDate || undefined,
      });
      setEditingMilestone("");
      setNotice("MILESTONE UPDATED.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="page-content workspace-page">
      <PageTitle
        kicker="04 / STRATEGY & MILESTONES"
        title="WAR ROOM"
        subtitle="Turn the big idea into small moves that can actually ship."
        artSrc={thumbStudioUrl}
        artCode="SECTOR 04 // WAR ROOM"
      />
      <form className="riot-panel project-create" onSubmit={submitProject}>
        <div className="panel-heading cream">
          <span>
            <Workflow size={15} /> NEW PROJECT
          </span>
          <span className="micro-label">LOCAL PLAN</span>
        </div>
        <div className="project-fields">
          <input
            aria-label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="PROJECT CODENAME"
          />
          <input
            aria-label="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does success look like?"
          />
          <button className="riot-button" disabled={!name.trim()}>
            <Plus size={15} /> CREATE PROJECT
          </button>
        </div>
      </form>

      <form className="riot-panel milestone-create" onSubmit={submitMilestone}>
        <div className="panel-heading pink">
          <span>BUILD THE ROADMAP</span>
          <span className="micro-label">MILESTONE PLANNER</span>
        </div>
        <div className="milestone-fields">
          <label className="field-label">
            PROJECT
            <select
              value={activeProjectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!projects.length}
            >
              <option value="">SELECT PROJECT</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            MILESTONE TITLE
            <input
              aria-label="Milestone title"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g. First playable build"
            />
          </label>
          <label className="field-label">
            TARGET DATE
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </label>
          <label className="field-label milestone-description">
            SUCCESS CRITERIA
            <input
              value={milestoneDescription}
              onChange={(e) => setMilestoneDescription(e.target.value)}
              placeholder="What must be true to complete it?"
            />
          </label>
          <button className="riot-button" disabled={!activeProjectId || !milestoneTitle.trim()}>
            <Plus size={15} /> ADD MILESTONE
          </button>
        </div>
      </form>

      <div className="milestone-board">
        <div className="milestone-board-head">
          <span>MISSION BOARD</span>
          <span>
            {milestones.length} MILESTONES / {milestones.filter((item) => item.status === "done").length} COMPLETE
          </span>
        </div>
        {milestones.map((milestone, index) => (
          <article className="milestone-row" key={milestone.id}>
            <span className="milestone-index">{String(index + 1).padStart(2, "0")}</span>
            {editingMilestone === milestone.id ? (
              <form className="milestone-edit-form" onSubmit={saveMilestone}>
                <input
                  aria-label="Edit milestone title"
                  value={editMilestoneTitle}
                  onChange={(event) => setEditMilestoneTitle(event.target.value)}
                  required
                />
                <input
                  aria-label="Edit milestone description"
                  value={editMilestoneDescription}
                  onChange={(event) => setEditMilestoneDescription(event.target.value)}
                />
                <input
                  aria-label="Edit milestone target date"
                  type="date"
                  value={editMilestoneDate}
                  onChange={(event) => setEditMilestoneDate(event.target.value)}
                />
                <button className="outline-button">SAVE</button>
                <button type="button" className="outline-button" onClick={() => setEditingMilestone("")}>
                  CANCEL
                </button>
              </form>
            ) : (
              <div className="milestone-main">
                <b>{milestone.title}</b>
                <small>
                  {milestone.project_name} · {milestone.description || "No success criteria recorded"}
                </small>
              </div>
            )}
            {editingMilestone !== milestone.id && (
              <span className="milestone-date">{milestone.due_at || "NO TARGET"}</span>
            )}
            <select
              className={"milestone-status " + milestone.status}
              aria-label={"Status for " + milestone.title}
              value={milestone.status}
              onChange={(e) => onMilestoneStatus(milestone.id, e.target.value as MilestoneStatus)}
            >
              <option value="planned">PLANNED</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="blocked">BLOCKED</option>
              <option value="done">DONE</option>
            </select>
            <div className="issue-actions">
              <button
                type="button"
                className="row-action"
                aria-label={`Edit ${milestone.title}`}
                onClick={() => {
                  setEditingMilestone(milestone.id);
                  setEditMilestoneTitle(milestone.title);
                  setEditMilestoneDescription(milestone.description || "");
                  setEditMilestoneDate(milestone.due_at || "");
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="row-action"
                aria-label={`Delete ${milestone.title}`}
                onClick={() => removeMilestone(milestone)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
        {!milestones.length && (
          <div className="empty-state large-empty">
            <b>NO MILESTONES ON THE BOARD.</b>
            <span>Create a project, then add its first checkpoint above.</span>
          </div>
        )}
      </div>

      <div className="project-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project.id}>
            <span className="project-number">0{index + 1}</span>
            <span className="eyebrow">ACTIVE OPERATION</span>
            {editingProject === project.id ? (
              <form className="project-edit-form" onSubmit={saveProject}>
                <input
                  aria-label="Edit project name"
                  value={editProjectName}
                  onChange={(event) => setEditProjectName(event.target.value)}
                  required
                />
                <input
                  aria-label="Edit project description"
                  value={editProjectDescription}
                  onChange={(event) => setEditProjectDescription(event.target.value)}
                />
                <select
                  aria-label="Project status"
                  value={editProjectStatus}
                  onChange={(event) => setEditProjectStatus(event.target.value as ProjectStatus)}
                >
                  <option value="active">ACTIVE</option>
                  <option value="paused">PAUSED</option>
                  <option value="done">DONE</option>
                  <option value="archived">ARCHIVED</option>
                </select>
                <button className="outline-button">SAVE</button>
                <button type="button" className="outline-button" onClick={() => setEditingProject("")}>
                  CANCEL
                </button>
              </form>
            ) : (
              <>
                <h3>{project.name}</h3>
                <p>{project.description || "No mission statement recorded yet."}</p>
              </>
            )}
            <div className="project-progress">
              <span
                style={{
                  width:
                    (milestones.filter((item) => item.project_id === project.id && item.status === "done")
                      .length /
                      Math.max(1, milestones.filter((item) => item.project_id === project.id).length)) *
                      100 +
                    "%",
                }}
              />
            </div>
            <footer>
              <span>{project.status.toUpperCase()}</span>
              <span>
                {milestones.filter((item) => item.project_id === project.id && item.status === "done").length}/
                {milestones.filter((item) => item.project_id === project.id).length} MILESTONES DONE
              </span>
            </footer>
            <div className="issue-actions project-actions">
              <button
                type="button"
                className="row-action"
                aria-label={`Edit ${project.name}`}
                onClick={() => {
                  setEditingProject(project.id);
                  setEditProjectName(project.name);
                  setEditProjectDescription(project.description || "");
                  setEditProjectStatus(project.status);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="row-action"
                aria-label={`Delete ${project.name}`}
                onClick={() => removeProject(project)}
              >
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={() => onProjectIssues(project.id)}
              >
                {issues.filter((issue) => issue.project_id === project.id).length} ISSUES
              </button>
            </div>
          </article>
        ))}
        {!projects.length && (
          <div className="empty-state large-empty">
            <b>NO ACTIVE OPERATIONS.</b>
            <span>Create a project to start organizing milestones and work.</span>
          </div>
        )}
      </div>
      {notice && <p className="inline-notice">{notice}</p>}
    </section>
  );
}

export interface NoiseProps {
  events: ActivityEvent[];
}

export function Noise({ events }: NoiseProps) {
  return (
    <section className="page-content workspace-page">
      <PageTitle
        kicker="05 / EVENT INTELLIGENCE"
        title="NOISE TAPE"
        subtitle="The machine remembers. A readable trail of what happened and when."
        artSrc={thumbSignalUrl}
        artCode="SECTOR 05 // NOISE TAPE"
      />
      <div className="riot-panel noise-log">
        <div className="panel-heading purple-head">
          <span>
            <Activity size={15} /> LOCAL EVENT STREAM
          </span>
          <span className="micro-label">APPEND-ONLY JOURNAL</span>
        </div>
        <div className="noise-telemetry-strip" aria-hidden="true">
          <TelemetryWaveformSvg className="rs-waveform-svg noise-waveform" />
          <span>CH-05 // APPEND TRACE</span>
        </div>
        {events.map((event) => (
          <article className="noise-log-row" key={event.id}>
            <span className="noise-led" />
            <span className="noise-kind">{event.kind.toUpperCase()}</span>
            <b>{event.message}</b>
            <time>{new Date(event.created_at).toLocaleString()}</time>
          </article>
        ))}
        {!events.length && (
          <div className="empty-state large-empty">
            <b>NO SIGNAL. NO DRAMA.</b>
            <span>Issue, project, milestone, and repository activity will be recorded here.</span>
          </div>
        )}
      </div>
    </section>
  );
}

interface PageTitleProps {
  kicker: string;
  title: string;
  subtitle: string;
  artSrc?: string;
  artCode?: string;
  action?: React.ReactNode;
}

function PageTitle({ kicker, title, subtitle, artSrc, artCode, action }: PageTitleProps) {
  return (
    <header className="workspace-title">
      <div className="workspace-title-copy">
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="workspace-title-aside">
        {artSrc && (
          <div className="workspace-art-plate" aria-hidden="true">
            <img src={artSrc} alt="" loading="lazy" />
            <div className="workspace-art-scrim" />
            <div className="workspace-art-meta">
              <AnarchyStarSigil className="rs-anarchy-sigil workspace-art-sigil" />
              <span>{artCode || "LOCAL // DX"}</span>
            </div>
          </div>
        )}
        {action}
      </div>
    </header>
  );
}
