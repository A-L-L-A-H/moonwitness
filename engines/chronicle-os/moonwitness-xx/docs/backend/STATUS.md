# MoonWitness Backend — Verification Status

**Scope:** Backend only. Next.js/frontend implementation is deliberately excluded.

## Verified baseline

GitHub Actions run for commit 254ec075020afaeaef86c4b1975d23ad0732d0c9 completed successfully on 11 November 2026 (run timestamp 10 November 2026 19:36:07Z). It executed pnpm install with frozen lockfile, workspace syntax/package checks, unit tests, PostgreSQL migrations, PostgreSQL outbox-to-BullMQ integration using Redis, and migration idempotency verification.

Run: https://github.com/isrockfeel/moonwitness/actions/runs/42886902983

This evidence applies to that exact commit. Any later changes must pass CI again before being described as verified.

## Backend implementation present

- Fastify API with separate liveness/readiness checks.
- Central runtime configuration and request-scoped ORM context.
- User registration/login/session revocation, CSRF/origin checks, role catalog, permission checks, initial-owner bootstrap.
- Story/research/source/universe/admin API foundations.
- Seven content-provenance classifications and source-reference links.
- PostgreSQL entities, migrations, repositories, audit-event records.
- Transactional outbox, queue registry, dispatcher, BullMQ system/event workers.
- Add-on manifest validation and in-process dependency registry baseline.

## Explicitly not complete

- Persisted add-on lifecycle and capability enforcement.
- Full editorial review/publish/correction lifecycle and immutable revision history.
- Registered domain event handlers for all current event types; unhandled events remain visible as unhandled.
- Provider-neutral messaging integration and WhatsApp Baileys pairing/inbound/outbound delivery.
- Media storage and processing.
- OpenAPI generation and comprehensive response-schema enforcement.
- Full observability (metrics/traces/alerts) and production operational dashboards.
- Production backup encryption/retention decisions and a verified restore rehearsal.
- Comprehensive API/worker failure, concurrency, and process-restart integration matrix.
- Production launch certification or external security review.

## Packaging

Run pnpm package:backend to create dist/moonwitness-backend.zip. The archive excludes apps/web, docs/design, node_modules, .git, and local .env files. GitHub Actions publishes it as the moonwitness-backend artifact after quality checks and Docker image builds pass.