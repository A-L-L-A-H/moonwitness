# Backend Foundation Roadmap

Frontend implementation is explicitly out of scope for this roadmap. This document tracks the backend and monorepo boundary only.

## Phase 0 — Workspace and baseline validation

- [x] JavaScript ESM pnpm workspace and pinned Node/pnpm baseline.
- [x] Central dependency catalog and committed lockfile.
- [x] Fastify API and BullMQ worker processes.
- [x] MikroORM entities and reviewed initial migrations.
- [x] Central TypeBox contracts and basic add-on SDK registry.
- [x] GitHub Actions install, syntax, unit-test, migration, and migration-idempotency quality gate.
- [x] PostgreSQL/Redis outbox-to-BullMQ integration test.

## Phase 1 — Identity, security, and application core

- [x] Central runtime configuration validation.
- [x] User registration, password hashing/verification, and browser sessions.
- [x] Permission scopes, default roles, and server-side RBAC checks.
- [x] Initial-owner bootstrap with protection against replacing an existing owner.
- [x] Audit-event persistence and admin audit/access endpoints.
- [x] Request-scoped EntityManager and repository boundaries.
- [x] Transactional outbox persistence and deterministic queue producer registry.
- [x] Outbox-to-BullMQ dispatcher and worker consumer with processing leases.
- [ ] Complete API response-schema enforcement and OpenAPI generation.
- [ ] Session last-used updates, expiry cleanup policy, and security review.

## Phase 2 — Editorial and research domain

- [x] Story persistence and public reader/list endpoints.
- [x] Seven provenance classifications and block-level validation.
- [x] Source-reference persistence and story-block source links.
- [x] Research dossiers, claims, and claim/source relationships.
- [x] Creative-universe entity catalog persistence and read endpoints.
- [ ] Full editorial state machine for review decisions, approval, scheduling, publishing, archive, and correction.
- [ ] Immutable story/research revision history.
- [ ] Dedicated archive/search query service and pagination/index review.
- [ ] Media asset persistence, storage-provider port, and bounded processing jobs.

## Phase 3 — Add-on platform

- [x] Trusted manifest schema and in-process registry baseline.
- [x] Dependency ordering and cycle detection.
- [ ] Persisted install/configure/enable/disable/upgrade/uninstall lifecycle.
- [ ] Capability grants enforced at activation and runtime boundaries.
- [ ] Compensating rollback and lifecycle audit/health reporting.
- [ ] Protected add-on discovery and lifecycle API.
- [ ] Shipped publishing/research/media add-ons registered through the platform.

## Phase 4 — Integrations and asynchronous operations

- [x] Central BullMQ queue registry, payload validation, and bounded retry defaults.
- [x] PostgreSQL transactional outbox dispatcher.
- [x] Event consumer with processing ownership, lease renewal, retries, and stale-lease recovery.
- [ ] Register domain event handlers and define their idempotency/side-effect boundaries.
- [ ] Provider-neutral messaging port and fake provider contract tests.
- [ ] Baileys encrypted credential/session store and connection lifecycle.
- [ ] WhatsApp inbound/outbound message processing.
- [ ] Provider-neutral media storage and processing integrations.

## Phase 5 — Production hardening

- [x] Separate API, worker, and migration container definitions.
- [x] Production Compose topology using external PostgreSQL/Redis.
- [x] Backend-only ZIP packaging and CI artifact publication.
- [ ] Dedicated API/worker integration test matrix, including retry, concurrency, and process-restart scenarios.
- [ ] Metrics, traces, alerts, queue lag, and outbox backlog instrumentation.
- [ ] Approve backup encryption, retention, RPO, and RTO.
- [ ] Execute and document a successful database restore rehearsal.
- [ ] Environment-specific security/load testing, deployment promotion, and rollback rehearsal.

## Engineering rules

- Frontend work must not be bundled into backend completion or change backend ownership boundaries.
- Every public API, event, job, add-on manifest, or persisted-state change requires a versioned contract decision.
- Domain mutations and critical async work must be written in the same database transaction.
- Outbox and queue delivery are at-least-once; consumers must be idempotent.
- Add-ons are trusted, allowlisted server-side packages, not arbitrary uploaded JavaScript.
- Production migrations run as a single release operation, never concurrently in every API replica.
- Never commit secrets, provider sessions, QR codes, tokens, or production data.
- Only mark work complete with code, tests, and CI evidence.