---
title: "MoonWitness Deploy Tenant and Identity Source Audit"
status: "DRAFT"
owner: "Principal Architecture"
last_reviewed: "2026-11-20"
scope: "Point-in-time source audit of active tenant identity, request context, ORM scoping, background jobs, transactions, and migrations in apps/api, apps/edge, packages/addons/auth, packages/addon-runtime, packages/mid, and packages/orm. Does not define the future PaaS contract or certify deployed Cloudflare controls."
sources:
  - "AGENTS.md"
  - "docs/architecture/adr-006-three-app-topology-and-trust-zones.md"
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/governance/DOCUMENTATION_QUALITY_STANDARD.md"
  - "Issue #559 — MoonWitness Deploy"
  - "Issue #560 — PaaS tenancy and identity assumptions audit"
---

# MoonWitness Deploy Tenant and Identity Source Audit

> **Audit snapshot:** `A-L-L-A-H/moonwitness`, branch `dev`, commit `645bd36ea580cb1feee78c2916451dac9715cc11`, reviewed 2026-11-20.
>
> **Evidence discipline:** This is a static source inspection, not a runtime certification. Paths and declarations below were inspected at the pinned commit. No local test, PostgreSQL session, Cloudflare account policy, or production environment was executed or inspected as part of this audit. Runtime behavior and deployed ingress controls remain unverified unless an existing source-level test is cited.

## 1. Executive result

**PaaS tenant-isolation gate: NO-GO.** The active code has useful application-level tenant primitives, but it does not yet establish the public multi-tenant security boundary required by issue #559.

The most important findings are:

1. The current tenant key is a **string slug**, stored in ORM metadata as `tenant_id`. The active company/tenant registry is `res_companies` (`res.company`); `resTenantModel` is an alias of that model, not a separate membership table.
2. User-to-company access is currently carried by `auth_users.company_id` and a JSON string `auth_users.company_ids_json`. The active auth addon does not define a normalized tenant-membership model with status, lifecycle, or tenant-local membership role.
3. Cookie-session identity includes company fields, but the active MID access-token issuer does not emit a tenant claim. The API Bearer verifier can read optional `tenant_id`/`tid` claims, but does not recover `companyId`/`companyIds` from the user record for Bearer callers. These two auth paths therefore resolve tenant context differently.
4. API tenant selection is partly client-controlled through `X-Tenant-Id`. Non-admins are checked against their in-memory `companyIds` array; global admins can select any syntactically valid slug without a membership or active-company lookup in this middleware.
5. `ScopedRepository` provides strong application-level scoping when used with an explicit actor, but the lower-level `BaseRepository` accepts optional tenant filters and direct `getDb()` SQL has no automatic tenant predicate. PostgreSQL RLS is not established by the inspected runtime source.
6. The API Edge Worker builds its actor directly from `X-Tenant-Id` and `X-Actor-Id`; this handler contains no principal-authentication step before project routes. A Cloudflare Access or equivalent external gate may exist outside this repository, but that is **UNKNOWN**.
7. Ordinary repository operations are not yet guaranteed to join the active driver's transaction callback. This is separately tracked by open issue [#544](https://github.com/A-L-L-A-H/moonwitness/issues/544).

This audit changes no runtime code, schema, or behavior. It records the current state and the decisions that must be resolved before implementation agents are authorized to build the PaaS tenancy layer.

## 2. Canonical tenant and identity source of truth

### 2.1 Identifier and registry

| Concern | Source-level finding | Evidence |
| --- | --- | --- |
| ORM tenant metadata | `BaseMetadata.tenant_id: string`; legacy/model sync adds it as `TEXT NOT NULL DEFAULT 'default'`. | `packages/orm/src/base-metadata.ts`, `packages/orm/src/sync.ts` |
| Default tenant | `DEFAULT_TENANT_ID = "default"`. | `packages/orm/src/actor-context.ts` |
| Identifier grammar | Trimmed string slug matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (maximum 64 characters). | `packages/orm/src/actor-context.ts` |
| Company/tenant registry | `resCompanyModel`, model name `res.company`, table `res_companies`, `slug` max 64, unique slug; `resTenantModel = resCompanyModel`. | `packages/addon-runtime/src/ir-models.ts` |
| User's current company | `auth_users.company_id`, string default `"default"`. | `packages/addons/src/auth/models.ts` |
| User's allowed companies | `auth_users.company_ids_json`, JSON-encoded string array defaulting to `["default"]`. | `packages/addons/src/auth/models.ts`, `packages/addons/src/auth/service.ts` |

