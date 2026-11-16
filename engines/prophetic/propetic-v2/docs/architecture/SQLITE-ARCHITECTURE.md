# SQLite Architecture

SQLite is the active local database. Current file: `data/sqlite/prophet-research-v2.3.sqlite`.

The database is derived from the locked research dataset and registries. Canonical SQL is in `apps/api/schema.sql` and includes JSON validity checks and lookup indexes.

See `SQLITE-RUNTIME-v2.3.md` for fingerprint synchronization and rebuild policy.
