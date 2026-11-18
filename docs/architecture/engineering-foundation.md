# Engineering foundation

This document is the entry point for how MoonWitness is engineered: branches, gates, CI, releases,
and the parts that are deliberately not built yet.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Branch governance   dev (integration) / main (release) /     │
│                     master (frozen)                          │
├──────────────────────────────────────────────────────────────┤
│ Local gate          gate:quick → gate:local → gate:push →    │
│                     gate:release, plus gate:doctor           │
├──────────────────────────────────────────────────────────────┤
│ Remote CI           ci.yml, branch-policy.yml, codeql.yml    │
├──────────────────────────────────────────────────────────────┤
│ Release             Release Please → CHANGELOG → vX.Y.Z tag  │
├──────────────────────────────────────────────────────────────┤
│ Deployment          tag-driven deploy.yml, not yet enabled   │
└──────────────────────────────────────────────────────────────┘
```

## Monorepo layout

| Path                                                  | Contents                                                                                                | Entry Point                                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web`                                            | Next.js App Router frontend (Sanctuary + Operations)                                                    | [apps/web/README.md](../../apps/web/README.md)                                                                                                                                             |
| `apps/api`                                            | Fastify API, Postgres/libSQL ORM, MID OIDC host, telemetry proxies                                      | [apps/api/README.md](../../apps/api/README.md)                                                                                                                                             |
| `apps/rocksoul`                                       | Tauri 2 + React 19 local-first desktop workbench (Zone C)                                               | [apps/rocksoul/README.md](../../apps/rocksoul/README.md)                                                                                                                                   |
| `services/radius`, `snmp-poller`, `syslog`, `storage` | Rust Axum `--profile ops` telemetry & S3 storage workers                                                | [radius](../../services/radius/README.md) · [storage](../../services/storage/README.md) · [snmp-poller](../../services/snmp-poller/README.md) · [syslog](../../services/syslog/README.md)  |
| `services/memory`                                     | Zone C local memory vault (FastAPI + SQLite FTS5 + LanceDB)                                             | [services/memory/README.md](../../services/memory/README.md)                                                                                                                               |
| `cp/arsy`                                             | Go host reconciler (`7` active V1 resource kinds)                                                       | [cp/arsy/README.md](../../cp/arsy/README.md)                                                                                                                                               |
| `packages/*`                                          | Shared TypeScript packages, addons, ORM (`PostgresDriver` / `LibSqlDriver` / `D1Driver`), UI DNA engine | [ui](../../packages/ui/README.md) · [orm](../../packages/orm/README.md) · [addons](../../packages/addons/README.md) · [governance matrix](../governance/DOCUMENTATION-OWNERSHIP-MATRIX.md) |
| `engines/*`, `content/chronicles/*`                   | Absorbed domain engines & narrative corpus (`17` engines)                                               | [CONSOLIDATION-CATALOG.md](../CONSOLIDATION-CATALOG.md)                                                                                                                                    |
| `scripts/`                                            | Gate engine, doc governance check (`doc-check.mjs`), commitlint, branch guard                           | [GATECHECK.md](../engineering/GATECHECK.md)                                                                                                                                                |

Builds and checks run through Turborepo (`turbo run lint|typecheck|test|build`), so a package is
only rebuilt when its inputs change.

## Non-negotiables

1. **No fake green.** A gate that cannot run reports `BLOCKED`. A step that does not apply reports
   `NOT APPLICABLE`. Neither is reported as `PASS`.
2. **Exit codes are preserved.** No `|| true`, no piping a failing command into `tail`.
3. **`main` and `master` are not written by automation.** Promotion is a reviewed PR.
4. **Conventional Commits.** The changelog, the version bump, and the branch policy all depend on
   them.
5. **Minimal dependencies.** A new dependency needs a reason that survives review.

## Architecture Decision Records & Platform Hubs (Level 1)

### Architecture ADRs (`ARCH-ADR-*`)

- [ADR-001: API Versioning](./adr-001-api-versioning.md)
- [ADR-002: Shared Packages](./adr-002-shared-packages.md)
- [ADR-003: Design Tokens](./adr-003-design-tokens.md)
- [ADR-004: Addon System](./adr-004-addon-system.md)
- [ADR-005: Visual Regression](./adr-005-visual-regression.md)
- [ADR-006: Three-App Topology & Trust Zones](./adr-006-three-app-topology-and-trust-zones.md)
- [ADR-007: RockSoul Local Execution & Data Boundary](./adr-007-rocksoul-local-execution-and-data-boundary.md)
- [ADR-008: RIOT Intelligence Architecture Baseline](./adr-008-riot-intelligence-baseline.md)