**Current-code conclusion:** use the string slug as the existing tenant identifier when describing current runtime behavior. This is a source observation, not approval of the long-term PaaS identifier. Whether the PaaS contract preserves slugs as immutable tenant IDs or introduces an opaque tenant UUID with a slug mapping is an **OPEN ARCHITECTURE DECISION** for #561.

### 2.2 Membership authority

- The active auth-user model stores the current company and permitted company IDs on `auth_users`; `mapUserRecord()` parses `company_ids_json` into `AuthUser.companyIds`.
- `createAuthMidIdentityStore()` adapts the auth store to MID. Its `PublicUser` result contains ID, username, email, role, and display name; the MID `PublicUser` type contains no tenant or membership fields.
- No active `tenant_memberships` or `tenant.membership` model was found in the inspected runtime package paths. This means the current source does not expose a normalized membership row with an explicit active/suspended status or membership-local role.
- `res.company.is_active` exists, but `resolveRequestTenant()` only normalizes a requested slug and checks the user's role/array; it does not query the company registry to verify that the selected company exists or is active.

**Authority conclusion:** the effective non-admin membership list is currently the `company_ids_json` value on the authenticated user record. There is no separately modeled, request-time active membership authority in the inspected API auth path. Whether that list is a temporary compatibility source or the permanent source of truth is **OPEN**.

## 3. Authenticated API request-to-database flow

The active API request path is:

1. `resolveAuthIdentityFromRequest()` in `packages/addons/src/auth/mid-jwt.ts` tries the `mw_session` cookie and then a MID Bearer token.
2. Cookie-session resolution calls `getSessionWithUser()`; the returned identity includes `companyId` and `companyIds` from the persisted auth user.
3. Bearer resolution verifies the ES256 token and user. It adds `tenantId` only when the verified token contains `tenant_id` or `tid`; it does not copy `companyId`/`companyIds` from the loaded user into the returned Bearer identity.
4. `resolveRequestTenant()` in `apps/api/src/middleware/auth.ts` uses `user.tenantId`, then `user.companyId`, then `default`. It reads `x-tenant-id`; an admin may select any normalized value, while a non-admin may select only a value in `user.companyIds`. An invalid or unauthorized selection silently falls back to the default tenant rather than returning a distinct tenant-selection error.
5. `apps/api/src/bootstrap.ts` exposes the auth bridge. Its `resolveActorContext` builds an ORM actor using the authenticated user and `resolveRequestTenant()`.
6. Addon routes that call `resolveActorTenantFromBridge()` then pass the result as `FindOptions.tenantId` to repository reads/counts. For example, the CRM, CAB, project, timeline, and other routes use this pattern.
7. The ORM adds `tenant_id = ?` when a repository query receives `FindOptions.tenantId`. The API's configured PostgreSQL URL selects `PostgresDriver` through `initDb()`; this database-driver selection does not itself establish RLS or tenant membership.

### 3.1 MID token claim mismatch

The active issuer in `packages/mid/src/app.ts` builds access and ID token claims from `sub`, `iss`, `aud`, timestamps, token-use, scope, username, name, email, and global role. It does **not** add `tenant_id`, `tid`, `company_id`, or membership claims. The discovery document's supported claims list likewise does not advertise tenant claims.

The API verifier in `packages/addons/src/auth/mid-jwt.ts` supports reading optional `tenant_id`/`tid`, but the active issuer does not emit either. A normal Bearer access token from this issuer therefore reaches `resolveRequestTenant()` without a tenant or company list and resolves to `default`, unless a future issuer or an external token source supplies the optional claim.

This is a concrete difference between cookie and Bearer identity. PaaS design must explicitly decide whether tenant selection is resolved from an authoritative membership query, a signed token claim backed by current membership state, or another approved mechanism. Do not infer that current OIDC tokens carry tenant membership.

### 3.2 Existing API tenant tests

`apps/api/src/architecture.test.ts` contains an API-GATE-08 cross-tenant smoke test: it writes under tenant A and checks that tenant B cannot read the created audit, timeline, workflow, memory, and codex data. It also has an API-GATE-12 positive case where a non-admin with `companyIds: ["default", "tenant-a"]` can select `tenant-a`.

The inspected API-GATE-12 block demonstrates an allowed selection; it does not demonstrate a denial case for a non-member tenant. These tests are useful source-level evidence of selected API isolation paths, but they are not proof of complete route coverage, raw-SQL isolation, database RLS, or public PaaS readiness.

## 4. ORM isolation and escape hatches

### 4.1 Tenant-bound repository path

