# Operations runbook

## Health and readiness

- `GET /api/v1/healthz` — liveness only. Returns `200 {"status":"ok"}` whenever the process is up. Use for container liveness probes.
- `GET /api/v1/readyz` — readiness. Verifies database connectivity with `SELECT 1`:
  - `200 {"status":"ready","database":"ok"}` when the database answers.
  - `503 {"status":"unavailable","database":"unavailable"}` when it does not. Error details are not leaked.
    Use for load-balancer / readiness probes so traffic drains when the DB is down.

## Production configuration

Startup calls `assertProductionEnv()` and **refuses to boot** when the configuration is unsafe. Required in `NODE_ENV=production`:

- `DATABASE_URL`: valid `postgres://` or `postgresql://` URL with host and database name.
- `CORS_ORIGINS`: comma-separated explicit origins; `*` is rejected.
- `LOG_LEVEL`: optional; defaults to `info` in production.

Development/test defaults (`127.0.0.1`, in-memory-friendly, `localhost:3000` CORS) are never used in production.

## Shutdown

The server handles `SIGTERM`/`SIGINT` by closing the Fastify instance (which runs the `onClose` hook and closes the database connection) and exiting `0`. A second signal during shutdown is ignored to avoid double-close races.

## Security headers and errors

Every response sets `x-content-type-options: nosniff`, `x-frame-options: DENY`, and `referrer-policy: no-referrer`. In production, 5xx responses return `{"error":"internal server error"}` instead of internal messages; details go to the structured log only.

## Backup and restore

- **PostgreSQL-only operational CLI:** provide `DATABASE_URL` and `MW_BACKUP_ENCRYPTION_KEY` through the process environment/secret manager, then run `node scripts/backup-db.mjs --out ./backups`. The CLI refuses database URLs or encryption keys passed as command-line arguments. For restore, supply a separate `ISOLATED_RESTORE_DATABASE_URL` and the same backup key through the process environment, then run `node scripts/restore-db.mjs --backup <file.pgdump.enc> --manifest <manifest.json>`. The CLI rejects SQLite/libSQL/D1 targets and refuses a restore target that matches `DATABASE_URL`.
- **Integrity evidence:** restore requires the matching manifest, verifies the HMAC signature, encrypted archive hash and decrypted plaintext hash before invoking `pg_restore`. The signing key is derived separately from the operator-supplied backup key; key escrow/recovery, rotation, multi-database backup-set completeness, retention, off-host storage and restore drills remain open under [#192](https://github.com/A-L-L-A-H/moonwitness/issues/192). Do not describe a created archive as a verified production backup until it has been restored and checked.
- **Restore safety:** `pg_restore --clean --if-exists` can replace objects in the target database. Do not point it at production or any database containing data to preserve. Restore into an isolated target first; destructive production restore requires an explicitly reviewed owner-approved plan.
- **Private ROCKSOUL/Memory data:** keep local backup keys and backup destinations inside their owner-controlled trust zones. Never transfer private archives or database backups to the public VPS by default.
- **Legacy SQLite utilities:** `scripts/backup-sqlite.mjs` and `scripts/restore-sqlite.mjs` are retained temporarily for controlled archival/recovery of pre-existing data during migration. They are not an approved runtime backup path; do not create new SQLite databases or use them instead of PostgreSQL backups. Remove them after migration and restore verification are complete.

`packages/orm` still contains legacy SQLite branches for compatibility and historical tests; those are not the approved persistence target. PostgreSQL integration and backup helper coverage is exercised in CI through `POSTGRES_TEST_URL` and `packages/orm/src/__tests__/postgres.live.test.ts`.

## Migration recovery

- Migrations are tracked in `_orm_schema_migrations` (id, checksum, applied_at) and run in a transaction; a failed migration rolls back and is not recorded.
- A checksum mismatch means an applied migration was edited; fix by adding a new migration rather than editing history.
