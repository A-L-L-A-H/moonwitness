---
title: "MoonWitness Hybrid Target Architecture"
status: "PROPOSED"
owner: "Repository Standards & Principal Architecture"
last_reviewed: "2026-11-18"
---

# MoonWitness Hybrid Target Architecture

> Audit baseline: branch `dev`, `HEAD = 5c38909019d1034fb671bd64344dc35b16bd29a4` (`2026-11-18`). Evolves [ADR-006](./adr-006-three-app-topology-and-trust-zones.md) and [ADR-007](./adr-007-rocksoul-local-execution-and-data-boundary.md) without breaching A-L-L-A-H Tier 0 ecosystem boundaries.

## 1. Verified As-Is Platform Architecture (`HEAD = 5c389090`)

```mermaid
flowchart LR
  subgraph Edge["Edge / Browser Clients"]
    B["Browser Users"]
    CLI["@moonwitness/cli (isolated)"]
  end

  subgraph ZoneA["Zone A — Cloud / VPS Platform Core"]
    Caddy["Caddy (443/80)"]
    Web["@moonwitness/web (Next.js :3000)"]
    API["@moonwitness/api (Fastify :3002)"]
    Addons["16 Static Addons (__base + 15 domain/ops)"]
    PG["PostgreSQL 16 / SQLite (@moonwitness/orm)"]
    Caddy --> Web
    Caddy --> API
    Web -->|"Dual Proxy (rewrites + route handler)"| API
    API --> Addons
    Addons --> PG
  end

  subgraph ZoneB["Zone B — VPS Host & Telemetry Plane"]
    ARSY["cp/arsy (Go Host Agent)"]
    Rad["services/radius (:8090)"]
    SNMP["services/snmp-poller (:8094)"]
    Sys["services/syslog (:8093)"]
    Sto["services/storage (:8091, missing Dockerfile)"]
    Mem["services/memory (Python, unwired from Compose)"]
    API --> ARSY
    API --> Rad
    API --> SNMP
    API --> Sys
    API --> Sto
  end

  subgraph ZoneC["Zone C — Local-First Desktop & Standalone R&D"]
    RS["apps/rocksoul (Tauri + Local SQLite + Loopback S3)"]
    Eng["17 engines/* (0 direct runtime imports)"]
    RS -->|"OIDC PKCE + Optional HTTP"| API
    RS -.->|"Direct Sync Option"| Mem
  end
```

## 2. Proposed Hybrid Target Architecture (3 Tiers: Current -> Hybrid Target -> Future Optional)

| Tier                               | Scope                                           | Architectural Shape                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Verified Current (`dev`)**       | Single-tenant core platform                     | Caddy + Next.js (`web`) + Fastify (`api`, 16 static addons) + Postgres/SQLite + optional Rust telemetry (`--profile ops`) + Go host agent (`cp/arsy`) + local-first `rocksoul`                                                                                                                                                                                                                                                             |
| **Proposed Hybrid Target (P0–P2)** | Hardened single/multi-workspace hybrid platform | Single consolidated BFF proxy on `web` -> `api` via `@moonwitness/contracts`; tenant-scoped `@moonwitness/orm` (`tenant_id` context); `addon-epistemic` consuming `@moonwitness/canon`; `cp/arsy` & API contract symmetry; Postgres-backed async worker/queue inside `api` or wired worker unit; Compose-integrated `services/storage` + `services/memory`; OTEL + Prometheus `/metrics` across `web`, `api`, `cp/arsy`, and Rust services |
| **Future Optional Mini-PaaS (P3)** | Multi-tenant extensible compute & marketplace   | Out-of-process OCI/WASM sandboxed workload scheduling via upgraded control plane; remote signed addon manifests & capability tokens; multi-node Postgres/S3 replication                                                                                                                                                                                                                                                                    |

```mermaid
flowchart TB
  subgraph Tier0["Ecosystem Boundary (A-L-L-A-H Constitution & Canon)"]
    AC["@moonwitness/mid (OIDC ES256 Authority)"]
    CN["@moonwitness/canon (Validated Engine Ports)"]
  end

  subgraph ZoneATarget["Zone A — Consolidated Platform Control & API Plane"]
    Caddy2["Caddy TLS Edge"]
    Web2["apps/web (Single BFF Route Handler + Single OIDC Session Flow)"]
    Contracts["@moonwitness/contracts + OpenAPI IR Spec"]
    API2["apps/api (Tenant Context + Distributed Rate Limit + OTEL + /metrics)"]
    Addons2["Domain Addons + Postgres Queue Worker"]
    PG2["Postgres 16 (Tenant RLS / Scoped ORM + Retired Legacy SQL)"]
    Caddy2 --> Web2
    Caddy2 --> API2
    Web2 --> Contracts
    Contracts --> API2
    API2 --> AC
    API2 --> CN
    API2 --> Addons2
    Addons2 --> PG2
  end

  subgraph ZoneBTarget["Zone B — Authenticated Host & Data Services (mTLS / HMAC)"]
    ARSY2["cp/arsy (Synced V1 Capabilities Schema)"]
    Daemons2["services/{storage,radius,snmp-poller,syslog} (Unified Docker + /metrics)"]
    Mem2["services/memory (Compose Profile + CI Verified Hybrid Index)"]
    API2 -->|"Signed mTLS/Token Bridge"| ARSY2
    API2 --> Daemons2
    API2 --> Mem2
  end

  subgraph ZoneCTarget["Zone C — Local-First Desktop & Promoted Engines"]
    RS2["apps/rocksoul (Supervised Process Runner + Synced Checkpoints + CI Cargo Checks)"]
    EngPkg["Promoted @moonwitness/* Library Ports from engines/*"]
    EngArc["Read-Only engines/* Corpus Archives"]
    RS2 --> API2
    RS2 --> CN
    EngArc -.->|"Curated Extraction Only"| EngPkg
    EngPkg --> CN
  end
```

## 3. Ownership Boundary Split: Platform Core vs Domain/R&D Engines vs Desktop

| Concern                                                         | Owning Layer                                                                                                      | Target Rule                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Identity, RBAC, Tenant Context, Audit, Rate Limiting, Telemetry | **Platform Core (`@moonwitness/mid`, `@moonwitness/orm`, `addon-auth`, `addon-audit`, `addon-base`, `apps/api`)** | Every DB query & mutation carries `ActorContext` + `tenantId` (`DEFAULT_TENANT` only in single-tenant compatibility mode)             |
| Edge Proxy, CSRF Cookie Handling, Dynamic Studio/UI Chrome      | **Web BFF & UI (`apps/web`, `@moonwitness/ui`, `@moonwitness/contracts`)**                                        | Single BFF handler (`src/app/api/v1/[...path]/route.ts`); retire duplicate rewrite & extra PKCE clients                               |
| VPS Systemd/Firewall/VPN/DNS Reconciliation                     | **Host Control Plane (`cp/arsy`)**                                                                                | Shared capability manifest constrains `apps/api` `control.routes.ts` so unsupported kinds fail at schema validation                   |
| Domain Text, Lunar Visibility, RGBL, Semantic Claims            | **Engine Ports (`@moonwitness/canon`) + Addons (`epistemic`, `canon-lore`, `witness-research`)**                  | No duplicated domain math inside addon folders; `engines/*` remains upstream R&D/corpus archive until promoted via versioned packages |
| Offline Editing, Supervised Local Commands, Drive/S3 Backup     | **Local Desktop (`apps/rocksoul` / Trust Zone C)**                                                                | Never holds multi-tenant platform secrets; synchronizes via explicit user-scoped OIDC PKCE tokens                                     |
