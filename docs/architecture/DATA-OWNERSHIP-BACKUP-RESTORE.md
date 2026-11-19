# MoonWitness Data Ownership, Initialization, Backup and Restore Specification (MW-0036)

> [!IMPORTANT]
> **Owner decision (2026-11-19): PostgreSQL is the only approved database engine** across production, development, tests, ROCKSOUL and Memory. Keep each trust zone and service database/role separate. This document retains legacy SQLite details below as historical inventory only; they are not an approved runtime or backup target. Migration of existing private data must be controlled, non-destructive and restore-verified under [#288](https://github.com/A-L-L-A-H/moonwitness/issues/288) and [#192](https://github.com/A-L-L-A-H/moonwitness/issues/192).

## 1. Executive Summary

This specification began as an inventory of the legacy database topology. The SQLite/libSQL references in Sections 2–5 describe pre-migration state, not an approved current or target architecture. The current owner-approved target is PostgreSQL across cloud, development, tests and private local apps, with separate database ownership and credentials per trust zone. Actual conversion status must be tracked against #288; do not infer that conversion is complete from this historical inventory.

- Core API and the integrated MoonWitness Identity (MID) authority (`packages/mid` mounted in `apps/api`) share the primary database configured via `DATABASE_URL` through `@moonwitness/orm`.
- Each Rust telemetry/storage service (`--profile ops`) owns one dedicated SQLite database file on its named volume.
- Local companion services (`apps/rocksoul`, `services/memory`) maintain strictly local-first SQLite / LanceDB stores outside the VPS stack (`ADR-007`).
- All production databases initialize with versioned migrations; there is zero legacy migration from Cloudflare D1 in the VPS runtime.
- No application data or database clients exist on MikroTik / RouterOS.

---

## 2. Historical Service & Database Ownership Matrix

| Service                      | Storage / DB File                           | Docker Volume Mount                      | Owning Runtime                                       | Authorized Consumers               | Primary Tables                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core API & MID**           | PostgreSQL (`postgres` prod) / `libSQL` dev | `postgres-data:/var/lib/postgresql/data` | Node.js Fastify (`apps/api`)                         | `apps/api` (incl. `packages/mid`)  | `users`, `sessions`, `_orm_audit_log`, `command_center_workflows`, `command_center_alerts`, `igate_nodes`, `igate_probe_events`, `mid_signing_keys`, `mid_clients`, `mid_auth_codes`, `mid_refresh_tokens`, `mid_audit_logs` |
| **RADIUS Service** (`ops`)   | `radius.db` (SQLite)                        | `radius-data:/data`                      | Rust axum/sqlx (`services/radius`)                   | `services/radius` exclusively      | `users` (NAS credentials), `radius_logs` (auth/acct audit events)                                                                                                                                                            |
| **SNMP Poller** (`ops`)      | `snmp.db` (SQLite)                          | `snmp-data:/data`                        | Rust axum/sqlx (`services/snmp-poller`)              | `services/snmp-poller` exclusively | `devices`, `targets`, `samples` (MRTG time series)                                                                                                                                                                           |
| **Syslog Collector** (`ops`) | `syslog.db` (SQLite)                        | `syslog-data:/data`                      | Rust axum/sqlx (`services/syslog`)                   | `services/syslog` exclusively      | `syslog_messages` (bounded ring buffer)                                                                                                                                                                                      |
| **Object Storage** (`ops`)   | `storage.db` (SQLite)                       | `storage-data:/data`                     | Rust axum/sqlx (`services/storage`)                  | `services/storage` exclusively     | `buckets`, `objects`, `multipart_uploads`, `upload_parts`                                                                                                                                                                    |
| **ROCKSOUL & Memory**        | Local SQLite / `memory.db` + LanceDB        | Local user/app directory                 | Tauri (`apps/rocksoul`), FastAPI (`services/memory`) | Local workstation only             | Excluded from VPS production stack (`ADR-007`)                                                                                                                                                                               |
| **MikroTik RouterOS**        | _None_                                      | _None_                                   | RouterOS                                             | _None_                             | Zero persistent application database                                                                                                                                                                                         |

---

## 3. Legacy Core API & MID Driver Notes

1. **Driver Selection (`packages/orm`)**: `@moonwitness/orm` selects `PostgresDriver` when `DATABASE_URL` uses `postgres://` or `postgresql://` (the VPS Compose default) and `LibSqlDriver` for SQLite/libSQL local/test databases (`D1Driver` is also retained for Cloudflare D1 workers compatibility).
2. **D1 Bridge Adapter**: The MID Fastify plugin receives `createD1DatabaseFromOrm(getDb())`, executing MID queries through the same `@moonwitness/orm` connection handle as Core API.
3. **Transaction Isolation**: PostgreSQL uses standard ACID transactions; SQLite/libSQL write transactions serialize via `BEGIN IMMEDIATE` / `transaction("write")`.

---

## 4. Historical SQLite WAL Configuration (not an approved database target)

Legacy reference only: the following pragmas describe how pre-existing SQLite files were configured. They do not authorize SQLite for new runtime or test databases. PostgreSQL is the only approved engine:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
```

### Rationale:

- **`journal_mode = WAL`**: Enables concurrent readers without blocking writers and concurrent writers without blocking readers.
- **`synchronous = NORMAL`**: Drastically reduces fsync overhead in WAL mode while remaining completely resilient to application crashes and power loss.
- **`busy_timeout = 5000`**: Allows SQLite to wait up to 5 seconds for write locks to clear instead of failing immediately with `SQLITE_BUSY`.
- **`foreign_keys = ON`**: Enforces referential integrity at the database engine level.

---

## 5. Initialization, Migrations & Bootstrap

1. **Versioned Migrations**:
   - The Core API database tracks applied migrations in `_orm_schema_migrations` with SHA-256 checksum validation.
   - Specialized Rust services embed SQL migrations at compile time via `sqlx::migrate!("./migrations")` and apply them on startup.
2. **First Admin Bootstrap**:
   - In production, if `users` is empty, `seedBootstrapAdmin()` requires `MW_BOOTSTRAP_ADMIN_USERNAME`, `MW_BOOTSTRAP_ADMIN_EMAIL`, and `MW_BOOTSTRAP_ADMIN_PASSWORD`.
   - Fails closed on first boot if these required credentials are not supplied.
3. **Demo Seed Safety**:
   - Fictional timeline and demo fixture seeding is strictly forbidden in production unless explicitly authorized with `ALLOW_DEMO_SEED=1`.

---

## 6. Backup & Restore Architecture

### PostgreSQL-only target

- **Approved engine:** PostgreSQL for every database, including optional production services and private local ROCKSOUL/Memory data. Use separate databases/schemas and least-privilege roles for distinct owners and trust zones.
- **Current CLI behavior:** `scripts/backup-db.mjs` reads `DATABASE_URL` and `MW_BACKUP_ENCRYPTION_KEY` from the process environment; `scripts/restore-db.mjs` requires `ISOLATED_RESTORE_DATABASE_URL`, the same key, and an explicit archive/manifest pair. Neither CLI accepts database URLs or encryption keys as command-line arguments. Restore refuses a target that matches the configured source database. The backup command creates `pg_dump --format=custom --no-owner --no-acl` archives encrypted with AES-256-GCM and a portable JSON manifest containing plaintext/encrypted SHA-256 hashes plus an HMAC-SHA-256 signature derived separately from the backup encryption key. Restore verifies the HMAC, encrypted archive hash, and decrypted plaintext hash before invoking `pg_restore --clean --if-exists --no-owner --no-acl`. Both the CLI and `@moonwitness/orm` helpers remove URL passwords from child-process arguments and pass them through `PGPASSWORD` in the child environment. Plaintext dump/restore temporary files are created with a restrictive child-process umask and mode `0600`; encrypted archives and manifests are also written with mode `0600`.
- **Remaining manifest/operations work:** the manifest is authenticated with an HMAC using the same operator-supplied secret as the archive (through a separate derived signing key), not an asymmetric signature or external KMS. Backup-set completeness, retention, off-host handling, key rotation, backup key escrow/recovery and automated restore drills remain open under [#192](https://github.com/A-L-L-A-H/moonwitness/issues/192). A valid single-database manifest does not prove that the complete production backup set is restorable.
- **Legacy preservation only:** `scripts/backup-sqlite.mjs` and `scripts/restore-sqlite.mjs` remain temporarily for controlled archival/recovery of pre-existing SQLite data while migration is planned. They are not an approved runtime backup path and must not be used as a substitute for PostgreSQL backups or to create new SQLite databases. Remove them after remaining consumers and legacy data conversions are verified.
- **Private local data:** ROCKSOUL and Memory backups must stay in their owner-controlled local trust zones. No automated upload to the public VPS or cross-zone replication is permitted. Their PostgreSQL lifecycle and restore procedures are not yet proven by this CLI change.
- **Completeness:** a production backup set is not complete until every enabled service-owned PostgreSQL database has been inventoried, backed up, independently verified and restored into isolated infrastructure. Disabled/unavailable services must be explicitly reported rather than silently omitted.

### Verified Isolated PostgreSQL Restore Drill (2026-11-19)

- **Environment & Container:** Isolated ephemeral Docker container `mw-pg-drill` running `postgres:16-alpine` (`PostgreSQL 16.16 on x86_64-pc-linux-musl`, Docker server `29.9.3`) bound on loopback `127.0.0.1:55432` with source database `moonwitness` (seeded table `drill_verify_records`, 3 rows: `drill-alpha`, `drill-beta`, `drill-gamma`) and distinct target database `moonwitness_restore_drill`. Because native `pg_dump`/`pg_restore` binaries were not installed on the Windows host `PATH`, `backupPostgresSet` (`scripts/backup-db.mjs`) and `restoreTarget` (`scripts/restore-db.mjs`) invoked `pg_dump` and `pg_restore` inside `mw-pg-drill` via `docker exec` while passing `PGPASSWORD` via environment.
- **Backup & Manifest Verification:** `backupPostgresSet` created a custom-format dump (`pg_dump --format=custom --no-owner --no-acl`, plaintext size `2471` bytes), encrypted it with AES-256-GCM, and emitted HMAC-SHA-256 signed per-database and backup-set manifests (`plaintextHash`: `c1345cc0bd9b6e78b7b526c50d4b62e31cab0db53709bb0b8033b691129b84d1`, `encryptedHash`: `d6000a5faf711a279288e6f6dca95528b3122946b5595f9d5445ac01f0112585`). `node scripts/backup-db.mjs --verify-set <setManifestPath> --max-age-hours 24` returned `Backup set verified: 1 entries`.
- **Restore & Parity Verification:** `restoreTarget` verified the manifest HMAC-SHA-256 signature, encrypted archive SHA-256, and decrypted plaintext SHA-256 (`c1345cc0bd9b6e78b7b526c50d4b62e31cab0db53709bb0b8033b691129b84d1`), then executed `pg_restore --clean --if-exists --no-owner --no-acl` into `moonwitness_restore_drill`. `SELECT COUNT(*) AS row_count FROM drill_verify_records;` returned `3` in `moonwitness_restore_drill` with exact 3-row parity against the untouched `moonwitness` source database (`3` rows), after which the container and temporary drill directory were removed.
- **Boundary:** Private local ROCKSOUL and Memory databases remain excluded from this production-style backup set and were not touched or cross-zone replicated.

## 7. Deployment Rollback & Data Preservation

1. **Named Volumes**: Docker Compose uses named persistent volumes (`postgres-data`, `moonwitness-data`, `radius-data`, `snmp-data`, `syslog-data`, `storage-data`). `docker compose down` will NEVER remove volumes.
2. **Schema Protection**: Schema rollbacks must be forward-fixing migrations. A deployment rollback never rolls database schema backwards or reformats storage.
3. **Pre-Restore Snapshot**: Restoring a database file automatically preserves a `.pre-restore.bak` copy of the existing target before replacing it.
