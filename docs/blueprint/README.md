# MoonWitness Blueprint

> [!WARNING]
> **Frozen / Superseded Gen2 Architecture Pack (`EVIDENCE:HISTORICAL`, 2026-11-18):**
> This `docs/blueprint/` corpus is preserved in full as the frozen Gen2 reference blueprint (`status: HISTORICAL` / reference for historical intent). Active monorepo runtime architecture is governed by [ADR-006](../architecture/adr-006-three-app-topology-and-trust-zones.md), [engineering-foundation.md](../architecture/engineering-foundation.md), and [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md). Catalog: [DOCUMENT-CATALOG.md](./DOCUMENT-CATALOG.md).

Canonical architecture, engineering, product, UX, security, operations, and migration source of truth for the MoonWitness ecosystem.

## Status

**DESIGN FROZEN / FOUNDATION EXECUTION AUTHORIZED / CERTIFICATION PENDING**

The architectural design is frozen. The canonical Genesis readiness gate authorizes Wave 0 foundation execution, while foundation implementation evidence, implementation certification, and production certification remain incomplete. Legacy/reference repositories remain implementation evidence only for their migrated capabilities; current Gen2 repositories are the active development boundaries. Runtime, benchmark, deployment, and production certification evidence is not implied by the design freeze or foundation authorization.

## One-door principle

```text
External App / Web / SDK
          ↓
     HTTPS + OpenAPI
          ↓
    moonwitness-api
          ↓
 application capability
          ↓
       domain
```

SSE is a streaming mode of the same HTTP API. gRPC, MCP, WebSocket, GraphQL, and tRPC are conditional or non-standard adapters governed by the architecture constitution and do not replace the canonical HTTP/OpenAPI door.

## Repository model

```text
moonwitness-core
moonwitness-corpus
moonwitness-cosmic
moonwitness-crayon
moonwitness-prophetic
moonwitness-runtime
moonwitness-worker
moonwitness-api
moonwitness-sdk
moonwitness-frontend-platform
moonwitness-wheremythfadetolegend    ← primary public Web
moonwitness-web                       ← legacy / paused
moonwitness-commandcenter
moonwitness-crayon-lab
moonwitness-blueprint
```

## Public Web ownership

`ArsyBelovedLabs/moonwitness-wheremythfadetolegend` is the current primary public Web application. `ArsyBelovedLabs/moonwitness-web` is the legacy public Web application and is paused. See `01-architecture/ADR-025-PRIMARY-PUBLIC-WEB-OWNERSHIP.md`.

The primary Web has an explicit split between frozen historical repository data and live platform data:

```text
Historical / frozen
  ↓
versioned GitHub data
  ↓
StaticDataAdapter
  ↓
primary Web

Live / operational
  ↓
moonwitness-sdk / MoonClient
  ↓
moonwitness-api
  ↓
platform services + private persistence
```

The Web never connects directly to PostgreSQL and does not depend on Coolify internals or private backend credentials.

## Documentation taxonomy

- `00-constitution/` — non-negotiable platform rules, IDs, readiness, quality gates, freeze
- `01-architecture/` — system structure, golden path, boundaries, ADRs
- `02-domain/` — capabilities, bounded contexts, domain model, state/events/workflows
- `03-contracts/` — canonical schemas, compatibility, errors, idempotency
- `04-data/` — persistence, lineage, artifacts, classification, ownership
- `05-engineering/` — toolchain, environment, package engineering, supply chain
- `06-api/` — canonical HTTP/OpenAPI surface and lifecycle
- `07-ui-ux/` — portable frontend platform, design tokens, component ownership, public Web contract
- `08-ai/` — intelligence, retrieval, tools, models, evaluation, provenance/cost
- `09-security/` — identity, authorization, isolation, threat model
- `10-observability/` — telemetry, logs, metrics, traces, audit
- `11-performance/` — performance, workload, concurrency, and cost budgets
- `12-reliability/` — retries, timeouts, recovery, backup, rollback, DR
- `13-deployment/` — environments, Coolify backend deployment, Vercel Web deployment, runtime compatibility
- `14-governance/` — GitHub workflow, release controls, architecture change governance
- `15-migration/` — legacy-to-Gen2 evidence, fixtures, lifecycle, decommissioning
- `16-repositories/` — repository/package topology and dependency direction
- `17-genesis/` — canonical readiness gate plus authorized Wave 0 execution planning and certification tracking

## Canonical Genesis gate

`17-genesis/GENESIS-READINESS-CHECKLIST.md` is the only Genesis execution authorization source. The root-level `GENESIS-READINESS-CHECKLIST.md` is a deprecated compatibility pointer and must not be treated as a second gate.

Current execution state:

```text
Design freeze                  COMPLETE
Stage 1 foundation preflight   COMPLETE
Wave 0 foundation execution    AUTHORIZED / ACTIVE
Stage 2 foundation evidence    INCOMPLETE
Implementation certification   PENDING
Production certification       PENDING
```

## Canonical rules

1. One owner per capability.
2. One canonical contract per capability.
3. One canonical network door.
4. Package is the reusable unit.
5. Repository is the development boundary.
6. Service is an optional runtime boundary.
7. Database is private to its owning capability/service.
8. Adapters translate infrastructure/transport concerns and never duplicate business logic.
9. Legacy is migrated by capability and evidence, never copied wholesale.
10. Architecture changes require an explicit ADR.
11. Runtime policy is latest-supported-per-target, not blind latest-everywhere.
12. Delivery/work management uses GitHub Issues, branches, pull requests, and GitHub Actions; Plane is not part of the architecture.

## Work flow

```text
Blueprint decision
      ↓
GitHub Issue
      ↓
Branch / Pull Request
      ↓
GitHub Actions
      ↓
Verification
      ↓
Merge
      ↓
Release / Deploy
```

## Design freeze

`00-constitution/DESIGN-FREEZE-DECLARATION-V1.md` is the authoritative freeze declaration. Post-freeze changes to architecture require an explicit ADR and a corresponding update to the freeze record. Evidence/status updates that conform to the frozen architecture do not reopen the design.

## Legacy/reference audit

The following legacy/reference repositories were audited on 2026-08-30 and remain evidence sources for preserve/extract/adapt/rewrite/archive decisions:

- `bjo163/moonwitness@dev`
- `bjo163/moonwitness-corpus@dev`
- `bjo163/cosmic@dev`
- `bjo163/ALLAH-CRAYON-RGBL-ENGINE@dev`
- `bjo163/propetic@main`

They do not override the current Gen2 repository topology or canonical ownership decisions.
