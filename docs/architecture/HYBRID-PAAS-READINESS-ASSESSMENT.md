---
title: "Hybrid Mini-PaaS Readiness Assessment"
status: "PROPOSED"
owner: "Repository Standards & Principal Architecture"
last_reviewed: "2026-11-18"
---

# Hybrid Mini-PaaS Readiness Assessment

> Post-P0/P1/P2 reassessment on branch `dev` (`2026-11-18`, evolved from `HEAD = 5c389090`). Governed by [ADR-006](./adr-006-three-app-topology-and-trust-zones.md) and [PLATFORM-ARCHITECTURE-AUDIT.md](./PLATFORM-ARCHITECTURE-AUDIT.md).

## 1. Explicit Scoring Methodology

Each of the **15 hybrid mini-PaaS capabilities** is scored `0–100` based strictly on code, config, build manifests, and test executions verified on `dev`:

- **Tier A — Core Security, Tenancy & Contracts (`40%` total; `8.0%` each × 5 capabilities)**
- **Tier B — Extensibility, Execution & Stateful Continuity (`39%` total; `6.5%` each × 6 capabilities)**
- **Tier C — Production Operability, Packaging & Governance (`21%` total; `5.25%` each × 4 capabilities)**

```text
Band Reference:
  0–24  Missing / Non-functional
  25–49 Fragmented / Single-node prototype only
  50–69 Functional single-tenant baseline, key blockers for multi-tenant PaaS
  70–84 Production-capable with targeted hardening needed
  85–100 Fleet / multi-tenant mini-PaaS ready
```

## 2. 15-Capability Readiness Scorecard (Post P0–P2 Implementation)

