---
title: "Hybrid Mini-PaaS Readiness Assessment"
status: "PROPOSED"
owner: "Repository Standards & Principal Architecture"
last_reviewed: "2026-11-18"
---

# Hybrid Mini-PaaS Readiness Assessment

> Audit baseline: branch `dev`, `HEAD = 5c38909019d1034fb671bd64344dc35b16bd29a4` (`2026-11-18`). Governed by [ADR-006](./adr-006-three-app-topology-and-trust-zones.md) and [PLATFORM-ARCHITECTURE-AUDIT.md](./PLATFORM-ARCHITECTURE-AUDIT.md).

## 1. Explicit Scoring Methodology

Each of the **15 hybrid mini-PaaS capabilities** is scored `0–100` based strictly on code, config, build manifests, and test executions observed on `HEAD` (`5c389090`):

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

## 2. 15-Capability Readiness Scorecard

| #   | Capability                                    | Tier & Weight | Raw Score | Weighted Points | Evidence Summary & Primary Blocker                                                                                                                                                                                |
| --- | --------------------------------------------- | ------------- | --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Modularity & Service Boundaries               | A (`8.0%`)    | `75`      | `6.00`          | Clean Trust Zones A/B/C ([ADR-006](./adr-006-three-app-topology-and-trust-zones.md)), `15` shared packages, `16` addons, Go `cp/arsy`, Rust daemons; limited by static addon bundling & unwired `services/memory` |
| 2   | Identity, Auth, RBAC & Trust Boundaries       | A (`8.0%`)    | `70`      | `5.60`          | Converged `@moonwitness/mid` + `@moonwitness/addon-auth` `mid-store.ts` & `ir_rule` RBAC; weakened by triple web client auth helpers & unauthenticated internal HTTP daemon hops                                  |
| 3   | Multi-Tenancy & Isolation                     | A (`8.0%`)    | `5`       | `0.40`          | Zero `tenant_id`, `org_id`, or `workspace_id` isolation in `@moonwitness/orm`, addons, or API auth (`apps/rocksoul` project/repo keys are local UI labels only)                                                   |
| 4   | API Gateway / Proxy & Contract Consistency    | A (`8.0%`)    | `50`      | `4.00`          | Frozen `/api/v1` + dynamic `/_meta/*` views; degraded by dual `apps/web` proxies, `0`-consumer `@moonwitness/contracts`, `control.routes.ts` vs `cp/arsy` drift, non-prod Swagger                                 |
| 5   | Database Ownership & Portability              | A (`8.0%`)    | `55`      | `4.40`          | Dual SQLite/Postgres `@moonwitness/orm` + `syncModels()`; `5` domain schemas moved to addons while `9` migration arrays stay inside `apps/api`; no online rollback safety                                         |
| 6   | Addon / Plugin Runtime & Registry             | B (`6.5%`)    | `72`      | `4.68`          | `AddonRuntimeController`, dependency topological sort, `/addons` toggle UI, runtime custom fields; compile-time static workspace imports block third-party hot pluggability                                       |
| 7   | Engine Coupling & Domain Portability          | B (`6.5%`)    | `35`      | `2.28`          | `@moonwitness/canon` serves `apps/web` & `apps/rocksoul`, but `0/17` direct `engines/*` runtime imports & `addon-epistemic` duplicates stripped-down helpers locally                                              |
| 8   | Async Jobs, Queues & Background Orchestration | B (`6.5%`)    | `25`      | `1.63`          | Rust pollers (`snmp-poller`) and `services/memory` have local loops; `apps/api` lacks a durable job queue, retry ledger, or distributed lock                                                                      |
| 9   | AI Runtime Portability & Supervision          | B (`6.5%`)    | `55`      | `3.58`          | `@moonwitness/ai` provides Ollama adapter, schemas, and `84` passing eval/protocol tests; `apps/rocksoul` agent execution is DB-ledger-only (`pid: None`)                                                         |
| 10  | Control Plane (`cp/arsy`) Integration         | B (`6.5%`)    | `65`      | `4.23`          | Go `arsy` passes tested unit packages with explicit `safety`, `reconcile`, and `capabilities`; single-VPS systemd host scope & V1 resource mismatch with `apps/api`                                               |
| 11  | Storage & Memory Continuity Sync              | B (`6.5%`)    | `40`      | `2.60`          | `services/storage`, `services/memory`, and `apps/rocksoul` loopback S3/Drive work separately; no unified replication & `services/storage/Dockerfile` is missing                                                   |
| 12  | Observability, Telemetry & Auditability       | C (`5.25%`)   | `40`      | `2.10`          | `addon-audit`, `probes`, `services/syslog` metrics, and `cp/arsy` `/v1/metrics` exist; `apps/api` & `apps/web` expose no Prometheus `/metrics`, OTEL traces, or cross-hop traceparent                             |
| 13  | Build, Packaging & Runtime Deployability      | C (`5.25%`)   | `45`      | `2.36`          | Core Compose (`caddy` + `web` + `api` + `postgres`) builds cleanly; `--profile ops build` fails on missing `services/storage/Dockerfile`; `services/memory` & `rocksoul` omitted                                  |
| 14  | CI/CD, Test Coverage & Quality Gates          | C (`5.25%`)   | `65`      | `3.41`          | `29/29` turbo Vitest tasks (`787` tests) + Go + Rust services run in CI; `33` passing `services/memory` pytests and `apps/rocksoul` Rust code remain outside `ci.yml`                                             |
| 15  | Ecosystem Boundary & Doc Governance           | C (`5.25%`)   | `78`      | `4.10`          | Clean A-L-L-A-H vs MoonWitness separation, `docs:check` (`0` errors) in CI; needs sync on concurrent 16-addon `packages/addons/README.md` drift                                                                   |

## 3. Aggregate Readiness Result

- **Total Weighted Score:** **`51.35 / 100` (`51.4%`)** (exact unrounded sum: `20.40` Tier A + `18.98` Tier B + `11.97` Tier C; displayed table cells rounded to 2 decimal places)
- **Classification:** **Viable Single-Tenant Core Platform with Prototype Addon IR Engine — NOT Ready for Multi-Tenant Mini-PaaS Hosting**
- **Go / No-Go Verdict:**
  - **GO** for controlled single-tenant operator deployment (`web` + `api` + `postgres` + `caddy` + `arsy` on a single VPS) once `services/storage/Dockerfile` and proxy/control contract drift are fixed.
  - **NO-GO** for multi-tenant workload hosting or third-party marketplace plugins until P0/P1 tenant scoping (`tenant_id`), persistent job orchestration, API/UI/daemon observability, and process-isolated execution boundaries exist.
