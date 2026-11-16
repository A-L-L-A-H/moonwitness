# Database Architecture

## Active release: v2.3

**SQLite** is the active application database and a reproducible **derived read-model**. The canonical runtime schema is `apps/api/schema.sql`; runtime behavior is specified in `SQLITE-RUNTIME-v2.3.md`.

```text
Research Dataset / Registries
        ↓ SHA-256 seed fingerprint
SQLite local read-model
        ↓ Node local API
React/Vite UI
```

Database changes cannot silently redefine evidence semantics. Runtime DB schema version (`2.3`) and research data schema (`2.0`) are deliberately separate.
