# MoonWitness Data Ownership, Initialization, Backup and Restore Specification (MW-0036)

> [!NOTE]
> **Reconciliation Note (2026-11-18):** Originally written when Core API used SQLite/libSQL (`moonwitness.db`) across all environments. In the current repository (`docker-compose.yml`, `packages/orm`), production VPS Compose uses **PostgreSQL 16 (`postgres:16-alpine`)** via `PostgresDriver` for Core API & MID, while SQLite/libSQL (`LibSqlDriver`) remains active for local development and for each specialized Rust worker (`radius`, `snmp-poller`, `syslog`, `storage`).

## 1. Executive Summary

MoonWitness implements a modular persistent data architecture on a single VPS, isolating relational core state (PostgreSQL in Compose production, SQLite/libSQL in local development) from per-worker SQLite stores on the Rust ops tier:

- Core API and the integrated MoonWitness Identity (MID) authority (`packages/mid` mounted in `apps/api`) share the primary database configured via `DATABASE_URL` through `@moonwitness/orm`.
- Each Rust telemetry/storage service (`--profile ops`) owns one dedicated SQLite database file on its named volume.
- Local companion services (`apps/rocksoul`, `services/memory`) maintain strictly local-first SQLite / LanceDB stores outside the VPS stack (`ADR-007`).
- All production databases initialize with versioned migrations; there is zero legacy migration from Cloudflare D1 in the VPS runtime.
- No application data or database clients exist on MikroTik / RouterOS.

---

## 2. Service & Database Ownership Matrix

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

## 3. Core API & MID Unified Handle Architecture

1. **Driver Selection (`packages/orm`)**: `@moonwitness/orm` selects `PostgresDriver` when `DATABASE_URL` uses `postgres://` or `postgresql://` (the VPS Compose default) and `LibSqlDriver` for SQLite/libSQL local/test databases (`D1Driver` is also retained for Cloudflare D1 workers compatibility).
2. **D1 Bridge Adapter**: The MID Fastify plugin receives `createD1DatabaseFromOrm(getDb())`, executing MID queries through the same `@moonwitness/orm` connection handle as Core API.
3. **Transaction Isolation**: PostgreSQL uses standard ACID transactions; SQLite/libSQL write transactions serialize via `BEGIN IMMEDIATE` / `transaction("write")`.

---

## 4. Database Engines & SQLite WAL Configuration

PostgreSQL (`postgres:16-alpine`) runs as an internal network service on `moonwitness-internal`. For SQLite/libSQL services (local Core API dev/test and Rust `ops` services `sqlx::sqlite::SqliteConnectOptions`), MoonWitness enforces canonical WAL pragmas:

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

### PostgreSQL (Production Core API & MID) & SQLite Workers

- **PostgreSQL (`postgres:16-alpine` production Core API & MID):** `backupDatabase` / `restoreDatabase` / `verifyIntegrity` in `packages/orm/src/backup.ts` dispatch `pg_dump --format=custom --no-owner --no-acl`, `pg_restore --clean --if-exists --no-owner --no-acl`, and `pg_index` / `pg_constraint` system-catalog integrity checks against `POSTGRES_TEST_URL` (tested in CI `postgres-integration` job) or live Compose `postgres-data`.
- **SQLite Workers (`services/*`) & Local libSQL Mode:** Standard filesystem copy of active SQLite databases causes corrupted snapshot states when WAL files are active. MoonWitness uses SQLite's official `VACUUM INTO`:
  - Generates a fully consolidated, compacted, transactionally consistent single-file database.
  - Does not block live readers or writers.
  - Eliminates reliance on `-wal` and `-shm` sidecars in backup storage.

### Encryption, Integrity Validation & CLI Utilities

- **Integrity Validation:** `verifyIntegrity()` runs `pg_index` (`indisvalid`/`indisready`) & `pg_constraint` (`convalidated`) validation on PostgreSQL handles and `PRAGMA integrity_check` / `PRAGMA foreign_key_check` on SQLite handles; `listDatabaseTables()` abstracts table enumeration across both dialects.
- **Encryption:** Both PostgreSQL custom dumps (`.pgdump.enc`) and SQLite snapshots (`.bak.enc`) are encrypted with AES-256-GCM using `MW_BACKUP_ENCRYPTION_KEY`.
- **Signed Manifest:** Backup runs record timestamp, dialect, database names, table lists, and SHA-256 checksums.
- **Tooling on `dev`:** Use dialect-aware [scripts/backup-db.mjs](../../scripts/backup-db.mjs) / [scripts/restore-db.mjs](../../scripts/restore-db.mjs) (handling both `postgres://` URLs and SQLite file targets) alongside SQLite suite utilities [scripts/backup-sqlite.mjs](../../scripts/backup-sqlite.mjs) (`--out`, `--key`) and [scripts/restore-sqlite.mjs](../../scripts/restore-sqlite.mjs) (`--backup`, `--target`, `--key`), backed by `@moonwitness/orm` helpers.

---

## 7. Deployment Rollback & Data Preservation

1. **Named Volumes**: Docker Compose uses named persistent volumes (`postgres-data`, `moonwitness-data`, `radius-data`, `snmp-data`, `syslog-data`, `storage-data`). `docker compose down` will NEVER remove volumes.
2. **Schema Protection**: Schema rollbacks must be forward-fixing migrations. A deployment rollback never rolls database schema backwards or reformats storage.
3. **Pre-Restore Snapshot**: Restoring a database file automatically preserves a `.pre-restore.bak` copy of the existing target before replacing it.
