# SQLite Runtime v2.3

SQLite is a **derived local read-model**, not the authority that defines research meaning.

## Canonical schema

`apps/api/schema.sql` is executed by the runtime. Tables are SQLite `STRICT` tables and JSON payload columns enforce `json_valid(payload_json)`. Lookup indexes cover RID root, display name, and document kind.

The runtime stores `db_schema_version = 2.3` separately from research `data_schema_version = 2.0`.

## Schema fingerprint

A SHA-256 `schema_fingerprint` is derived from the canonical SQL file. The read-model is rebuilt when either the database schema version or schema fingerprint differs. This prevents a changed SQL contract from being silently ignored if a version constant was accidentally left unchanged.

## Data synchronization

A separate SHA-256 `seed_fingerprint` covers the research dataset and registries/reports served by the API. Re-seeding occurs when:

- the profile row count differs from 25;
- release version differs;
- seed fingerprint differs.

This prevents an existing `.sqlite` file from silently serving stale research data after source changes.

## Migration policy

Because this database is small and reproducibly derived, incompatible runtime-schema changes rebuild the local read-model instead of pretending to be semantic research migrations. A research schema change still requires its own schema-version decision.
