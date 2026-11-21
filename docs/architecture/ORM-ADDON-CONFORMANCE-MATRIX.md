# ORM & Add-on Engine PostgreSQL Conformance Matrix (`MW-0824` / `#509`, `MW-0825` / `#530`, `MW-0826` / `#531`, `MW-0827` / `#532`)

One command runs the strict cross-layer gate (API → add-on runtime → ORM → PostgreSQL):

```powershell
$env:TEST_POSTGRES_URL = "postgresql://moonwitness:moonwitness@127.0.0.1:55432/moonwitness"
pnpm test:conformance:pg
```

`pnpm test:conformance:pg` fails fast (`exit 1`) unless `TEST_POSTGRES_URL` or `POSTGRES_TEST_URL` is explicitly set to a `postgres://` / `postgresql://` URL (it never falls back to `DATABASE_URL`, SQLite, or D1, and sets `MW_REQUIRE_POSTGRES_CONFORMANCE=1` so skipped live tests are impossible). Direct `pnpm test` runs skip the PG live files when `TEST_POSTGRES_URL` / `POSTGRES_TEST_URL` and `MW_REQUIRE_POSTGRES_CONFORMANCE=1` are absent so offline unit runs remain fast. CI runs the full `pnpm test:conformance:pg` gate plus ORM/backup checks in the `postgres-integration` job.

## Verified evidence (2026-11-20)

- Target: PostgreSQL 16 (`postgres:16-alpine` disposable container, removed after the run).
- `packages/orm/src/__tests__/postgres.live.test.ts`: 1 test passed, 0 skipped (covers `syncModels`, `extendModel`, transactions, `verifyIntegrity` including `NOT VALID` FK constraints and `INVALID` indexes, fail-closed `PRAGMA` rejection, and optional `pg_dump`).
- `apps/api/src/pg-conformance.test.ts`: 6 tests passed, 0 skipped.

## Guarantees and test locations

| Guarantee                                                                                                                                                        | Test (`apps/api/src/pg-conformance.test.ts`)       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Real Fastify host boots on PostgreSQL; health/readiness; actor context; RPC; two-tenant isolation                                                                | `1a`                                               |
| Tenant scope → global + group `ir.rule` → field read/write policy → repository → PostgreSQL for CRUD, archive/restore/delete, `readGroup`, history, RPC, actions | `1b`                                               |
| Group-aware `readGroups` & `writeGroups` (`auth_users.group_keys_json`, implied `res.groups`, OR semantics, relation target policy, `/upsert`, search, `/rpc`)   | `1c`                                               |
| Defaults, constraints, many2one/many2many + query budget, computed DAG, hook rollback vs after-commit isolation, optimistic locking (`409`), `_orm_audit_log`    | `2`                                                |
| Transaction rollback leaves no audit/outbox rows; `OutboxDispatcher` delivery, backoff, dead-letter, lease recovery                                              | `3`                                                |
| Add-on dependency order, SemVer, `planUpgrade`, migrations before routes, seed failure → `error` state + `503`, `reconcileAddon` recovery                        | `4`                                                |
| PostgreSQL sync, transactions, `verifyIntegrity` (unvalidated FK & invalid index detection), fail-closed unsupported `PRAGMA`, optional `pg_dump`                | `packages/orm/src/__tests__/postgres.live.test.ts` |

Out of scope here: backup/restore drills (see [DATA-OWNERSHIP-BACKUP-RESTORE.md](./DATA-OWNERSHIP-BACKUP-RESTORE.md)) and the Rust service conversions tracked in [POSTGRES-STANDARDIZATION-PLAN.md](./POSTGRES-STANDARDIZATION-PLAN.md).
