---
contract_id: "MW-GOV-AUD-001"
title: "MoonWitness Repository-Wide Documentation Audit Report"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Evidence-based audit of all 3,716 Markdown files and 113 docs/ YAML/JSON specs across A-L-L-A-H/moonwitness@dev"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/governance/DOCUMENTATION-INVENTORY.json"
---

# MoonWitness Repository-Wide Documentation Audit Report

## 1. Executive Summary & Quantitative Landscape

**Repository & Branch Audited:** `A-L-L-A-H/moonwitness` (`dev` @ `5d1eb75` + working tree governance additions)  
**Machine-Readable Companion Ledger:** [DOCUMENTATION-INVENTORY.json](./DOCUMENTATION-INVENTORY.json)

### Quantitative Breakdown (Observed on Disk)

- **Total Markdown Files Audited:** **3,716** (`771` itemized governance/contract/ADR/README/architecture/design docs + `2,945` bulk engine/chronicle files aggregated by collection)
- **Additional `docs/` YAML/JSON Specifications:** **113** (`92` `.yaml`, `4` `.yml`, `17` `.json`)
- **Total Itemized Records in [DOCUMENTATION-INVENTORY.json](./DOCUMENTATION-INVENTORY.json):** **884**

| Top-Level Scope | Markdown Count | Notes                                                                                                                                                                                                                                                   |
| --------------- | -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<root>`        |              5 | `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `WORK_PLAN.md` (3 other root `.md` files deleted in dirty working tree)                                                                                                                    |
| `.github/`      |              1 | `.github/pull_request_template.md`                                                                                                                                                                                                                      |
| `docs/`         |            276 | `governance` (5 pre-audit), `architecture` (16), `blueprint` (87 MD / 196 total), `constitution` (44), `design` (57 MD / 141 total), `dna` (13), `engineering` (9), `legacy-harvest` (18 MD / 34 total), `superpowers` (7), `ui` (2), `<docs-root>` (4) |
| `apps/`         |             20 | Strictly `apps/rocksoul/` (20 MD). `apps/web/` and `apps/api/` have **0 Markdown files**.                                                                                                                                                               |
| `packages/`     |              4 | `orm/README.md`, `addons/timeline/README.md`, `ai/docs/openai-compatible-protocol.md`, `assets/references/REFERENCES.md`                                                                                                                                |
| `services/`     |              9 | `memory/` (7 MD), `snmp-poller/README.md`, `syslog/README.md`. `radius/` and `storage/` have **0 Markdown files**.                                                                                                                                      |
| `cp/`           |              1 | `cp/arsy/README.md`                                                                                                                                                                                                                                     |
| `research/`     |              4 | `architecture-decisions.md`, `frontend-technology.md`, `motion-engineering.md`, `visual-rendering.md`                                                                                                                                                   |
| `engines/`      |          2,254 | 17 engine directories (largest: `empire-origin` 943, `rocksoul-domains` 261, `crayon` 217, `moonframe` 160, `ontology` 141)                                                                                                                             |
| `content/`      |          1,142 | `content/chronicles/*` narrative manuscripts & historical repo docs                                                                                                                                                                                     |

### Classification Summary Across 884 Itemized Records

- `CANONICAL`: **67**
- `ACTIVE_REFERENCE`: **389**
- `PROPOSED`: **35**
- `HISTORICAL`: **169**
- `ARCHIVED`: **94**
- `DUPLICATE_CANDIDATE`: **113** (`110` paired `VISUAL-*` `.md`/`.yaml` checkpoint files, `1` deprecated checklist pointer, `2` duplicate `GOVERNANCE.md` files)
- `NEEDS_REVIEW`: **17** (active authoritative documents containing verified contradictions with code or `ARCH-ADR-006`)

---

## 2. Scope-by-Scope Audit Findings

### 2.1 Repository Root (`/`)

