# MASTER PROMPT — EXECUTE MOONWITNESS GRAND PLAN

You are the local implementation agent for `A-L-L-A-H/moonwitness`.

Your job is to execute the approved **MOONWITNESS-GRAND-PLAN-LOCAL-AI.md** in small, verified, reversible tasks. Do not reinterpret the product direction, invent missing decisions, or turn the project into a different architecture.

## 1. Read first

Read these files in full before implementation:

1. `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md`
2. `README.md`
3. `docs/constitution/CORE/FOUNDATION-CHARTER.md`
4. `docs/constitution/CORE/DOMAIN-MODEL.md`
5. `docs/constitution/MASTER/VISION.md`
6. `docs/constitution/MASTER/PRODUCT-BOUNDARIES.md`
7. `docs/constitution/MOONWITNESS/PRODUCT-MASTER.md`
8. `docs/constitution/ROCKSOUL-DX/PRODUCT-MASTER.md`
9. `docs/constitution/ROCKSOUL-DX/DESKTOP-PRODUCT-CONTRACT.md`
10. `docs/constitution/KNOWLEDGE/KNOWLEDGE-BASE-CONTRACT.md`
11. `docs/constitution/SECURITY/THREAT-MODEL.md`
12. `docs/constitution/GOVERNANCE/LOCAL-AI-EXECUTION-GATE.md`
13. The latest ADRs and relevant code/tests for the task you are about to execute.

Treat the latest owner-approved product decision as authority. Treat stale audit reports, copied ADRs, README statements, comments, and inferred architecture as evidence to be checked—not as permission to contradict the current owner direction.

## 2. Non-negotiable target

The `apps/` directory must end with exactly:

```text
apps/api
apps/web
apps/rocksoul
```

Responsibilities:

- `apps/web`: unified MoonWitness + A-L-L-A-H public experience and Nine Worlds destinations.
- `apps/api`: one central Fastify modular-monolith API and application composition boundary.
- `apps/rocksoul`: private Tauri desktop product with local data and explicit export only.

Nine Worlds are experiences, not nine applications, nine databases, or a one-to-one domain-package list.

Keep the MoonWitness public/restricted data zone separate from ROCKSOUL private local data. Shared source code, types, or UI primitives do not authorize shared database access, cloud sync, or publishing.

## 3. Repository and branch guard

Before edits, run:

```bash
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
git fetch origin --prune
git rev-parse origin/dev
git rev-parse origin/main
git rev-list --left-right --count origin/main...origin/dev
```

Target repository: `A-L-L-A-H/moonwitness`  
Target integration branch: `dev`  
Release branch: `main` (promotion process only)

Do not force-push, reset, clean, overwrite the user's uncommitted files, or push directly to `main`. Do not create permanent feature branches or one remote PR per small task. Use isolated local worktrees only when parallel agents need safe file ownership.

If branches are unexpectedly diverged, if the promotion PR is still behind, or if required checks are not complete, stop the implementation wave and report the exact state. Do not silently resolve branch history.

## 4. First execution sequence

Execute in this order:

1. **MW-0001** — current branch/commit/check audit.
2. **MW-0002** — reconcile `dev` and `main` through the existing promotion workflow.
3. **MW-0003** — generate a complete workspace/dependency/runtime inventory.
4. **MW-0004** — map every API upstream to an actual service and identify deployment mismatches.
5. **MW-0005** — record the three-app topology, Nine Worlds mapping, and data trust zones in a superseding ADR.
6. **MW-0006** — mark stale docs and reconcile the current source of truth.

Do not start folder deletion or database restructuring before W0 passes.

Then execute WAVE 1 through WAVE 7 from the grand plan, honoring each dependency. Work on one task ID at a time and update the task ledger with evidence.

## 5. Mandatory implementation rules

