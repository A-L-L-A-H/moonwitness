# Work Tracker Contract

**Status:** PROPOSED v1  
**Purpose:** Native AI-first work management, not a GitHub Issues clone.

## Hierarchy

`Workspace → Project → Initiative → Milestone → Task → Subtask`

Not every task must belong to an initiative or milestone. A task may have dependencies, parent task, related documents, repository references, artifacts, comments, and execution runs.

## Task fields

Required: `id`, `workspace_id`, `title`, `status`, `priority`, `created_at`, `updated_at`, `created_by`.

Optional: `description`, `project_id`, `initiative_id`, `milestone_id`, `parent_task_id`, `assignee_type`, `assignee_id`, `due_at`, `estimate`, `labels`, `acceptance_criteria`, `source_refs`, `blocked_reason`, `completed_at`.

## Status lifecycle

- `inbox` — captured, not triaged.
- `ready` — sufficiently specified and actionable.
- `in_progress` — actively owned.
- `blocked` — waiting on a dependency or decision.
- `in_review` — implementation/evidence awaits review.
- `done` — acceptance criteria met and evidence attached where applicable.
- `cancelled` — intentionally stopped; reason required.

Allowed transitions are validated by the domain layer. Agents may not mark their own high-impact work done if policy requires owner review.

## Priority

`critical`, `high`, `normal`, `low`, `someday`. Priority is not a substitute for due date or dependency.

## AI-native behavior

- Tasks can be created from natural language, then normalized into title, context, outcome, acceptance criteria, risks, and dependencies.
- Agents can propose a plan and create subtasks.
- Agents claim tasks using a lease with expiry to prevent duplicate execution.
- A task can be assigned to a human, a named agent, or an agent pool.
- Agent runs attach logs, outputs, changed files, commit/PR references, and test evidence.
- Human review is a first-class state, not a comment convention.
- Agents report blockers and request decisions rather than silently guessing.

## Required task quality

A task intended for execution should include:
1. Desired outcome.
2. Scope and non-goals.
3. Acceptance criteria that can be checked.
4. Relevant knowledge/document references.
5. Dependencies and risks where known.
6. Owner or agent capability.

## Dependencies

Dependency types: `blocks`, `relates_to`, `duplicates`. Block cycles are rejected. Completion of a blocked task is prevented until dependencies are resolved or explicitly waived by an authorized owner.

## Audit and history

Every status, priority, assignment, scope, acceptance-criteria, and approval change creates an immutable activity event with actor, timestamp, before/after, and reason.

## Git provider integration

GitHub/GitLab are integrations for branches, commits, PRs, CI, and code review. They are not the source of truth for tasks. A task may link to multiple repository artifacts; repository issue IDs are optional external references only.

## MVP acceptance

- Create, edit, search, filter, assign, and archive tasks.
- Board and list views.
- Parent/subtask and dependency graph.
- Agent claim/heartbeat/release flow.
- Comments and artifacts.
- Activity/audit timeline.
- Human approval queue.
- API and MCP parity for core operations.