1. **[AGENTS.md](../../AGENTS.md)** (`CANONICAL`) — Enforces `dev`-only local checkout and integrates `MW-GOV-DOC-001..005`. Matches [branch-guard.mjs](../../scripts/branch-guard.mjs) and `.githooks/pre-push`.
2. **[README.md](../../README.md)** (`NEEDS_REVIEW`) — Lists `apps/memory/` in topology (line 12), whereas `ADR-006` relocated it to [services/memory/](../../services/memory/README.md), and omits `apps/rocksoul` in container/compose summaries while `apps/` actually contains `api`, `rocksoul`, and `web`.
3. **[CONTRIBUTING.md](../../CONTRIBUTING.md)** (`NEEDS_REVIEW`) — Line 21 instructs `git switch -c feat/your-change`, directly conflicting with root [AGENTS.md](../../AGENTS.md) for AI agents (`dev`-only locally). Human vs. AI branching workflows require explicit disambiguation.
4. **[WORK_PLAN.md](../../WORK_PLAN.md)** (`NEEDS_REVIEW`) — Stored with NUL bytes / UTF-16LE BOM (`43,441` bytes), causing UTF-8 text readers to reject it as binary (`application/octet-stream`), and its header cites `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md`, which is currently marked `D` (deleted) alongside `LOCAL-AI-MASTER-PROMPT.md` and `MOONWITNESS-AUDIT-REPORT-2026-11-18.md` in `git status`.
5. **[CHANGELOG.md](../../CHANGELOG.md)** (`CANONICAL`) — Synchronized at `0.13.0` (`2026-11-18`) with [package.json](../../package.json) and [.release-please-manifest.json](../../.release-please-manifest.json).

### 2.2 Active Architecture (`docs/architecture/`, 16 Files)

