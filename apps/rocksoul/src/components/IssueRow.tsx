import React from "react";
import { ArrowUpRight, Circle, Clock3, Pencil, Trash2 } from "lucide-react";
import type { Issue } from "../lib/contracts";

const priorityClass: Record<string, string> = { P0: "p0", P1: "p1", P2: "p2", P3: "p3" };
const statusLabel: Record<string, string> = { open: "OPEN", blocked: "BLOCKED", done: "DONE", closed: "CLOSED" };

export interface IssueRowProps {
  issue: Issue;
  compact?: boolean;
  onStatusChange?: (issueId: string, status: any) => void;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
}

export default function IssueRow({
  issue,
  compact = false,
  onStatusChange,
  onEdit,
  onDelete,
}: IssueRowProps) {
  return (
    <article className={`issue-row ${compact ? "compact" : ""}`}>
      <span className="issue-key">{issue.issue_key}</span>
      <div className="issue-main">
        <strong>{issue.title}</strong>
        <small>
          {issue.repository_name || issue.assignee || "UNASSIGNED"} <span>·</span>{" "}
          {issue.updated_at ? new Date(issue.updated_at).toLocaleDateString() : "DATE UNKNOWN"}
        </small>
      </div>
      <span className={`priority-tag ${priorityClass[issue.priority] || "p2"}`}>{issue.priority}</span>
      <label className={`status-tag ${issue.status}`}>
        <Circle size={7} fill="currentColor" />
        <select
          aria-label={`Status for ${issue.issue_key}`}
          value={issue.status}
          onChange={(e) => onStatusChange?.(issue.id, e.target.value)}
        >
          {issue.status in statusLabel ? null : <option value={issue.status}>{issue.status.toUpperCase()} (LEGACY)</option>}
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {!compact && (
        <div className="issue-actions">
          <button type="button" className="row-action" aria-label={`Edit ${issue.issue_key}`} onClick={() => onEdit?.(issue)}>
            <Pencil size={14} />
          </button>
          <button type="button" className="row-action" aria-label={`Delete ${issue.issue_key}`} onClick={() => onDelete?.(issue)}>
            <Trash2 size={14} />
          </button>
          <ArrowUpRight size={16} />
        </div>
      )}
      {compact && <Clock3 size={14} className="row-clock" />}
    </article>
  );
}