- `BaseRepository.find/count/readGroup` accepts tenant filters as optional options. SQL tenant predicates are added when the caller supplies a tenant ID.
- `repository.forActor(actor)` returns `ScopedRepository`.
- A non-system actor passed to `ScopedRepository` must have an explicit tenant ID (`requireActorTenantId`); query operations bind reads/count/group reads to that tenant, and write methods pass the tenant-bearing actor to the underlying repository.
- A caller cannot rebind an already scoped repository to a different tenant; the wrapper raises `TENANT_MISMATCH`.
- System seed/migration actors may be unscoped by design. This is a privileged internal path and must not be reused for public tenant requests.

### 4.2 Remaining bypass surfaces

- Direct use of `BaseRepository` is not tenant-bound unless each query passes `tenantId`; the type-level options do not make the predicate mandatory.
- `getDb()` exposes `run/all/get/exec` and the driver transaction API. Raw SQL has no automatic tenant predicate or tenant RLS context attached by `ActorContext`.
- `packages/addon-runtime/src/job-queue.ts` and other packages contain deliberate raw SQL for queue/outbox operations. Each raw statement and handler must carry/verify tenant context explicitly.
- Application-level repository filters are not a replacement for PostgreSQL Row-Level Security. The readiness assessment itself records Postgres RLS as deferred; issue #559 requires forced RLS and a non-owner, non-`BYPASSRLS` application database role for public PaaS workloads.

**Conclusion:** the ORM has tenant-safe primitives when callers use them correctly, but no source evidence establishes a universal tenant predicate for every repository call and raw SQL statement, and no inspected code establishes the required PaaS PostgreSQL RLS boundary.

## 5. Background jobs and outbox

- `ops.job` uses the ORM's base `tenant_id` metadata. `claimNextJob()` filters by tenant only when `ClaimJobOptions.tenantId` is provided.
- `processNextJob()` creates a handler actor using the claimed job's `tenant_id`. This carries the claimed tenant into handler work when that function is used.
- A system worker may claim globally when no tenant filter is provided; this is a privileged dispatcher pattern, not tenant isolation on its own. Enqueue callers and job handlers still need to preserve the job's tenant and actor boundaries.
- The outbox stores a `tenant_id`, but `enqueueOutboxEvent()` defaults it to `default` when callers omit it. Subscriber callbacks receive the event, not an automatically installed ORM actor/tenant context. Any tenant-owned subscriber work must explicitly build and use the event's tenant context.
- Raw outbox delivery queries use `getDb()`; they are cross-tenant dispatcher operations and must remain restricted to the trusted worker boundary.

**Conclusion:** the ordinary job processor has a tenant hand-off mechanism, but the queue/outbox APIs permit omitted tenant values and do not establish a universal ambient tenant context for handlers.

## 6. Database transactions and migrations

### 6.1 Transaction context

`OrmDriverHandle.transaction(fn)` supplies a transaction executor to its callback. The ORM driver uses `AsyncLocalStorage` for query-budget accounting, not for an active database transaction. Repository operations resolve the process-level driver through `getDb()`; the current public API does not guarantee that a repository call made inside a transaction callback uses the callback executor.

