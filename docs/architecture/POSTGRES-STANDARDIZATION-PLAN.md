# PostgreSQL-Only Standardization Plan & Persistence Inventory (`MW-0805` / `#288`)

> [!IMPORTANT]
> **Owner decision (2026-11-19):** PostgreSQL is the sole approved database engine across MoonWitness cloud (`apps/api`, `packages/mid`, optional `services/*`), local development/testing, and private local companion apps (`apps/rocksoul`, `services/memory`), with strict trust-zone isolation. Binary files, archives, and model weights remain filesystem/object-storage payloads.

## 1. Audited Persistence Inventory (Current Repository State)

| Surface                        | Current Engine(s)                                                         | Verified Source Evidence                                                                        | Target PostgreSQL Boundary                                                          | Conversion Status                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/api` + `packages/mid`    | PostgreSQL (`PostgresDriver`) in prod; `LibSqlDriver` / `D1Driver` bridge | `packages/orm/src/driver.ts`, `packages/addons/src/auth/index.ts`, `apps/api/src/shared/env.ts` | Production `moonwitness` DB (`postgres:16-alpine`), least-privilege `api` role      | Prod guard **IMPLEMENTED** (`PR #390`); D1/SQLite test driver retirement **PENDING** |
| `services/radius` (`ops`)      | SQLite (`sqlx::sqlite`)                                                   | `services/radius/Cargo.toml`, `services/radius/src/db.rs`                                       | Dedicated `radius` DB/schema & `radius_svc` role                                    | **PENDING** (`sqlx` Postgres migration)                                              |
| `services/snmp-poller` (`ops`) | SQLite (`sqlx::sqlite`)                                                   | `services/snmp-poller/Cargo.toml`, `services/snmp-poller/src/db.rs`                             | Dedicated `snmp` DB/schema & `snmp_svc` role                                        | **PENDING** (`sqlx` Postgres migration)                                              |
| `services/syslog` (`ops`)      | SQLite (`sqlx::sqlite`)                                                   | `services/syslog/Cargo.toml`, `services/syslog/src/db.rs`                                       | Dedicated `syslog` DB/schema & `syslog_svc` role                                    | **PENDING** (`sqlx` Postgres migration)                                              |
| `services/storage` (`ops`)     | SQLite (`sqlx::sqlite`) + filesystem objects                              | `services/storage/Cargo.toml`                                                                   | Dedicated `storage` metadata DB + filesystem/S3 object payloads                     | **PENDING** (`sqlx` Postgres migration)                                              |
| `apps/rocksoul` (Zone C)       | SQLite (`rusqlite`)                                                       | `apps/rocksoul/src-tauri/Cargo.toml`, `apps/rocksoul/src-tauri/src/db.rs`                       | Private loopback local PostgreSQL (`rocksoul` DB), zero VPS sync                    | **PENDING** (Windows local PG lifecycle + data conversion)                           |
| `services/memory` (Zone C)     | SQLite (`sqlite3`) + LanceDB + archive files                              | `services/memory/backend/app/db.py`                                                             | Private loopback local PostgreSQL + `pgvector`; original ZIP/JSON/models stay files | **PENDING**                                                                          |

## 2. Non-Database Assets (Remain Files / Object Storage)

- Original ChatGPT/Claude ZIP/JSON archives and source exports (`services/memory`).
- ROCKSOUL git worktrees, generated diffs, and local artifacts (`apps/rocksoul`).
- Object payloads in `services/storage` (`data/objects/` or Google Drive backend).

## 3. Controlled Migration Waves

1. **Wave A (Done / In Progress):** Fail-closed `DATABASE_URL` production guard (`apps/api`), PostgreSQL backup/restore CLI + multi-DB set manifest (`scripts/backup-db.mjs`), and optional `ops` readiness reporting (`apps/api/src/interface/routes/health.routes.ts`).
2. **Wave B (`services/*`):** Migrate `radius`, `snmp-poller`, `syslog`, `storage` from `sqlx::sqlite` to `sqlx::postgres` with isolated databases/roles in `docker-compose.yml` and CI service containers.
3. **Wave C (Zone C Local PostgreSQL):** Validate Windows local PostgreSQL packaging/lifecycle for `apps/rocksoul` and `services/memory` (`pgvector`), convert existing SQLite/LanceDB state with source retention and checksum verification, then remove `LibSqlDriver`/`D1Driver` and `scripts/backup-sqlite.mjs`.