1. **[adr-006-three-app-topology-and-trust-zones.md](../architecture/adr-006-three-app-topology-and-trust-zones.md)** (`CANONICAL`) — Confirmed against disk: `apps/` holds strictly `api`, `rocksoul`, `web` (enforced by `EXPECTED_APP_WORKSPACES` in [gatecheck.mjs](../../scripts/gatecheck.mjs#L368)), `packages/cli` and `packages/mid` exist, and `services/memory` exists.
2. **[VPS-TOPOLOGY-OPERATIONS.md](../architecture/VPS-TOPOLOGY-OPERATIONS.md)** & **[DEPLOYMENT-RUNBOOK.md](../architecture/DEPLOYMENT-RUNBOOK.md)** (`NEEDS_REVIEW`) — Both depict a standalone `allah -> apps/a-l-l-a-h :3003` container, and `DEPLOYMENT-RUNBOOK.md` (line 103) checks `GET /api/health`. In reality, [Caddyfile](../../Caddyfile#L24-L28) routes `a-l-l-a-h.com` to `web:3000`, [docker-compose.yml](../../docker-compose.yml) defines no `allah` service, and Core API healthcheck polls `http://127.0.0.1:3002/api/v1/healthz` ([docker-compose.yml](../../docker-compose.yml#L109)).
3. **[DATA-OWNERSHIP-BACKUP-RESTORE.md](../architecture/DATA-OWNERSHIP-BACKUP-RESTORE.md)** (`NEEDS_REVIEW`) — Claims `apps/api` uses SQLite `moonwitness.db` on VPS and references `apps/mid` and `apps/memory`, whereas [docker-compose.yml](../../docker-compose.yml#L78) and `ADR-006 §3.1` configure PostgreSQL (`postgres` service) for production `DATABASE_URL` and [postgres.driver.ts](../../packages/orm/src/drivers/postgres.driver.ts) exists in `@moonwitness/orm`.
4. **[RUNTIME-SERVICE-INVENTORY.md](../architecture/RUNTIME-SERVICE-INVENTORY.md)** (`NEEDS_REVIEW` / `HISTORICAL` in §1–4) — Sections 1–4 snapshot 8 apps, cite `cp/arsy` at `cmd/arsyd` `:8090`, and claim `docker-compose.yml` lacks `storage` (`MW-0501`). The appended Wave 0 table reconciles to 3 apps, [docker-compose.yml](../../docker-compose.yml#L218-L246) now defines `storage`, and [cp/arsy/cmd/arsy/main.go](../../cp/arsy/cmd/arsy/main.go) / [cp/arsy/README.md](../../cp/arsy/README.md#L6) use `:8787`.
5. **[adr-008-riot-intelligence-baseline.md](../architecture/adr-008-riot-intelligence-baseline.md)** (migrated from `decisions/2026-11-12-riot-intelligence-baseline.md` in Wave 4 per `DOC-ADR-003`) — Reconciled against subsequent delivery of [riot-ai.routes.ts](../../apps/api/src/interface/routes/riot-ai.routes.ts) and indexed in [engineering-foundation.md](../architecture/engineering-foundation.md).

### 2.3 Operational Engineering (`docs/engineering/`, 9 Files)

1. **[CI-CD.md](../engineering/CI-CD.md)** (`NEEDS_REVIEW`) — Line 18 asserts _"There is exactly one CI workflow"_, whereas `.github/workflows/` contains **20 workflow files**. Line 39 references `promote.yml`, whereas the actual workflow filename is [auto-promote.yml](../../.github/workflows/auto-promote.yml).
2. **[DEPLOYMENT.md](../engineering/DEPLOYMENT.md)** (`NEEDS_REVIEW`) — Lines 10–13 list `allah` (`apps/a-l-l-a-h :3003`) and SQLite `moonwitness-data` for `apps/api`, contradicting `Caddyfile` and `docker-compose.yml`.
3. **[RELEASING.md](../engineering/RELEASING.md)** (`NEEDS_REVIEW`) — Lines 10–11 state `.release-please-manifest.json` is `0.1.0` with _"no prior tagged release"_, whereas [.release-please-manifest.json](../../.release-please-manifest.json) and [package.json](../../package.json#L3) are `0.13.0`, and [CHANGELOG.md](../../CHANGELOG.md#L10) documents releases through `0.13.0`.
4. **[SECURITY.md](../engineering/SECURITY.md)** & **[RUNBOOK.md](../engineering/RUNBOOK.md)** (`NEEDS_REVIEW`) — `SECURITY.md` lines 15–16 cite SQLite sessions and Caddy routing to `allah`; `RUNBOOK.md` backup steps cover SQLite/libSQL only without addressing the Compose `postgres` service.
5. **[MID-AUDIENCE-POLICY.md](../engineering/MID-AUDIENCE-POLICY.md)**, **[BRANCHING.md](../engineering/BRANCHING.md)**, **[GATECHECK.md](../engineering/GATECHECK.md)**, **[API-VERSIONING.md](../engineering/API-VERSIONING.md)** (`CANONICAL`) — Verified aligned with [mid-jwt.ts](../../apps/api/src/middleware/mid-jwt.ts), [db.ts](../../packages/mid/src/db.ts), [branch-guard.mjs](../../scripts/branch-guard.mjs), and [gatecheck.mjs](../../scripts/gatecheck.mjs).

### 2.4 Constitution, Blueprint, Design, DNA & UI (`docs/`)

1. **`docs/constitution/` (44 files)** (`CANONICAL` Tier 0) — Ecosystem constitutional layer (`A-L-L-A-H/master-docs` @ `43b149d`). Multi-repo target paths (`A-L-L-A-H/rocksoul-dx`) map to `apps/rocksoul` under `ADR-006`.
2. **`docs/blueprint/` (87 MD + 109 YAML/JSON = 196 files)** (`HISTORICAL` / Frozen Gen2 Reference) — Contains **49** `VISUAL-*.md` and **8** `VISUAL-*.yaml` checkpoint files under `docs/blueprint/17-genesis/`, a deprecated root `GENESIS-READINESS-CHECKLIST.md` pointer, non-canonical `ROCKSOUL-LAZARUS-*` drafts in `08-ai/`, and an embedded CI workflow file ([blueprint-ci.yml](../blueprint/.github/workflows/blueprint-ci.yml)).
3. **`docs/design/moonwitness-design-system/` (57 MD + 84 TSX/JSX/CSS/JSON/PNG/config = 141 files)** (`HISTORICAL` / `DUPLICATE_CANDIDATE`) — Contains **47** `VISUAL-*.md` and **6** `VISUAL-*.yaml` files mirroring `docs/blueprint/17-genesis/VISUAL-*`, plus an embedded `package.json`, `pnpm-workspace.yaml`, `.storybook/`, `.github/workflows/`, and `src/*.tsx` inside `docs/design/`.
4. **[00-ENGINE-CONTRACT.md](../dna/00-ENGINE-CONTRACT.md)** (`NEEDS_REVIEW`) — Lines 47 and 54 mandate _"native-first"_ primitives and _"do not add Radix"_, directly contradicting [packages/ui/package.json](../../packages/ui/package.json#L34-L53) (20 `@radix-ui/react-*` runtime dependencies) and [DNA_SKIN_SYSTEM_PLAN.md](../dna/DNA_SKIN_SYSTEM_PLAN.md#L30).
5. **[docs/dna/README.md](../dna/README.md)** (`NEEDS_REVIEW`) — Lines 23–26 reference pre-consolidation apps (`Gate`, `Dock`, `Headquarter`, `ID`, `E-ISP`, `WORLD OBSERVATORY`).
6. **[ATOMIC-UI-AUDIT.md](../ui/ATOMIC-UI-AUDIT.md)** (`HISTORICAL`) — Point-in-time audit (`44b1a70`); `DEF-01` claims `packages/ui/src/dna/index.ts` is missing (`ENOENT`), whereas [packages/ui/src/dna/index.ts](../../packages/ui/src/dna/index.ts) and `canonical.ts` now exist on disk and match [ATOMIC-UI-GUIDE.md](../ui/ATOMIC-UI-GUIDE.md).
7. **`docs/superpowers/` (7 files)**, **`docs/orm-domain-backlog.md`**, **`research/` (4 files)** — Orphan specs/plans unlinked from [DOCUMENT-INDEX.md](../constitution/GOVERNANCE/DOCUMENT-INDEX.md). Notably, [2026-11-11-arsy-control-plane-design.md](../superpowers/specs/2026-11-11-arsy-control-plane-design.md) includes `cron`, `user`, `firewall`, which are disabled in V1 by [ARSY-HOST-AGENT-V1.md](../architecture/ARSY-HOST-AGENT-V1.md).

### 2.5 Applications, Packages, Services, Control Plane & Engines

1. **Missing Runtime Documentation (`apps/`, `packages/`, `services/`):**
   - `apps/web/` (0 MD files) and `apps/api/` (0 MD files) lack `README.md` or local `docs/`, whereas `apps/rocksoul/` has 20 well-structured docs.
   - `services/radius/` (0 MD files) and `services/storage/` (0 MD files) lack `README.md`.
   - 13 shared packages (`ai`, `assets`, `avatars`, `canon`, `cli`, `contracts`, `core`, `errors`, `eslint-config`, `mid`, `schema`, `types`, `typescript-config`, `ui`) lack a root `README.md`.
2. **[packages/orm/README.md](../../packages/orm/README.md)** (`NEEDS_REVIEW`) — Documents `LibSqlDriver` (SQLite/libSQL) only and omits [postgres.driver.ts](../../packages/orm/src/drivers/postgres.driver.ts).
3. **[cp/arsy/README.md](../../cp/arsy/README.md)** (`NEEDS_REVIEW`) — Line 86 advertises `user, cron, firewall, portforward, network, mount, ssh, gitdeploy, alert, webhook, package, kubernetes`, directly contradicting [ARSY-HOST-AGENT-V1.md](../architecture/ARSY-HOST-AGENT-V1.md#L31-L48) and [unsupported.go](../../cp/arsy/internal/resources/unsupported.go#L81-L95) where all 12 kinds fail explicitly as unsupported in V1.
4. **[services/memory/README.md](../../services/memory/README.md)** (`NEEDS_REVIEW`) — Retains standalone-repo phrasing (_"Clone this repository"_) instead of reflecting Zone C monorepo location under `services/memory` (`ADR-006`).
5. **`engines/` (2,254 MD files) & `content/chronicles/` (1,142 MD files):**
   - Preserve native co-location (`engines/mtime`, `engines/corpus-srgbl`, `engines/crayon`, `engines/divine-text`, `engines/prophetic`, `engines/witness-semantic`, `engines/dhgs`, `engines/ontology`, `engines/aqel`, `engines/moonframe`, `engines/rocksoul-*`, etc.).
   - **Subordinate `AGENTS.md` conflicts:** 9 engine `AGENTS.md` files (`engines/moonframe/AGENTS.md`, `engines/chronicle-os/moonwitness-os/AGENTS.md`, `engines/empire-origin/empire-of-light-rust-docs/AGENTS.md`, `engines/empire-origin/allah-com/AGENTS.md` + 5 `apps/*/AGENTS.md`) contain legacy standalone branch/CI rules overridden by root [AGENTS.md](../../AGENTS.md).
   - **Exact engine duplicate:** [allah-foundation/docs/GOVERNANCE.md](../../engines/empire-origin/allah-foundation/docs/GOVERNANCE.md) and [empire-of-the-light/docs/GOVERNANCE.md](../../engines/empire-origin/empire-of-the-light/docs/GOVERNANCE.md) are identical 23-line copies.

---

## 3. Ten-Point Phase 3 Findings Synthesis

| #      | Audit Category                               | Verified Findings (Concrete File-Path Evidence)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **Competing Sources of Truth**               | Six governance/contract layers (`docs/governance/`, `docs/constitution/`, `docs/blueprint/`, `engines/empire-origin/allah-com/DOCUMENTATION_CONTRACT.md`, `engines/*/GOVERNANCE.md`, root `AGENTS.md`) + 4 UI token authorities documented in `docs/ui/ATOMIC-UI-AUDIT.md`.                                                                                                                                                                                                                                                                    |
| **2**  | **Docs Contradicting Code**                  | `cp/arsy/README.md` vs. `cp/arsy/internal/resources/unsupported.go`; `docs/dna/00-ENGINE-CONTRACT.md` vs. `packages/ui/package.json` (20 Radix packages); `docs/engineering/CI-CD.md` ("1 workflow") vs. 20 workflows in `.github/workflows/`; `docs/engineering/RELEASING.md` (`0.1.0`) vs. `package.json` (`0.13.0`); `VPS-TOPOLOGY-OPERATIONS.md`/`DEPLOYMENT.md` (`allah:3003`, `/api/health`) vs. `Caddyfile` & `docker-compose.yml` (`web:3000`, `/api/v1/healthz`, `postgres`); `packages/orm/README.md` omitting `postgres.driver.ts`. |
| **3**  | **Docs Contradicting Accepted ADRs**         | `README.md`, `RUNTIME-SERVICE-INVENTORY.md` (§1–4), `DATA-OWNERSHIP-BACKUP-RESTORE.md`, `docs/dna/README.md`, `docs/blueprint/README.md`, and `docs/constitution/README.md` still depict multi-app/multi-repo topologies superseded by `ARCH-ADR-006`; `2026-11-11-arsy-control-plane-design.md` conflicts with `ARSY-HOST-AGENT-V1.md`.                                                                                                                                                                                                       |
| **4**  | **Duplicate Documentation**                  | 110 mirrored `VISUAL-*` `.md`/`.yaml` checkpoint files across `docs/blueprint/17-genesis/` and `docs/design/moonwitness-design-system/docs/`; exact 23-line duplicate `GOVERNANCE.md` in `engines/empire-origin/allah-foundation/docs/` and `engines/empire-origin/empire-of-the-light/docs/`; deprecated pointer `docs/blueprint/GENESIS-READINESS-CHECKLIST.md`.                                                                                                                                                                             |
| **5**  | **Orphan Docs Without Index**                | `docs/architecture/decisions/2026-11-12-riot-intelligence-baseline.md`, `docs/orm-domain-backlog.md`, `docs/superpowers/**` (7 files), `research/*.md` (4 files), `docs/design/moonwitness-design-system/`, and `docs/governance/` (awaiting root README/index link after ratification).                                                                                                                                                                                                                                                       |
| **6**  | **Missing Runtime Docs**                     | Zero `README.md` / `docs/` in `apps/web/`, `apps/api/`, `services/radius/`, `services/storage/`, and 13 of 15 shared packages in `packages/*`.                                                                                                                                                                                                                                                                                                                                                                                                 |
| **7**  | **Unclear Ownership Boundaries**             | Root `WORK_PLAN.md` encoding + reference to deleted `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md`; pre-existing dirty/deleted root audit docs; embedded source code/workflows inside `docs/design/moonwitness-design-system/` and `docs/blueprint/.github/`.                                                                                                                                                                                                                                                                                            |
| **8**  | **Historical Material Presented as Current** | `docs/ui/ATOMIC-UI-AUDIT.md` (outdated `DEF-01`), `docs/dna/DNA_SKIN_SYSTEM_PLAN.md`, `docs/architecture/RUNTIME-SERVICE-INVENTORY.md` (§1–4), `engines/*/AGENTS.md` (9 files), and `docs/blueprint/` lacking prominent monorepo-superseded banners at top.                                                                                                                                                                                                                                                                                    |
| **9**  | **Native-Scope Docs to Keep Co-Located**     | All 17 `engines/*` directories (`2,254` MD files), `content/chronicles/` (`1,142` MD files), `apps/rocksoul/docs/` (`20` MD files), `services/memory/docs/` (`7` MD files), `services/{snmp-poller,syslog}/README.md`, and `cp/arsy/README.md`.                                                                                                                                                                                                                                                                                                |
| **10** | **Automated Validation Opportunities**       | Zero-dependency Node script (`scripts/doc-check.mjs`) enforcing `DOC-CHK-001..006` (frontmatter metadata, 8-status allowlist, repo-relative links, single H1, UTF-8/no-NUL encoding check, quarantine string check) wired into `scripts/gatecheck.mjs` without new dependencies.                                                                                                                                                                                                                                                               |