### Architecture, Operations, Design & Domain Specs

- **Operations & Topology:** [PLATFORM-ARCHITECTURE-AUDIT.md](./PLATFORM-ARCHITECTURE-AUDIT.md) · [PLATFORM-COMPONENT-INVENTORY.json](./PLATFORM-COMPONENT-INVENTORY.json) · [APPLICATION-INTEGRATION-MATRIX.md](./APPLICATION-INTEGRATION-MATRIX.md) · [ENGINE-PACKAGE-INTEGRATION-MATRIX.md](./ENGINE-PACKAGE-INTEGRATION-MATRIX.md) · [HYBRID-PAAS-READINESS-ASSESSMENT.md](./HYBRID-PAAS-READINESS-ASSESSMENT.md) · [PLATFORM-TARGET-ARCHITECTURE.md](./PLATFORM-TARGET-ARCHITECTURE.md) · [PLATFORM-ENGINEERING-ROADMAP.md](./PLATFORM-ENGINEERING-ROADMAP.md) · [ARSY-HOST-AGENT-V1.md](./ARSY-HOST-AGENT-V1.md) · [DATA-OWNERSHIP-BACKUP-RESTORE.md](./DATA-OWNERSHIP-BACKUP-RESTORE.md) · [DEPLOYMENT-RUNBOOK.md](./DEPLOYMENT-RUNBOOK.md) · [VPS-TOPOLOGY-OPERATIONS.md](./VPS-TOPOLOGY-OPERATIONS.md) · [RUNTIME-SERVICE-INVENTORY.md](./RUNTIME-SERVICE-INVENTORY.md) · [RELEASE-PROVENANCE.md](./RELEASE-PROVENANCE.md) · [REPO-SIZE-AUDIT.md](./REPO-SIZE-AUDIT.md)
- **Design & UI:** [docs/dna/README.md](../dna/README.md) · [docs/dna/00-ENGINE-CONTRACT.md](../dna/00-ENGINE-CONTRACT.md) · [docs/ui/ATOMIC-UI-GUIDE.md](../ui/ATOMIC-UI-GUIDE.md) · [docs/design/moonwitness-design-system/README.md](../design/moonwitness-design-system/README.md)
- **Backlogs & Research Inputs (`EVIDENCE:PROPOSED`):** [docs/orm-domain-backlog.md](../orm-domain-backlog.md) · [research/architecture-decisions.md](../../research/architecture-decisions.md) · [research/frontend-technology.md](../../research/frontend-technology.md) · [research/motion-engineering.md](../../research/motion-engineering.md) · [research/visual-rendering.md](../../research/visual-rendering.md)
- **Superpowers Design & Plan Records:** [arsy-control-plane](../superpowers/specs/2026-11-11-arsy-control-plane-design.md) · [frontend-design-system-spec](../superpowers/specs/2026-11-11-frontend-design-system-design.md) · [living-story-console-spec](../superpowers/specs/2026-11-16-living-story-console-design.md) · [addon-orm-plan](../superpowers/plans/2026-11-11-addon-framework-orm-blueprint.md) · [frontend-design-plan](../superpowers/plans/2026-11-11-frontend-design-system.md) · [meta-model-plan](../superpowers/plans/2026-11-11-meta-model-driven-framework.md) · [living-story-pilot](../superpowers/plans/2026-11-16-living-story-console-pilot.md) · [odoo-plus-wave-1](../superpowers/plans/2026-11-18-odoo-plus-wave-1-core-engine.md)

## Where to read next

- [Documentation Governance Contract](../governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md) — ownership, lifecycle, and validation rules
- [BRANCHING.md](../engineering/BRANCHING.md) — topology and promotion
- [GATECHECK.md](../engineering/GATECHECK.md) — gate commands, states, guarantees
- [CI-CD.md](../engineering/CI-CD.md) — workflows, permissions, required checks
- [RELEASING.md](../engineering/RELEASING.md) — Release Please, versioning
- [RUNBOOK.md](../engineering/RUNBOOK.md) — runtime health/readiness probes and backup procedures
- [DEPLOYMENT.md](../engineering/DEPLOYMENT.md) — deploy contract, enabling steps, rollback
- [SECURITY.md](../engineering/SECURITY.md) — controls, reporting, known gaps
- [MID-AUDIENCE-POLICY.md](../engineering/MID-AUDIENCE-POLICY.md) — OIDC audience allowlist policy
- [API-VERSIONING.md](../engineering/API-VERSIONING.md) — `/api/v1` contract versioning
