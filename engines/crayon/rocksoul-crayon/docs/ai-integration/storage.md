# AI Storage Isolation

Rocksoul AI context memory is isolated from the application Chat ORM and business database. The default location is `file:./data/ai.db`, configured by `AI_STORAGE_URL`.

`ai_threads` and `ai_messages` contain model-context history only; canonical business chat remains owned by its existing ORM/API. On startup, a legacy local database with `mastra_threads` or `mastra_messages` is copied to the corresponding `ai_*` table with `INSERT OR IGNORE`. The legacy tables and database file are retained; no destructive migration occurs.
