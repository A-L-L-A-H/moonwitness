# ADR-007: ROCKSOUL Local Execution and Data Boundary

- **Status:** Accepted for contracts; deferred for implementation
- **Date:** 2026-11-18
- **Scope:** `apps/rocksoul`

## Context

ROCKSOUL is a private local Tauri application, while MoonWitness is a public/cloud runtime. The app is not yet an agent runtime. Legacy agent tables are compatibility schema, and existing read-only Overseer session telemetry is not evidence of process ownership or execution.

## Decision

### Trust zones

- Private ROCKSOUL SQLite, files and artifacts remain in the owner workstation trust zone.
- Public `apps/web` and `apps/api` never query or replicate ROCKSOUL private state.
- MoonWitness integration is optional and API-only.
- Export to MoonWitness requires explicit owner selection and approval.

### Process model

- Agent execution will use an allowlisted executable and argument array contract.
- Free-form shell command strings are prohibited.
- Cwd, environment, timeout, output, network and process-tree limits are explicit contract fields.
- Worktree isolation is required for writes but is not an OS sandbox.
- No Tokio, portable-pty or alternate process runtime is selected at this stage.

### Approval model

- Approvals bind action, exact target, exact normalized arguments, risk, run ID, expiry and status.
- A materially changed target or argument set does not reuse an approval.
- Revocation, denial and expiry are durable states.
- Default policy denies writes, credentials, network, external actions, delete, push, merge and publication.

### SQLite data

- SQLite remains the local source of truth for the foreseeable implementation.
- Whole-database at-rest encryption is **deferred** because its Windows key lifecycle and recovery behavior are not yet approved.
- Encrypted backup and refresh-token storage do not imply whole-database encryption.
- Before encryption is enabled, the owner must approve key storage, recovery, lockout and migration semantics.

### MoonWitness

- Core local operations remain available offline.
- Future research access uses a versioned HTTPS API adapter with allowlisted destinations and timeout.
- Direct production database access is prohibited.
- Private memory, prompts or unrelated artifacts cannot be exported silently.

## Consequences

- **Positive:** The roadmap can proceed without a fragile shell or cloud dependency.
- **Negative:** Contract-only work does not provide agent execution until later work packages.
- **Residual risk:** Worktree isolation, Windows process lifecycle and local credential storage require additional implementation and native testing.

## Reversal conditions

This decision may be revised only with a documented owner-approved ADR that addresses key recovery, threat model, process isolation and cross-zone privacy.

## Implementation & Private PostgreSQL Addendum (2026-11-19, `dev`, `#282` / `#288`)

- **Bounded Process Supervisor (`apps/rocksoul/src-tauri/src/commands/agent_execution.rs`):** Enforces `ActionApprovalBound`, `cmd.env_clear()` + `SAFE_ENV_ALLOWLIST`, concurrent 256 KiB pipe drainers, timeout watchdog + Windows `taskkill /F /T /PID`, startup `reconcile_stale_agent_runs`, and explicit UI state labels distinguishing `planned`, `queued`, `executing`, `blocked`, and `verified` execution states.
- **Private Loopback PostgreSQL Boundary (`apps/rocksoul/src-tauri/src/db.rs`):** Enforces `validate_private_postgres_url` and `resolve_rocksoul_postgres_url` (`127.0.0.1` / `localhost` / `::1` only, rejecting VPS/LAN hosts) alongside non-destructive `export_sqlite_reconciliation_manifest` before any local SQLite-to-PostgreSQL data migration.
