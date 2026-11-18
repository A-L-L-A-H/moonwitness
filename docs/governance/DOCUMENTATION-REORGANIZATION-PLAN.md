---
contract_id: "MW-GOV-PLAN-001"
title: "MoonWitness Documentation Reorganization and Remediation Plan"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
execution_gate: "AUTHORIZED — Master Execution Directive (2026-11-18); execute non-destructive Waves 1–5 on dev"
scope: "Prioritized non-destructive remediation sequence preserving decentralized ownership across A-L-L-A-H/moonwitness"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/governance/DOCUMENTATION-AUDIT-REPORT.md"
  - "docs/governance/DOCUMENTATION-AUTHORITY-MAP.md"
---

# MoonWitness Documentation Reorganization and Remediation Plan

## 1. Target Decentralized Documentation Architecture

This plan preserves co-located ownership across workspaces and **does not collapse documentation into a single directory**:

```text
/                                   # Tier 1 root: README, AGENTS, CONTRIBUTING, CHANGELOG, WORK_PLAN only
docs/
  governance/                       # MW-GOV-DOC-001..005 + audit/authority/reorg contracts
  architecture/                     # Active ARCH-ADR-NNN + topology, data ownership, ARSY, runbooks
  engineering/                      # BRANCHING, GATECHECK, CI-CD, RELEASING, SECURITY, MID-AUDIENCE-POLICY
  dna/ & docs/ui/                   # Design DNA 00..09 + canonical ATOMIC-UI-GUIDE
  constitution/                     # Tier 0 A-L-L-A-H Ecosystem Constitution (preserved)
  blueprint/                        # Frozen Gen2 Reference Specs (preserved)
  legacy-harvest/                   # Immutable historical archives (preserved)
apps/{web,api,rocksoul}/            # Co-located app README.md & app-specific docs/
packages/<pkg>/                     # Co-located package README.md & public-surface docs
services/<svc>/ & cp/arsy/          # Co-located service/control-plane README.md & docs/
engines/<engine>/                   # Co-located engine governance, ADRs, specs & READMEs (preserved)
content/chronicles/                 # Preserved narrative corpus (read-only provenance)
```

---

## 2. Prioritized 5-Wave Execution Sequence

### Wave 1 (P0) — Reconcile Active Code-to-Doc Contradictions (In-Place Edits, Zero File Moves)

| Target File                                                                                                                                                                                                                        | Verified Defect to Fix                                                                                                                                                                  | Owner / Reviewer          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [README.md](../../README.md)                                                                                                                                                                                                       | Replace `apps/memory/` with `services/memory/`; reflect 3-app topology (`apps/{api,rocksoul,web}`) per `ARCH-ADR-006`.                                                                  | Repository Architecture   |
| [CONTRIBUTING.md](../../CONTRIBUTING.md)                                                                                                                                                                                           | Distinguish human ephemeral PR flow from AI agent `dev`-only transient PR ref flow (`AGENTS.md`).                                                                                       | Repository Architecture   |
| [VPS-TOPOLOGY-OPERATIONS.md](../architecture/VPS-TOPOLOGY-OPERATIONS.md), [DEPLOYMENT-RUNBOOK.md](../architecture/DEPLOYMENT-RUNBOOK.md), [DEPLOYMENT.md](../engineering/DEPLOYMENT.md), [SECURITY.md](../engineering/SECURITY.md) | Remove nonexistent `allah:3003` container; align Caddy route (`a-l-l-a-h.com -> web:3000`) and health check (`/api/v1/healthz`) with `Caddyfile` & `docker-compose.yml`.                | Infrastructure Lead       |
| [DATA-OWNERSHIP-BACKUP-RESTORE.md](../architecture/DATA-OWNERSHIP-BACKUP-RESTORE.md), [RUNBOOK.md](../engineering/RUNBOOK.md), [packages/orm/README.md](../../packages/orm/README.md)                                              | Align PostgreSQL production `DATABASE_URL` (`docker-compose.yml` + `postgres.driver.ts`) vs. SQLite local/service DBs; remove `apps/mid` and `apps/memory` paths.                       | Backend / ORM Lead        |
| [CI-CD.md](../engineering/CI-CD.md)                                                                                                                                                                                                | Replace _"exactly one CI workflow"_ with accurate inventory of the 20 `.github/workflows/*.yml` files; fix `promote.yml` -> `auto-promote.yml`.                                         | CI Maintainer             |
| [RELEASING.md](../engineering/RELEASING.md)                                                                                                                                                                                        | Remove stale `0.1.0` / _"no prior tagged release"_ statement; align with `0.13.0` manifest and `CHANGELOG.md`.                                                                          | Release Maintainer        |
| [cp/arsy/README.md](../../cp/arsy/README.md)                                                                                                                                                                                       | Restrict listed V1 resource kinds to the 7 active kinds (`docker`, `dockercompose`, `systemd`, `dir`, `file`, `backup`, `cert`) matching `ARSY-HOST-AGENT-V1.md` and `unsupported.go`.  | Control Plane Lead        |
| [00-ENGINE-CONTRACT.md](../dna/00-ENGINE-CONTRACT.md), [docs/dna/README.md](../dna/README.md)                                                                                                                                      | Reconcile _"do not add Radix"_ against the 20 `@radix-ui/react-*` deps in `packages/ui/package.json`; map world assignments to `apps/web`.                                              | UI / Design Lead          |
| [services/memory/README.md](../../services/memory/README.md)                                                                                                                                                                       | Update standalone-repo phrasing to Zone C monorepo context (`services/memory`).                                                                                                         | Memory Service Lead       |
| [WORK_PLAN.md](../../WORK_PLAN.md)                                                                                                                                                                                                 | Re-encode from UTF-16LE/NUL bytes to UTF-8 and resolve broken reference to deleted root `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md` (requires `@bjo163` confirmation on dirty root deletions). | Product Owner (`@bjo163`) |