| #   | Capability                                    | Tier & Weight | Raw Score | Weighted Points | Verified Evidence & Remaining Scope                                                                                                                                                                                            |
| --- | --------------------------------------------- | ------------- | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Modularity & Service Boundaries               | A (`8.0%`)    | `80`      | `6.40`          | Trust Zones A/B/C ([ADR-006](./adr-006-three-app-topology-and-trust-zones.md)), `15` packages, `16` addons, Go `cp/arsy`, `services/storage` Dockerfile, isolated `docker-compose.memory.yml`; addons still bundled statically |
| 2   | Identity, Auth, RBAC & Trust Boundaries       | A (`8.0%`)    | `82`      | `6.56`          | `midFastifyPlugin` `/health` route collision resolved; `mid-oidc.ts` unified onto `@moonwitness/core`; non-admin `x-tenant-id` header spoofing blocked; additional frontend clients (`session.ts`/`sanctuary`) remain          |
| 3   | Multi-Tenancy & Isolation                     | A (`8.0%`)    | `62`      | `4.96`          | Framework `tenant_id` column synced across `@moonwitness/orm`, `BaseRepository`, `@moonwitness/addon-base` `/m/:model` + history guard, and `resolveRequestTenant`; Postgres RLS policies & tenant admin UI remain P3 work     |
| 4   | API Gateway / Proxy & Contract Consistency    | A (`8.0%`)    | `74`      | `5.92`          | Single `apps/web` `/api/v1` App Router proxy, dead `cloudflare-runtime.ts` removed, `control.routes.ts` V1 validated against `cp/arsy`, `@moonwitness/contracts` wired on timeline routes (remaining domain DTOs incremental)  |
| 5   | Database Ownership & Portability              | A (`8.0%`)    | `74`      | `5.92`          | `command-center` & `probes` legacy SQL arrays retired (`[]`) into `syncModels()`, additive `tenant_id` sync backfill enabled; `riotAiMigrations` & thin compatibility hooks remain                                             |
| 6   | Addon / Plugin Runtime & Registry             | B (`6.5%`)    | `78`      | `5.07`          | `AddonRuntimeController` + tenant-scoped `/m/:model` + durable `ops.job` system model + `@moonwitness/addon-base` ESLint gate enabled; remote signed plugin packs deferred to P3                                               |
| 7   | Engine Coupling & Domain Portability          | B (`6.5%`)    | `56`      | `3.64`          | `packages/addons/epistemic` consolidated onto `@moonwitness/canon/src/epistemic-evaluators.ts`; `17` `engines/*` directories remain isolated upstream R&D archives pending curated extraction (P3-1)                           |
| 8   | Async Jobs, Queues & Background Orchestration | B (`6.5%`)    | `64`      | `4.16`          | Durable ORM job queue `ops.job` (optimistic locking, retry backoff, dead-letter state, lease recovery) and SQL `createOrmRateLimitStore` (`RATE_LIMIT_STORE=orm`) verified; dedicated worker daemon / `SKIP LOCKED` future     |
| 9   | AI Runtime Portability & Supervision          | B (`6.5%`)    | `72`      | `4.68`          | `@moonwitness/ai` (`84` tests) + real allowlisted OS child-process spawn/poll/kill supervision in `apps/rocksoul` `agent_execution.rs` (`56` lib Rust tests pass); stdout streaming ring buffer & container sandbox future     |
| 10  | Control Plane (`cp/arsy`) Integration         | B (`6.5%`)    | `76`      | `4.94`          | Go `arsy` passes tested unit packages + `apps/api` fail-fast V1 resource kind checks aligned with `cp/arsy/internal/resources/unsupported.go`; single-VPS systemd scope remains                                                |
| 11  | Storage & Memory Continuity Sync              | B (`6.5%`)    | `65`      | `4.23`          | `services/storage/Dockerfile` + `.dockerignore` and `docker-compose.memory.yml` overlay validated by `docker compose config`; unified cross-node S3/continuity replication remains future work                                 |
| 12  | Observability, Telemetry & Auditability       | C (`5.25%`)   | `70`      | `3.68`          | Prometheus `/metrics` & `/api/v1/metrics`, W3C `traceparent` child-span & `x-request-id` correlation across `web` proxy -> `api` -> upstream daemons verified; external OTLP collector integration future work                 |
| 13  | Build, Packaging & Runtime Deployability      | C (`5.25%`)   | `76`      | `3.99`          | `services/storage/Dockerfile` + Compose `--profile ops` and `docker-compose.memory.yml` validated (`exit 0`), `api` bundle & `web` Next.js production build verified                                                           |
| 14  | CI/CD, Test Coverage & Quality Gates          | C (`5.25%`)   | `85`      | `4.46`          | `29/29` Vitest tasks (`790` tests), `32/32` lint/typecheck, Go `cp/arsy`, `27` `services/storage` Rust tests, `56` `rocksoul-dx` Rust lib tests, `33` `services/memory` pytests, Compose CI checks & `docs:check` active       |
| 15  | Ecosystem Boundary & Doc Governance           | C (`5.25%`)   | `88`      | `4.62`          | A-L-L-A-H Constitution isolated under `docs/constitution/`, `packages/addons/README.md` synced to all `16` live addons, `packages/orm/README.md` updated with `tenant_id`, `docs:check` clean                                  |

## 3. Aggregate Readiness Result

- **Total Weighted Score:** **`73.23 / 100` (`73.2%`)** (`29.76` Tier A + `26.72` Tier B + `16.75` Tier C; up from `51.35 / 100` prior to P0–P2 execution).
- **Classification:** **Production-Capable Core Platform with Workspace Tenant Scoping, Durable Queue Foundation & Unified Observability — P3 Multi-Node Federation Pending**
- **Go / No-Go Verdict:**
  - **GO** for operator and multi-workspace single-cluster deployment (`web` + `api` + `postgres` + `caddy` + `arsy` + `--profile ops` + optional `docker-compose.memory.yml`).
  - **NO-GO for Untrusted Public Multi-Tenant PaaS Hosting** until Postgres Row-Level Security (RLS), container/WASM untrusted code sandboxing (`P3`), and signed remote plugin distribution are implemented.
