# Local API v2.3

Default: `http://127.0.0.1:4310/api/v2`.

Active routes are specified normatively in `API-v2.md`. v2.3 adds prophet-scoped provenance/events/relations/timeline routes plus `source-editions`, `conflicts`, `preference/status`, `relation-scores`, `profile-data-scores`, and `scoring-audit` research endpoints.

The API is read-only (`GET`/`OPTIONS`), loopback-bound by default, backed by the fingerprint-synchronized SQLite derived read-model, and serves the built React SPA same-origin when `apps/web/dist` exists.
