# MoonWitness SQLite Data Ownership, Initialization, Backup and Restore Specification (MW-0036)

## 1. Executive Summary

MoonWitness implements a modular persistent data architecture on a single VPS, using SQLite/libSQL as the standard storage engine. To guarantee transactional stability, data hygiene, and fault isolation:

- Each service owns exactly one designated SQLite database file.
- There is no monolithic shared database file across unrelated services.
- Core API and the integrated MoonWitness Identity (MID) authority share a single database (`moonwitness.db`) through one shared connection pool and transaction manager (`@moonwitness/orm`).
- All production databases initialize empty with versioned SQL migrations; there is zero legacy migration from Cloudflare D1.
- No application data or database clients exist on MikroTik / RouterOS.

---

## 2. Service & Database Ownership Matrix

| Service                         | Database File    | Docker Volume Mount      | Owning Runtime                          | Authorized Consumers               | Primary Tables                                                                                                                                                                                                               |
| ------------------------------- | ---------------- | ------------------------ | --------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core API & MID**              | `moonwitness.db` | `moonwitness-data:/data` | Node.js Fastify (`apps/api`)            | `apps/api`, `apps/mid`             | `users`, `sessions`, `_orm_audit_log`, `command_center_workflows`, `command_center_alerts`, `igate_nodes`, `igate_probe_events`, `mid_signing_keys`, `mid_clients`, `mid_auth_codes`, `mid_refresh_tokens`, `mid_audit_logs` |
| **RADIUS Service**              | `radius.db`      | `radius-data:/data`      | Rust axum/sqlx (`services/radius`)      | `services/radius` exclusively      | `users` (NAS credentials), `radius_logs` (auth/acct audit events)                                                                                                                                                            |
| **SNMP Poller**                 | `snmp.db`        | `snmp-data:/data`        | Rust axum/sqlx (`services/snmp-poller`) | `services/snmp-poller` exclusively | `devices`, `targets`, `samples` (MRTG time series)                                                                                                                                                                           |
| **Syslog Collector**            | `syslog.db`      | `syslog-data:/data`      | Rust axum/sqlx (`services/syslog`)      | `services/syslog` exclusively      | `syslog_messages` (bounded ring buffer)                                                                                                                                                                                      |
| **Object Storage** _(Deferred)_ | `storage.db`     | `storage-data:/data`     | Rust axum/sqlx (`services/storage`)     | `services/storage` exclusively     | `buckets`, `objects`, `multipart_uploads`, `upload_parts`                                                                                                                                                                    |
| **Memory**                      | `memory.db`      | Local user directory     | Python FastAPI (`apps/memory`)          | Local desktop only                 | Excluded from VPS production stack                                                                                                                                                                                           |
| **MikroTik RouterOS**           | _None_           | _None_                   | RouterOS                                | _None_                             | Zero persistent application database                                                                                                                                                                                         |

---

## 3. Core API & MID Unified Handle Architecture

To eliminate file-locking races and corrupted WAL states:

1. **Single Handle**: `@moonwitness/orm` initializes a single `LibSqlDriver` (`getDb()`).
2. **D1 Bridge Adapter**: The MID Fastify plugin receives `createD1DatabaseFromOrm(getDb())`, allowing MID queries to execute on the exact same underlying connection pool and transaction manager as the Core API.
3. **Transaction Isolation**: All write transactions use SQLite's native `BEGIN IMMEDIATE` / `transaction("write")` semantics to serialize writers and prevent `SQLITE_BUSY` contention.

---

## 4. SQLite Engine & WAL Configuration

Every service engine (Node.js `@moonwitness/orm` and Rust `sqlx::sqlite::SqliteConnectOptions`) enforces the canonical SQLite pragmas:

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

### Online Non-Blocking Backups

Standard filesystem copy of active SQLite databases causes corrupted snapshot states when WAL files are active. MoonWitness uses SQLite's official `VACUUM INTO`:

- Generates a fully consolidated, compacted, transactionally consistent single-file database.
- Does not block live readers or writers.
- Eliminates reliance on `-wal` and `-shm` sidecars in backup storage.

### Security & Integrity

- **Integrity Validation**: Runs `PRAGMA integrity_check` and `PRAGMA foreign_key_check` on the snapshot before encryption.
- **Encryption**: Backups are encrypted with AES-256-GCM using `MW_BACKUP_ENCRYPTION_KEY`.
- **Signed Manifest**: Every backup run writes a JSON manifest recording timestamp, database names, table lists, plaintext SHA-256 hashes, and ciphertext SHA-256 hashes.

### Disaster Recovery Runbook

```bash
# 1. Run full automated backup
node scripts/backup-sqlite.mjs --out /var/backups/moonwitness --key "$MW_BACKUP_ENCRYPTION_KEY"

# 2. Restore database into target path with integrity verification
node scripts/restore-sqlite.mjs \
  --backup /var/backups/moonwitness/moonwitness.db.<TIMESTAMP>.bak.enc \
  --target /data/moonwitness.db \
  --key "$MW_BACKUP_ENCRYPTION_KEY"
```

---

## 7. Deployment Rollback & Data Preservation

1. **Named Volumes**: Docker Compose uses named persistent volumes (`moonwitness-data`, `radius-data`, `snmp-data`, `syslog-data`). `docker compose down` will NEVER remove volumes.
2. **Schema Protection**: Schema rollbacks must be forward-fixing migrations. A deployment rollback never rolls database schema backwards or reformats storage.
3. **Pre-Restore Snapshot**: Restoring a database file automatically preserves a `.pre-restore.bak` copy of the existing target before replacing it.
