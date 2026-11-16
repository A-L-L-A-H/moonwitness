# MoonWitness Backend Package

**When the moon rises, we share a message.**

This bundle contains backend code only. It excludes the Next.js frontend, frontend DNA/design handoff, local dependencies, and environment secrets.

## Architecture

- Fastify API: authentication context, authorization, stories, research, sources, universe, and admin routes.
- PostgreSQL + MikroORM: entities, migrations, repositories, audit history, and transactional outbox.
- TypeBox contracts: request, event, and job validation.
- BullMQ + Redis: queue registry, outbox dispatcher, and worker consumers.
- Core: editorial provenance validation and domain event bus.
- Add-on SDK: trusted manifest validation, dependency ordering, and in-process registry baseline.

The browser must never connect directly to PostgreSQL, Redis, MikroORM, BullMQ, or provider credentials.

## Requirements

- Node.js 26
- pnpm 12.19.0 (Corepack recommended)
- Docker Engine + Compose
- PostgreSQL 17
- Redis 7.4 or compatible

## Local setup

1. Copy .env.example to .env and set the local database/Redis URLs.
2. Start local infrastructure: docker compose up -d postgres redis
3. Install and migrate:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   pnpm db:migrate
   ```

4. Start the API and worker in separate terminals:

   ```bash
   pnpm dev:api
   pnpm dev:worker
   ```

5. Register the first account through POST /api/v1/auth/register, then bootstrap its owner role once:

   ```bash
   INITIAL_OWNER_EMAIL=owner@example.com pnpm auth:bootstrap-owner
   ```

The bootstrap command refuses to create another initial owner when an owner is already present. Never commit .env or put production credentials in shell history.

## Commands

| Command | Purpose |
|---|---|
| pnpm check | Syntax/package checks across workspaces |
| pnpm test | Workspace unit tests |
| pnpm test:integration | PostgreSQL → outbox → BullMQ integration test |
| pnpm db:migrate | Apply committed database migrations |
| pnpm auth:bootstrap-owner | Assign the initial owner role |
| pnpm package:backend | Build dist/moonwitness-backend.zip |

## API surface

- GET /health/live — process liveness.
- GET /health/ready — PostgreSQL and Redis readiness.
- GET /api/v1/meta — platform/API/contract metadata.
- POST /api/v1/auth/register, POST /api/v1/auth/login, GET /api/v1/auth/me, GET /api/v1/auth/csrf, POST /api/v1/auth/logout.
- GET/POST /api/v1/stories, GET/PATCH /api/v1/stories/:id, POST /api/v1/stories/:id/submit.
- POST /api/v1/research, GET /api/v1/research/mine, GET /api/v1/research/:slug.
- POST /api/v1/sources, GET /api/v1/sources/:id.
- GET /api/v1/universe, GET /api/v1/universe/:slug.
- GET /api/v1/admin/audit, GET /api/v1/admin/users/:userId/access, role grant/revoke routes.

Authenticated unsafe requests require the session CSRF token in x-csrf-token. The server validates request origins against CORS_ORIGINS.

## Production containers

The bundle contains separate multi-stage API and worker Dockerfiles plus a one-shot migration image:

- Dockerfile.api
- Dockerfile.worker
- Dockerfile.migrate
- compose.backend.yml

Production PostgreSQL and Redis are external dependencies and are deliberately not provisioned by the production compose file. Set DATABASE_URL, REDIS_URL, and CORS_ORIGINS in a protected environment file or secret manager.

Apply migrations once before rolling out API/worker containers:

```bash
docker compose -f compose.backend.yml --profile operations run --rm migrate
docker compose -f compose.backend.yml up -d --build api worker
```

Read docs/backend/OPERATIONS.md before production deployment or backup/restore work.

## Current completion boundary

Verified backend capabilities include the workspace/lockfile, runtime configuration, auth/session/RBAC foundation, audit records, story and research persistence/API foundations, provenance contracts, source references, creative-universe catalog persistence, transactional outbox, queue registry/dispatcher, and PostgreSQL/Redis outbox integration coverage.

The event transport is not the same as completed business integrations. Event types without registered handlers are deliberately marked unhandled. Persistent add-on lifecycle/API, capability-grant enforcement, full editorial review/publish/correction workflow, OpenAPI generation, messaging provider/Baileys connection and delivery, media processing, richer metrics/alerts, and a tested production backup/restore rehearsal remain unfinished. Do not treat this package as a claim of production certification.

## Security rules

- Do not commit .env, passwords, tokens, provider sessions, QR codes, or key material.
- Use TLS connections for production database/Redis endpoints.
- Keep API and worker secrets in a deployment secret manager.
- Run migrations as a deliberate release step, never automatically in every API replica.
- Treat outbox/queue delivery as at-least-once; downstream handlers must be idempotent.