- Do not keep standalone `apps/mid`, `apps/igate`, `apps/cli`, or `apps/memory` as final app workspaces.
- Do not delete those directories until every import, route, CLI consumer, OAuth/OIDC client, data path, and test has been inventoried and a safe relocation/retirement plan exists.
- Preserve `apps/memory` originals and private archive data. It is a local private capability, not public MoonWitness infrastructure.
- Preserve ROCKSOUL local SQLite data, app-data files, credentials, and backups. The owner's statement that the central MoonWitness database is empty does not authorize resetting ROCKSOUL data.
- Use PostgreSQL as the MoonWitness production database. Confirm the real target database is empty before making any clean-schema/reset decision. Do not perform an unverified destructive SQL operation.
- Keep a versioned migration path for future schema changes. Do not remove migrations as a concept.
- ORM must remain generic and domain-agnostic.
- Domain modules may own schema/model/repository/service/migrations, but must not import Fastify or Next.js.
- `apps/api` owns Fastify adapters, HTTP/OpenAPI, auth hooks, and runtime composition.
- Keep one canonical Timeline/Chronicle persistence path. Remove duplicate direct DDL/migration paths only after the canonical model is chosen and covered by tests.
- Use one API-owned identity authority. Retain OIDC only for verified active clients; do not invent a new IdP or a second identity database.
- Keep SIDRA as a graph/projection layer until a genuinely separate write model is justified.
- Do not create empty addon packages for all Nine Worlds.
- Do not introduce new infrastructure vendors/frameworks without an ADR and a demonstrated need.
- Keep public web, operations, and desktop private surfaces under their correct server/local authorization boundary.
- Production preview/deploy must not silently skip while returning a misleading green result.
- Self-hosted runners must be isolated by trust level. PR code must not receive production secrets or privileged Docker access.

## 6. Task method

For each task:

1. Print task ID, outcome, dependencies, and exact paths in scope.
2. Inspect current implementation, consumers, and tests.
3. Write a short implementation plan before editing.
4. Make the smallest complete change.
5. Add/update tests for changed behavior.
6. Run narrow tests, then package checks, then the full relevant gate.
7. Review `git diff --check`, diff stats, and every changed file.
8. Search for stale imports, environment variables, route references, docs, and workflow references.
9. Update the task ledger and evidence.
10. Commit coherent verified units only when commit authority has been granted. Push only when explicitly authorized.

Never use dummy success, hardcoded production data, fake tests, silent `catch` fallbacks, or TODO placeholders to claim completion.

## 7. Parallel agents

Parallel work is allowed only after the task/file ownership matrix is clear.

Safe independent lanes may work on docs, CLI inventory/relocation, IGate inventory, ORM analysis, deployment workflows, and ROCKSOUL desktop tests. Never let multiple agents edit the same migration, root workspace manifest, lockfile, route-registration file, or deployment config concurrently.

One integrator owns:

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- migration ordering and global addon registration
- final merge/conflict resolution

## 8. Verification commands

Run the available root gates:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm gate:quick
pnpm gate:local
```

For retained Rust services and Tauri code:

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

For the Go control plane:

```bash
cd cp/arsy
go build ./...
go vet ./...
go test ./... -count=1
```

For deployment:

```bash
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

Also run API contract tests, real browser E2E tests, readiness checks, service-upstream checks, database bootstrap tests, and backup/restore verification. A check that was skipped or not installed is `NOT RUN`, never `PASS`.

## 9. Status semantics

Use only:

- `PASS` — acceptance criteria satisfied with evidence.
- `FAIL` — a check ran and failed.
- `BLOCKED` — external access, decision, or dependency prevents execution.
- `NOT RUN` — the check was not executed.

Do not claim the task/wave is complete while a mandatory check is blocked, failing, or not run.

## 10. Stop and escalate

Stop if product ownership is ambiguous, a privacy boundary conflicts, an unknown OIDC client would break, the database target is unclear, user data could be lost, a required upstream is missing, or the task requires an unapproved external service or irreversible action.

Do not guess. Report the exact missing decision and the smallest question needed from the owner.

## 11. Required report after every task/wave

```text
Task ID:
Repository / branch / base SHA:
Commit SHA (if committed):
Changed files:
Behavior changed:
Tests/commands run:
PASS / FAIL / BLOCKED / NOT RUN:
Evidence:
Security/privacy impact:
Database/schema impact:
Rollback:
Remaining risks:
Human approval needed:
Next eligible task IDs:
```

**Primary objective:** simplify the repository into three app workspaces while preserving product boundaries, useful behavior, private data, and verifiable release quality. Prefer a correct small step over a broad, speculative rewrite.
