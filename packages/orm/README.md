# @moonwitness/orm

Reusable PostgreSQL, libSQL/SQLite, and Cloudflare D1 ORM layer for MoonWitness addons and Core API.

## Driver boundary

- **PostgreSQL (`PostgresDriver`):** Primary production driver when `DATABASE_URL` uses `postgres://` or `postgresql://` (via `pg` pool and automatic SQL translation `translateSqlForPostgres` / `isPostgresUrl`).
  - Supported `PRAGMA` translations are strictly limited to safe schema-inspection queries: `PRAGMA table_info(<ident>)` -> `information_schema.columns` and `PRAGMA index_list(<ident>)` -> `pg_indexes`.
  - Integrity and unknown SQLite `PRAGMA` statements (`PRAGMA integrity_check`, `PRAGMA foreign_key_check`, `PRAGMA journal_mode = ...`, etc.) fail closed with an explicit unsupported-operation error. Use `verifyIntegrity()` for PostgreSQL-native `pg_index` (`indisvalid` / `indisready`) and `pg_constraint` (`convalidated`) catalog verification.
- **SQLite / libSQL (`LibSqlDriver`):** Uses `@libsql/client` for local development, tests, and single-file databases (`:memory:` or `file:` paths). Uses SQLite `PRAGMA integrity_check` and `PRAGMA foreign_key_check` inside `verifyIntegrity()`.
- **Cloudflare D1 (`D1Driver`, `createD1DatabaseFromOrm`):** Adapter compatibility layer for D1 bindings and MID plugin integration (`initD1Db`).
- All operations are async (`initDb`, `run/all/get/exec`, repository methods, migrations). Callers must `await` results.
- Transactions are scoped via `getDb().transaction(async (tx) => ...)` and commit/rollback atomically (entity writes + audit writes in the same transaction).
- Lifecycle: `initDb(urlOrConfig)` once per process context, `closeDb()` to release; re-init after close is supported.

## Models and repository

- `defineModel({ name, table, schema, softDelete?, indexes? })` builds DDL, typed repository, and audit hook.
- Framework-owned metadata columns: `id`, `create_uid`, `create_date`, `write_uid`, `write_date`, `status`, `deleted_uid`, `deleted_date`, `version`, `source`, `source_ref`, `tenant_id` (defaults to `'default'`, automatically backfilled on `syncModels()` and scoped via `FindOptions.tenantId` / `ActorContext.tenantId`).
- Business updates cannot overwrite protected metadata; `update/archive/restore/delete` enforce consistent actor/timestamps/version/status transitions and optimistic locking (`ConflictError` on stale/missing version match).
- Soft-delete (`status='deleted'`) is filtered by default in `find/findOne/list/count`; pass `{ includeDeleted: true }` to include.
- Query columns are validated (identifier-safe, known columns only).

## Supported schema types

`z.string`, `z.enum`, `z.literal`, `z.number` (int/float), `z.boolean`, `z.date`, `z.array`, `z.object`, `z.record`, plus `optional/nullable/default/effects` wrappers. Unsupported types are rejected at model definition time.

## Migrations

- `applyMigrations([{ id, up }])` records applied migrations in `_orm_schema_migrations` with checksum and timestamp.
- Deterministic and idempotent: reruns skip already-applied migrations; modified SQL for an applied id is rejected (checksum mismatch).
- Each migration runs in a transaction; failures roll back and are not recorded.

## Exports

Public API is exported from `src/index.ts`: `defineModel`, `BaseRepository`, `syncModels`, `modelRegistry`, `extendModel`, `onModelWrite`, `AUDIT_DDL`, `ormAuditMigrations`, `initDb`, `initD1Db`, `closeDb`, `getDb`, `PostgresDriver`, `isPostgresUrl`, `translateSqlForPostgres`, `LibSqlDriver`, `D1Driver`, `splitSqlStatements`, `createD1DatabaseFromOrm`, `applyMigrations`, `listAppliedMigrations`, `backupDatabase`, `restoreDatabase`, `verifyIntegrity`, `encryptBackupFile`, `decryptBackupFile`, `createActorContext`, `DEFAULT_TENANT_ID`, `normalizeTenantId`, `SYSTEM_ACTOR`, types, and `ConflictError`. Keep exports aligned with implementation; avoid parallel persistence abstractions.
