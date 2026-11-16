# MOONWITNESS

**When the moon rises, we share a message.**

MoonWitness is a living archive for stories, witness accounts, research, reflections, and messages. This repository contains the platform foundation and its modular application workspace.

## Architecture

- Next.js App Router — web experience (owned by the frontend handoff).
- Fastify — HTTP/API boundary.
- MikroORM + PostgreSQL — persistence.
- BullMQ + Redis — async jobs and workers.
- Central TypeBox/JSON Schema contracts — API, events, and jobs.
- Odoo-inspired add-on SDK — explicit manifests, dependency order, lifecycle, and capabilities.
- Optional provider adapters — WhatsApp Baileys is isolated and disabled by default.

The architecture is a clean modular monolith with separate web, API, and worker processes. It is intentionally not a premature microservice architecture.

Read the contracts before making changes:

- [Frontend DNA](docs/design/FRONTEND_DNA.md)
- [v0 frontend handoff](docs/design/V0_FRONTEND_HANDOFF.md)
- [Backend architecture](docs/architecture/ARCHITECTURE.md)
- [Central contracts](docs/architecture/CENTRAL_CONTRACTS.md)
- [Add-on architecture](docs/architecture/ADDON_SYSTEM.md)
- [WhatsApp adapter rules](docs/architecture/WHATSAPP_ADAPTER.md)
- [Security baseline](docs/architecture/SECURITY.md)
- [Backend roadmap](docs/architecture/ROADMAP.md)
- [Backend issue index](docs/architecture/BACKEND_ISSUES.md)

## Requirements

- Node.js 26 Active LTS
- pnpm 12.19.0
- Docker with Compose

## Local development

    cp .env.example .env
    docker compose up -d postgres redis
    corepack enable
    pnpm install
    pnpm db:migrate
    pnpm dev:api

In a second terminal:

    pnpm dev:worker

Register the first operator account at `/api/v1/auth/register`, then bootstrap its owner role once:

    INITIAL_OWNER_EMAIL=owner@example.com pnpm auth:bootstrap-owner

The command refuses to replace an existing owner. Never commit account credentials or `.env`.

API endpoints:

- GET http://localhost:4000/health/live
- GET http://localhost:4000/health/ready
- GET http://localhost:4000/api/v1/meta

Readiness returns HTTP 503 until PostgreSQL and Redis are connected.

## Workspace commands

- pnpm dev:api — run Fastify API.
- pnpm dev:worker — run BullMQ worker.
- pnpm test — run workspace tests.
- pnpm check — run workspace syntax checks.
- pnpm db:migrate — apply reviewed database migrations.

CI generates and commits the pnpm lockfile only after install, test, and migration verification succeed. Follow-up runs use the committed frozen lockfile.

## Engineering rules

- JavaScript ESM throughout the workspace.
- No Express, Prisma, or duplicate package manager.
- Next.js never connects directly to PostgreSQL, Redis, MikroORM, or WhatsApp.
- All public API and job payloads use central contracts.
- All production schema changes use migrations.
- All workers must be idempotent, bounded, and gracefully stoppable.
- Optional add-ons must not make core startup fail.
- Never commit secrets, session files, QR codes, or WhatsApp credentials.

## Backend-only package

This repository contains the backend workspace and a separately maintained frontend handoff. To download and run the backend without frontend files, start with [BACKEND_README.md](BACKEND_README.md). Operational procedures are in [docs/backend/OPERATIONS.md](docs/backend/OPERATIONS.md); verified boundaries and outstanding work are in [docs/backend/STATUS.md](docs/backend/STATUS.md).

## Project status

The backend now includes the Fastify API, PostgreSQL/MikroORM persistence, authentication and RBAC foundations, editorial/research/source/universe APIs, audit records, transactional outbox, BullMQ queue/worker flow, and PostgreSQL/Redis integration coverage. CI is the source of truth for the exact commit that has passed install, checks, tests, migrations, and integration tests.

This is not yet production-certified. Persistent add-on lifecycle, capability enforcement, complete editorial publication/correction workflow, registered domain event handlers, WhatsApp messaging, media processing, OpenAPI/response-schema completion, full observability, and a tested backup/restore rehearsal remain unfinished. See [backend roadmap](docs/architecture/ROADMAP.md) for the execution boundary.
