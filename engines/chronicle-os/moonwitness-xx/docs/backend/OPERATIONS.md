# Backend Operations Runbook

This runbook is a baseline, not a substitute for environment-specific approval or a completed disaster-recovery rehearsal.

## 1. Required services and configuration

Production API and worker require PostgreSQL and Redis. Production Compose does not create either service; provision them separately with private network access, TLS where supported, monitoring, and managed credentials.

Required variables: NODE_ENV=production, DATABASE_URL, REDIS_URL, CORS_ORIGINS (comma-separated exact HTTP(S) origins).

API variables: HOST (default 0.0.0.0), PORT (default 4000), LOG_LEVEL (default info).

Worker variables: WORKER_CONCURRENCY (default 5; allowed 1–100), OUTBOX_BATCH_SIZE (default 25), OUTBOX_LEASE_SECONDS (default 60), OUTBOX_RETRY_DELAY_SECONDS (default 30).

Do not use sample credentials outside isolated local development.

## 2. Release sequence

1. Review the exact commit and CI result.
2. Provision and verify PostgreSQL and Redis connectivity.
3. Back up PostgreSQL before a schema migration.
4. Run the migration container once:

   ```bash
   docker compose -f compose.backend.yml --profile operations run --rm migrate
   ```

5. Deploy API and worker:

   ```bash
   docker compose -f compose.backend.yml up -d --build api worker
   ```

6. Verify GET /health/live returns HTTP 200; GET /health/ready returns HTTP 200 with database and Redis checks true; GET /api/v1/meta returns expected versions; worker logs show no repeated connection failures.
7. Keep the previous image/commit available for rollback. Do not roll back database schema blindly; assess forward-compatible migrations first.

## 3. Database backup

Use PostgreSQL custom archive format and protect the resulting file as sensitive data:

```bash
umask 077
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" --file "moonwitness-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_restore --list moonwitness-YYYYMMDDTHHMMSSZ.dump >/dev/null
```

Encrypt the backup before transferring it to object storage. Store it outside the database host's failure domain. Apply least-privilege access and retention controls. Do not attach backups or production data to tickets.

Retention duration, recovery point objective (RPO), and recovery time objective (RTO) have not been approved. Record those environment-owner decisions before production launch.

## 4. Restore rehearsal

Restore only into a clean, isolated database:

```bash
createdb moonwitness_restore
pg_restore --exit-on-error --no-owner --no-acl --dbname "$RESTORE_DATABASE_URL" moonwitness-YYYYMMDDTHHMMSSZ.dump
```

Then run pnpm db:migrate against the restored database; verify expected core tables, row counts, foreign keys and indexes; start isolated API/worker processes; run read-only health/meta checks; record duration, failures, and achieved RPO/RTO.

A backup is not considered operationally verified until this restore rehearsal succeeds. No restore rehearsal is asserted by this repository.

## 5. Redis and queue recovery

PostgreSQL outbox rows are the durable source for domain events. Redis/BullMQ is the delivery mechanism. Configure Redis persistence/availability per hosting guarantees and monitor memory, evictions, connection limits, and queue lag.

Delivery is at-least-once, not exactly-once. Every event handler that performs an external side effect must be idempotent. Events without a registered handler are recorded as unhandled and must not be silently treated as completed business work.

## 6. Shutdown and incident response

- API and worker respond to SIGINT/SIGTERM and close runtime resources.
- BullMQ may retry active jobs during worker restarts. Outbox leases protect consumer ownership and allow expired work to be reclaimed.
- On repeated failures, inspect PostgreSQL outbox rows with status failed or unhandled, worker logs, and Redis queue state.
- Do not manually delete outbox rows to clear a queue incident.
- Redact session cookies, CSRF values, passwords, authorization headers, Redis URLs, and database credentials from incident artifacts.
- Preserve request IDs, outbox IDs, event types, and correlation IDs for safe tracing.

## 7. Production readiness gates still required

- Persistent add-on lifecycle and capability enforcement.
- Full review/approve/publish/archive/correction editorial state transitions.
- Provider-neutral messaging port and the selected WhatsApp provider's compliance/security review.
- OpenAPI generation and contract response validation.
- Metrics, alerting, queue lag and outbox backlog dashboards.
- Isolated API/worker integration tests including retry, concurrency, and process-restart scenarios.
- Backup encryption, retention policy approval, and successful restore rehearsal.
- Environment-specific load, security, and rollback exercises.