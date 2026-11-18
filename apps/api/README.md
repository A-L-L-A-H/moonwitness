# @moonwitness/api

Core Fastify 5 backend API, PostgreSQL / libSQL persistence host, MoonWitness Identity (MID) OIDC plugin host, and telemetry reverse-proxy gateway ([ADR-006](../../docs/architecture/adr-006-three-app-topology-and-trust-zones.md)).

## Responsibilities & Route Groups

Built via `buildFastify()` in `src/infrastructure/adapters/fastify.adapter.ts` under prefix `/api/v1`:

- **Health & Readiness (`health.routes.ts`):** `GET /api/v1/healthz`, `GET /api/v1/health`, `GET /api/v1/readyz`
- **Identity & Auth (`auth.routes.ts`, `@moonwitness/mid`):** Session cookies (`mw_session`), bcrypt credentials, optional mounted MID OIDC endpoints (`MID_KEY_ENCRYPTION_SECRET`)
- **Timeline & Addons (`timeline.routes.ts`, `@moonwitness/addon-base`, `@moonwitness/addon-timeline`):** Addon lifecycle and timeline repository endpoints backed by `@moonwitness/orm`
- **Operational & AI Proxies:**
  - `control.routes.ts` -> loopback `cp/arsy`
  - `radius.routes.ts` -> `RADIUS_URL` (`http://127.0.0.1:8090`)
  - `storage.routes.ts` -> `STORAGE_URL` (`http://127.0.0.1:8091`, server-side SigV4)
  - `syslog.routes.ts` -> `SYSLOG_URL` (`http://127.0.0.1:8093`)
  - `snmp-poller.routes.ts` -> `SNMP_POLLER_URL` (`http://127.0.0.1:8094`)
  - `memory.routes.ts` -> `MEMORY_API_URL` (optional local bridge)
  - `riot-ai.routes.ts` -> `RIOT_AI_BASE_URL` / `@moonwitness/ai` (SSRF-guarded)
  - `command-center.routes.ts` & `probes.routes.ts` -> Command Center workflows and network probes
- **Swagger / OpenAPI (`NODE_ENV !== "production"`):** Served at `/docs`

## Configuration & Database

Environment variables are validated at startup in `src/shared/env.ts` (`PORT` defaults to `3002`, `HOST` defaults to `127.0.0.1`). `@moonwitness/orm` selects `PostgresDriver` when `DATABASE_URL` uses `postgres://` (Compose production) or `LibSqlDriver` for SQLite/libSQL local/test runs.

## Key Scripts

```sh
pnpm --filter @moonwitness/api dev         # tsx watch src/index.ts
pnpm --filter @moonwitness/api build       # tsup bundle -> dist/index.js
pnpm --filter @moonwitness/api start       # node dist/index.js
pnpm --filter @moonwitness/api lint        # eslint src
pnpm --filter @moonwitness/api typecheck   # tsc --noEmit
pnpm --filter @moonwitness/api test        # vitest run
pnpm --filter @moonwitness/api seed:demo   # explicit demo fixture seeding
pnpm --filter @moonwitness/api verify:pact # provider Pact verification
```

## Ownership & References

- **Owner:** Backend & Platform Core (`apps/api`)
- **Operations & Security:** [RUNBOOK.md](../../docs/engineering/RUNBOOK.md), [SECURITY.md](../../docs/engineering/SECURITY.md), [DATA-OWNERSHIP-BACKUP-RESTORE.md](../../docs/architecture/DATA-OWNERSHIP-BACKUP-RESTORE.md)
