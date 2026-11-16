# Local AI Execution Readiness Gate

**Status:** DECIDED governance requirement  
**Scope:** Prompts and work packages handed to local coding agents  
**Last reviewed:** 2026-11-15

## 1. Purpose

Prevent a local AI agent from guessing product intent, changing the wrong repository, expanding scope, or claiming completion without evidence.

This is a governance contract. It is not an execution prompt and does not authorize any repository action by itself.

## 2. Mandatory inputs before escalation

Every implementation work package MUST state:

1. **Source of truth:** exact Master Docs documents and revisions/commit.
2. **Target:** exact repository, branch, and permitted paths.
3. **Product scope:** approved product promise, primary workflow, and non-goals.
4. **Mission:** one bounded outcome with measurable acceptance criteria.
5. **Plan:** ordered tasks, dependencies, and explicit parallelization boundaries.
6. **Constraints:** approved stack decisions, prohibited technologies/patterns, privacy rules, and compatibility requirements.
7. **Permissions:** allowed read/write operations, tools, external services, and actions requiring owner approval.
8. **Validation:** exact lint, test, build, security, and manual verification commands.
9. **Evidence:** expected diffs, logs, test outputs, screenshots, artifacts, and commit references.
10. **Stop conditions:** ambiguity, missing access, scope change, destructive action, security concern, failing validation, or conflicting source material.

## 3. Repository targeting invariant

The work package MUST name one target repository and branch.

- Cross-product specifications and decisions belong in `A-L-L-A-H/master-docs`.
- ROCKSOUL DX implementation belongs in `A-L-L-A-H/rocksoul-dx`.
- MoonWitness implementation belongs in `A-L-L-A-H/moonwitness`.
- A documentation task must not silently become an application-code task.
- An implementation task must not rewrite Master Docs decisions without a separate approved documentation change.
- If the target is ambiguous, the agent MUST stop and ask.

The agent MUST NOT infer a target from the last repository it touched, a similar folder name, or a prior task.

## 4. Decision and canon safety

The agent MUST:
- distinguish DECIDED, PROPOSED, SOURCE-FOUND, UNKNOWN, DISPUTED, and IMPLEMENTED;
- preserve exact owner terms and spelling variants;
- not invent memories, relationships, character roles, framework definitions, or chronology;
- not upgrade assistant interpretation to owner-approved canon;
- link evidence for implementation claims;
- stop when a missing decision changes the architecture or acceptance criteria.

## 5. Execution controls

- Parallelize only independent tasks with separate file/path ownership.
- Never allow concurrent agents to edit the same files or migration without an explicit integration plan.
- Keep changes bounded to the named repository, branch, and paths.
- Prefer reversible changes and isolated worktrees where appropriate.
- A Git worktree is not an OS security sandbox.
- Agent output and tool output are untrusted until validated.
- Successful process exit is not proof of correctness.
- No agent may approve its own high-impact external action.

## 6. Completion report

The agent MUST report:

- target repository, branch, and final commit;
- files changed and why;
- acceptance criteria passed/failed/not run;
- exact validation commands and outcomes;
- security/privacy impact;
- unresolved risks and limitations;
- external side effects, if any;
- whether a human review or release approval is still required.

Do not use "done", "complete", "release-ready", or equivalent unless the relevant acceptance gate is satisfied with evidence.

## 7. Escalation blockers

No implementation prompt should be generated when:
- the requested work exceeds or conflicts with an approved bounded work package;
- the target repository or branch is unspecified;
- acceptance criteria are not testable;
- privacy or permission boundaries are unclear;
- a critical dependency or contract is still contradictory;
- the task requires an unapproved irreversible action.

## 8. Approved bounded package

A work package may proceed when it names an approved product decision, a bounded first-release workflow, exact target repository/branch, permitted scope, measurable acceptance criteria, technical constraints, validation, evidence, and stop conditions.

The current approved ROCKSOUL DX package is [RDX-VIS-20261115-01 — v0.1 Visual Foundation](../ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md). It authorizes only a visual foundation prototype in `A-L-L-A-H/rocksoul-dx`. It does not authorize backend, database, agent runtime, cloud, publishing, or expanded Tauri permissions.

## 9. Relationship to other documents

This gate complements:
- [Documentation Governance](DOCUMENTATION-GOVERNANCE.md)
- [AI Agent Operating Model](../MCP/AGENT-OPERATING-MODEL.md)
- [MCP Server Contract](../MCP/MCP-SERVER-CONTRACT.md)
- [ROCKSOUL DX Product Scope Decision](../ROCKSOUL-DX/PRODUCT-SCOPE-DECISION.md)
- [Foundation Roadmap](../ROADMAP/FOUNDATION-ROADMAP.md)
- [ROCKSOUL DX Visual Constitution](../ROCKSOUL-DX/VISUAL-CONSTITUTION.md)
- [ROCKSOUL DX Visual Foundation Work Package](../ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md)
