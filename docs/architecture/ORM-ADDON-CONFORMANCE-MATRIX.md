# ORM & Add-on Engine PostgreSQL Conformance Matrix (`MW-0824` / `#509`)

One command runs the cross-layer gate (API → add-on runtime → ORM → PostgreSQL):

```powershell
$env:TEST_POSTGRES_URL = "postgres://postgres:postgres@127.0.0.1:55433/moonwitness"
pnpm test:conformance:pg
```

Without `TEST_POSTGRES_URL` (or `POSTGRES_TEST_URL`) both suites skip, so `pnpm test` stays fast and does not fall back to SQLite or D1. CI runs the live ORM suite in `Verify PostgreSQL ORM & Backup Integration`.

## Verified evidence (2026-11-20)

- Target: `PostgreSQL 16.16 on x86_64-pc-linux-musl` (disposable `postgres:16-alpine` container, removed after the run).
- `packages/orm/src/__tests__/postgres.live.test.ts`: 1 test passed.
- `apps/api/src/pg-conformance.test.ts`: 5 tests passed, 0 skipped.

## Guarantees and test locations

| Guarantee                                                                                                                                                        | Test (`apps/api/src/pg-conformance.test.ts`)       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Real Fastify host boots on PostgreSQL; health/readiness; actor context; RPC; two-tenant isolation                                                                | `1a`                                               |
| Tenant scope → global + group `ir.rule` → field read/write policy → repository → PostgreSQL for CRUD, archive/restore/delete, `readGroup`, history, RPC, actions | `1b`                                               |
| Defaults, constraints, many2one/many2many + query budget, computed DAG, hook rollback vs after-commit isolation, optimistic locking (`409`), `_orm_audit_log`    | `2`                                                |
| Transaction rollback leaves no audit/outbox rows; `OutboxDispatcher` delivery, backoff, dead-letter, lease recovery                                              | `3`                                                |
| Add-on dependency order, SemVer, `planUpgrade`, migrations before routes, seed failure → `error` state + `503`, `reconcileAddon` recovery                        | `4`                                                |
| PostgreSQL sync, transactions, `verifyIntegrity`, optional `pg_dump`                                                                                             | `packages/orm/src/__tests__/postgres.live.test.ts` |

Out of scope here: backup/restore drills (see [DATA-OWNERSHIP-BACKUP-RESTORE.md](./DATA-OWNERSHIP-BACKUP-RESTORE.md)) and the Rust service conversions tracked in [POSTGRES-STANDARDIZATION-PLAN.md](./POSTGRES-STANDARDIZATION-PLAN.md).