### Wave 2 (P1) — Non-Destructive Historical & Scope Header Banners

Prepend explicit `HISTORICAL` / `SUPERSEDED` / `ENGINE-SCOPED` banner headers (without rewriting original body text) to:

- [RUNTIME-SERVICE-INVENTORY.md](../architecture/RUNTIME-SERVICE-INVENTORY.md) (§1–4 pre-Wave-0 snapshot vs. Compose/Arsy updates)
- [ATOMIC-UI-AUDIT.md](../ui/ATOMIC-UI-AUDIT.md) (point-in-time snapshot @ `44b1a70`; `DEF-01` resolved)
- [DNA_SKIN_SYSTEM_PLAN.md](../dna/DNA_SKIN_SYSTEM_PLAN.md) (historical planning baseline)
- [2026-11-11-arsy-control-plane-design.md](../superpowers/specs/2026-11-11-arsy-control-plane-design.md) (`SUPERSEDED` by `ARSY-HOST-AGENT-V1.md`)
- [docs/blueprint/README.md](../blueprint/README.md) (explicit `ARCH-ADR-006` monorepo mapping banner)
- Absorbed `engines/*/AGENTS.md` files (9 files — explicit subordination banner pointing to root `AGENTS.md`).

### Wave 3 (P1) — Backfill Missing Unit `README.md` Files

Create concise, code-verified `README.md` files (commands, exports, ports, owner, and link to canonical architecture) in:

1. Primary apps: `apps/web/README.md`, `apps/api/README.md`
2. Undocumented Rust services: `services/radius/README.md`, `services/storage/README.md`
3. Shared packages (`packages/*`): `ai`, `assets`, `avatars`, `canon`, `cli`, `contracts`, `core`, `errors`, `eslint-config`, `mid`, `schema`, `types`, `typescript-config`, `ui`.

### Wave 4 (P2) — Duplicate, Orphan & Embedded-Code Hygiene

1. Register orphan docs (`docs/governance/*`, `docs/architecture/decisions/2026-11-12-riot-intelligence-baseline.md`, `docs/orm-domain-backlog.md`, `docs/superpowers/**`, `research/*.md`) in a canonical Repository Documentation Index linked from root `README.md`.
2. Decide owner disposition for the 110 mirrored `VISUAL-*` `.md`/`.yaml` checkpoint files across `docs/blueprint/17-genesis/` and `docs/design/moonwitness-design-system/docs/` (archive or retain as frozen audit logs).
3. Decide owner disposition for the duplicate `GOVERNANCE.md` in `engines/empire-origin/` and the embedded `.tsx`/`.storybook`/`.github/workflows/` code living inside `docs/design/moonwitness-design-system/` and `docs/blueprint/.github/`.

### Wave 5 (P2) — Zero-Dependency Automated Validation Gate

1. Implement `scripts/doc-check.mjs` (Node.js standard library only) enforcing `DOC-CHK-001..006` from [DOCUMENTATION_VALIDATION_CONTRACT.md](./DOCUMENTATION_VALIDATION_CONTRACT.md) plus UTF-8/no-NUL encoding checks.
2. Wire `pnpm docs:check` into [scripts/gatecheck.mjs](../../scripts/gatecheck.mjs) (`quick` and `push` gates) and [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

---

## 3. Risks, Dependencies & Rollback

| Risk / Dependency                                                                                                                                                                                                   | Mitigation                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Ratification Blocker:** `MW-GOV-DOC-001..005` remain `PROPOSED` until `@bjo163` approves them.                                                                                                                    | Do not merge Wave 1–5 changes as binding policy until owner ratifies `MW-GOV-DOC-001..005`.                     |
| **Pre-Existing Dirty Working Tree:** `LOCAL-AI-MASTER-PROMPT.md`, `MOONWITNESS-AUDIT-REPORT-2026-11-18.md`, `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md`, and code files in `apps/` / `packages/` have uncommitted changes. | Keep governance/doc PRs isolated (`git add docs/governance/ AGENTS.md`) without sweeping unrelated dirty paths. |
| **Broken Relative Links During Moves:** Moving or archiving files could break inbound links across `docs/`.                                                                                                         | Wave 1–3 avoid moving any files; Wave 4 requires `DOC-CHK-003` link verification in the same commit.            |

---

## 4. Exact Next Execution Task (Awaiting Approval)

**Task ID:** `GOV-WAVE-1` (Wave 1 P0 Contradiction Alignment + Ratification)  
**Prerequisite:** Product Owner (`@bjo163`) approves `MW-GOV-DOC-001..005` (`PROPOSED` -> `ACCEPTED`) and confirms disposition of `WORK_PLAN.md` and the three deleted root `.md` files.  
**Bounded Action:** Execute Wave 1 in-place updates only (no file moves or deletions, no code edits), then verify with `pnpm format:check`, `git diff --check`, and `pnpm branch:guard`.