This gap is tracked by open issue [#544 — Bind repository operations to the active ORM transaction](https://github.com/A-L-L-A-H/moonwitness/issues/544). Until that API contract is implemented and verified with overlapping PostgreSQL transactions, PaaS code must not assume repository calls automatically join a caller's transaction. Tenant context and transaction context must be designed to compose; one must not overwrite or impersonate the other.

### 6.2 Migration mechanism and exact conformance command

- `syncModels()` is the model/schema synchronization mechanism and adds the shared metadata columns, including `tenant_id`, with a default of `default`.
- `applyMigrations()` is the exported versioned SQL migration mechanism. It records migration IDs, owners, checksums, and timestamps in `_orm_schema_migrations`; it rejects checksum changes and runs each new migration in a database transaction.
- No separate PaaS-only migration runner was identified in the inspected active package scripts. New PaaS DDL should use the canonical ORM migration contract rather than invent another migration ledger.
- The exact root PostgreSQL conformance command is `pnpm test:conformance:pg`. It requires an explicitly provided `TEST_POSTGRES_URL` or `POSTGRES_TEST_URL` using a PostgreSQL URL. The runner intentionally refuses silent SQLite/D1 or `DATABASE_URL` fallback.

Relevant scoped package scripts include `pnpm --filter @moonwitness/orm test`, `pnpm --filter @moonwitness/api test`, and `pnpm --filter @moonwitness/mid test`; the repository documentation validator is `pnpm docs:check`. These are available commands, not claims that this audit executed them.

## 7. Edge worker ingress boundary

The active `apps/edge/src/index.ts` route handler sets CORS origin to `*` and allows `X-Tenant-Id` and `X-Actor-Id`. Before constructing a project repository, `resolveActor()` takes both values directly from the incoming request headers (defaulting when absent) and creates an ORM actor. No user/session/JWT authentication call appears in this handler before tenant-scoped project routes.

The tracked `apps/edge/wrangler.jsonc` declares the Worker entry point, assets, D1 binding, and default GitHub repository; it does not declare a repository-managed Access policy or authentication middleware. A Cloudflare dashboard policy, account-level control, or upstream gateway may still protect the deployed Worker, but that is outside this repository snapshot and remains **UNKNOWN**.

**PaaS implication:** do not expose this handler as an untrusted public tenant API until its caller identity and tenant authority are enforced in code or independently evidenced by an approved, testable ingress policy.

## 8. Gaps and unresolved decisions

| Priority | Gap / decision | Why it blocks public PaaS | Required owner decision or evidence |
| --- | --- | --- | --- |
| P0 | Define the tenant identifier contract (existing string slug vs. opaque tenant ID + slug mapping). | Every database row, API contract, membership record, node protocol, and domain binding depends on a stable tenant key. | #561 architecture ADR. |
| P0 | Define normalized membership authority and lifecycle. | JSON company IDs do not model active/suspended membership, provenance, or tenant-local roles. | #561; threat model #562. |
| P0 | Reconcile cookie and Bearer tenant context. | Active MID tokens do not carry tenant claims; API verifier and resolver produce different identity shapes. | #561 and #562; add tests for both paths. |
| P0 | Define who may select a tenant and what happens for invalid/non-member/inactive tenant IDs. | Admin role currently bypasses membership lookup; middleware silently falls back for invalid or unauthorized selections. | #561/#562; explicit permission model and deny behavior. |
| P0 | Authenticate the Edge Worker caller and prove deployed ingress policy. | Caller-supplied tenant/actor headers are currently trusted by the handler. | #562 threat model and an independently testable ingress design. |
| P0 | Establish PostgreSQL RLS on all tenant-owned PaaS tables, with forced RLS and a constrained DB role. | Application filters alone cannot defend against missed route/raw-SQL predicates. | #562 threat model and #564 security gate; migration and two-tenant integration tests. |
| P0/P1 | Close the repository transaction-binding gap. | A transaction callback does not guarantee ORM repository calls join that transaction; atomic membership and provisioning operations need a reliable boundary. | Coordinate with #544; do not duplicate its ORM files. |
| P1 | Define tenant behavior for global job workers and outbox subscribers. | Optional tenant fields and implicit `default` values make tenant propagation dependent on each caller. | Include in #561/#562 and verify with cross-tenant worker tests. |
| P1 | Audit all direct SQL and unscoped `BaseRepository` call sites. | Tenant scoping is explicit at call sites, not automatic on every database operation. | Scoped implementation work after #564; keep ownership per package/path. |

### Non-authoritative legacy material

`engines/empire-origin/allah-foundation/docs/TENANCY_AND_WORK_MODEL.md` describes a `tenant_memberships` design, but `engines/*` is not the active API/MID runtime boundary under the repository topology and provenance rules. It is not evidence that the active auth addon currently implements that schema. Do not copy its design into runtime without an accepted decision.

## 9. Verification boundary

| Check | Audit result |
| --- | --- |
| Required code paths exist at pinned `dev` commit | **SOURCE-INSPECTED** |
| Required scripts/migration APIs exist | **SOURCE-INSPECTED** |
| Local focused tests/typecheck/lint | **NOT RUN** — no repository shell/worktree execution is available in this audit session |
| Live PostgreSQL tenant/RLS tests | **NOT RUN** — no test database credentials or live DB execution |
| Deployed Cloudflare Access / Worker ingress controls | **UNKNOWN** — account-level policies are not in repository source |
| Full route/raw-SQL/job tenant coverage | **NOT CERTIFIED** — requires implementation-level test inventory and execution |

The PR CI is the required automated validation for this documentation-only change. A successful documentation check does not certify the security behavior listed above.

## 10. Required implementation order

Respect the PaaS epic's dependency graph and file ownership:

1. **#560 (this audit):** record the existing facts and unknowns.
2. **#561:** obtain the architecture decision for tenant identity, memberships, auth context, control/build/workload planes, and transaction boundaries.
3. **#562 and #563:** threat model and node-agent protocol may proceed in parallel only after #561, with separate path ownership.
4. **#564:** security gate checklist follows the accepted threat model and protocol.
5. **#615:** local/low-cost agent operating playbook starts only after #561 and #564 are closed; the playbook must enforce bounded issues, separate file ownership, validation, and stop conditions.

This order does not authorize public workload execution, production deployment, schema rollout, or automatic PR merging. Those actions remain separately gated by the parent epic and human review.
