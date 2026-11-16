# MoonWitness — Intelligent Enterprise Foundation

**Repository:** isrockfeel/moonwitness  
**Architecture:** Clean, centralized-contract monorepo  
**Product:** MoonWitness — When the moon rises, we share a message.

## Decisions

Use JavaScript ESM in a pnpm monorepo:
- Next.js App Router in apps/web.
- Fastify HTTP application in apps/api.
- PostgreSQL through MikroORM in packages/database.
- BullMQ workers in apps/worker, backed by Redis.
- Shared runtime contracts in packages/contracts.
- Odoo-inspired add-on SDK and lifecycle in packages/addon-sdk.
- Optional integrations behind provider ports; WhatsApp Baileys is an isolated add-on.

This is a **modular monolith with separately runnable web, API, and worker processes**, not a microservice fleet.

## Runtime baseline

- Node.js 26 Active LTS.
- pnpm 12.19.0 pinned by root packageManager.
- Fastify 5.12.x.
- MikroORM 7.2.x and PostgreSQL.
- BullMQ 6.7.x.
- TypeBox / JSON Schema for runtime validation.

The baseline is pinned by .node-version, root engines, packageManager, and CI. Revisit versions only through a documented dependency update.

## Workspace map

    apps/
      web/                 Next.js frontend
      api/                 Fastify API
      worker/              BullMQ worker process
    packages/
      contracts/           API, event, job, error, and add-on schemas
      database/             MikroORM entities, migrations, repositories
      core/                 domain services and use cases
      addon-sdk/            manifest, lifecycle, and capability contracts
      queue/                queue registry and producer helpers
      config/               environment parsing and validation
      auth/                 identity, sessions, authorization
    addons/
      publishing/
      research/
      media/
      whatsapp/
    docs/
      design/
      architecture/

Create a package only when its first bounded use case is ready; avoid empty abstractions.

## Dependency direction

1. apps/web -> API contract/client only.
2. apps/api -> contracts, core, database, add-on SDK, queue producers.
3. apps/worker -> contracts, core, database, integration ports.
4. packages/core -> domain types and ports; never imports apps or concrete add-ons.
5. packages/database -> persistence mapping; never imports Fastify or UI.
6. addons/* -> add-on SDK, contracts, and approved core ports.
7. Only the WhatsApp add-on may import Baileys.

No browser code may connect to PostgreSQL, Redis, MikroORM, BullMQ, or WhatsApp.

## Centralized contract rule

Changes to public APIs, events, queue payloads, add-on manifests, or persisted state require a schema and compatibility decision in the same change. Route handlers cannot invent private response shapes.

Use /api/v1 and derive runtime validation and OpenAPI from shared contracts. Frontend clients must consume the same definitions.

## Clean application flow

HTTP route -> contract validation -> application use case -> repository port -> MikroORM adapter -> PostgreSQL.

Async flow:

Command -> transactional outbox -> BullMQ producer -> worker -> application use case/provider port -> audit event.

Never publish a critical job before the database transaction commits. Implement an outbox dispatcher for durable workflows.

## Enterprise foundation rules

- Tenant/workspace boundaries must be explicit before introducing multi-tenancy.
- Every mutation has actor context, request ID, authorization decision, and audit policy.
- Use request-scoped EntityManager forks; never share an ORM identity map between requests.
- Production schema changes use reviewed migrations only.
- All background jobs are idempotent, bounded, versioned, and observable.
- Add-on install, configure, enable, connect, disable, and uninstall are separate operations.
- Add-ons are trusted server-side packages, not arbitrary JS uploaded by an admin.
- Secrets are delivered through deployment secret stores.
- Integrations are adapters behind explicit provider ports.
- No extra infrastructure without a measured requirement.

## Explicitly deferred

- Microservices and service mesh.
- Kubernetes and event-streaming platforms.
- Elasticsearch or a separate search cluster.
- Multi-region active-active writes.
- Arbitrary runtime package installation from admin UI.
- WhatsApp bulk campaigns.
- Billing engine before monetization requirements exist.

## Foundation definition of done

- Single pnpm workspace and lockfile.
- API and worker run as independent processes.
- Liveness and readiness are different.
- Schema changes use migrations.
- API and worker import shared contracts.
- Add-on SDK detects version mismatch and dependency cycles.
- Optional integrations do not make core startup fail.
- Tests cover health and add-on failure paths.
