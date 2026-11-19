---
title: "PaaS Tenancy & Identity Findings"
status: "PROPOSED"
owner: "MW-PAAS P0"
issue: "#560"
epic: "#559"
branch: "dev"
last_reviewed: "2026-11-20"
---

# PaaS Tenancy & Identity Findings (#560)

Evidence-based inventory of the canonical tenant identifier, membership model, auth context,
transaction conventions, migration mechanism and tenant-isolation gaps for the MoonWitness Deploy
PaaS control plane (epic #559, phase P0).

This document is **documentation only**. No runtime code, schema, or behavior was changed.

## 1. Canonical tenant identifier & membership authority

| Item                         | Finding                                                 | Source                                                         |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Canonical tenant ID type     | `string`, slug-shaped                                   | `@moonwitness/orm` `normalizeTenantId()`                       |
| Default tenant               | `"default"`                                             | `DEFAULT_TENANT_ID = "default"` in `@moonwitness/orm`          |
| Tenant ID validation pattern | `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`                     | `@moonwitness/orm` `TENANT_ID_PATTERN`                         |
| Membership authority         | User `company_id` + `company_ids_json` array            | `authUserModel` schema in `packages/addons/src/auth/models.ts` |
| Tenant scoping column        | `tenant_id` on tenant-owned models                      | `@moonwitness/orm` `BaseRepository`, `actor-context.ts`        |
| Actor context                | `ActorContext { actorId, source, requestId, tenantId }` | `@moonwitness/orm` `actor-context.ts`                          |
| System actor                 | `actorId === null`, source `seed` \| `migration`        | `SYSTEM_ACTOR` / `isSystemActor()`                             |
| Tenant selection header      | `x-tenant-id` request header                            | `apps/api/src/middleware/auth.ts` `resolveRequestTenant()`     |

### Evidence: tenant ID normalization

`packages/orm/src/actor-context.ts`:

```ts
export const DEFAULT_TENANT_ID = "default";
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function normalizeTenantId(tenantId?: string | null): string {
  const trimmed = tenantId?.trim();
  if (!trimmed) return DEFAULT_TENANT_ID;
  if (!TENANT_ID_PATTERN.test(trimmed)) {
    throw new Error(`Invalid tenant identifier '${trimmed}'.`);
  }
  return trimmed;
}
```

### Evidence: membership model

`packages/addons/src/auth/models.ts` (`authUserSchema`):

```ts
company_id: z.string().max(64).default("default"),
company_ids_json: z.string().default('["default"]'),
```

The `beforeSave` hook enforces that the current `company_id` is always included in `company_ids_json`.

## 2. Request-to-database flow

1. Client sends request with optional session cookie and `x-tenant-id` header.
2. `apps/api/src/middleware/auth.ts` `resolveAuthenticatedUser()` resolves identity via
   `resolveAuthIdentityFromRequest()` (session cookie or MID Bearer JWT).
3. `resolveRequestTenant()` computes effective tenant:
   - No user → `DEFAULT_TENANT_ID` (`"default"`).
   - User present → `user.tenantId` ?? `user.companyId` ?? `"default"`.
   - If `x-tenant-id` header present: admins may switch to any normalized tenant; non-admins only
     to a tenant in `user.companyIds`; otherwise falls back to default.
4. `typedReq.tenantId` is set and passed into `createActorContext("1", source, req.id, tenantId)`.
5. Repository calls use `{ tenantId }` scope; `BaseRepository` appends `tenant_id` to queries.
6. PostgreSQL transactions are opened per request/session via ORM driver (`pg` client).

### Evidence: tenant resolution in middleware

`apps/api/src/middleware/auth.ts` `resolveRequestTenant()`:

```ts
export function resolveRequestTenant(request: FastifyRequest): string {
  const typedReq = request as AuthenticatedRequest;
  const user = typedReq.user;
  if (!user) return DEFAULT_TENANT_ID;
  const defaultTenant = user.tenantId
    ? normalizeTenantId(user.tenantId)
    : user.companyId
      ? normalizeTenantId(user.companyId)
      : DEFAULT_TENANT_ID;
  const rawHeader = request.headers["x-tenant-id"];
  const candidateHeader = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (typeof candidateHeader === "string" && candidateHeader.trim()) {
    try {
      const normalized = normalizeTenantId(candidateHeader);
      if (user.role === "admin" || user.companyIds?.includes(normalized)) {
        return normalized;
      }
    } catch {
      return defaultTenant;
    }
  }
  return defaultTenant;
}
```

### Evidence: actor context creation

`apps/api/src/middleware/auth.ts` (and addon patterns):

```ts
createActorContext("1", source, req.id, String(req.headers["x-tenant-id"] ?? "default")),
```

## 3. Missing / client-controlled tenant context

| Gap                      | Detail                                                               | Risk                                                                                |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Unauthenticated requests | Resolve to `DEFAULT_TENANT_ID` (`"default"`) with no user            | All unauthenticated traffic shares the default tenant namespace                     |
| `x-tenant-id` header     | Client-controlled; validated against `companyIds` for non-admins     | Header spoofing mitigated by membership check; invalid header falls back to default |
| No explicit tenant       | `normalizeTenantId()` defaults missing/blank to `"default"`          | Implicit default-tenant assignment rather than explicit rejection                   |
| System actors            | `actorId === null` may carry `tenantId` but not enforced as required | Background jobs/seed/migrations can operate without explicit tenant scoping         |

## 4. ORM tenant scoping

| Item                          | Finding                                               | Source                                      |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| Tenant column                 | `tenant_id` synced across models via `BaseRepository` | `@moonwitness/orm`                          |
| `tenant_id` in index          | `{ fields: ["tenant_id", ...] }` composite indexes    | e.g. `account` addon indexes                |
| Raw-query escape hatches      | `getDb().run(sql, params)` available on repository    | `@moonwitness/orm` `driver.ts`              |
| Background-job tenant context | `ops.job` queue carries actor context; lease recovery | `@moonwitness/addon-runtime` `job-queue.ts` |

## 5. Migration & PostgreSQL test commands

| Command                                                  | Purpose                           | Source                      |
| -------------------------------------------------------- | --------------------------------- | --------------------------- |
| `pnpm --filter @moonwitness/orm typecheck`               | TypeScript typecheck              | `packages/orm/package.json` |
| `pnpm --filter @moonwitness/orm test`                    | Vitest unit suite (SQLite driver) | `packages/orm/package.json` |
| `pnpm --filter @moonwitness/orm doctor`                  | ORM doctor diagnostic             | `packages/orm/package.json` |
| `pnpm --filter @moonwitness/api test`                    | API Vitest suite                  | `apps/api/package.json`     |
| `pnpm --filter @moonwitness/api typecheck`               | API typecheck                     | `apps/api/package.json`     |
| `pnpm --filter @moonwitness/api lint`                    | API lint                          | `apps/api/package.json`     |
| `pnpm test:conformance:pg`                               | PostgreSQL conformance run        | root `package.json`         |
| `pnpm gate:quick` / `pnpm gate:local` / `pnpm gate:push` | Gate checks                       | root `package.json`         |

Migration mechanism: model-driven sync via `syncModels()` in `@moonwitness/orm`; versioned SQL migrations
exist per-package (e.g. `packages/mid/migrations/0001_init_mid.sql`). PostgreSQL is the production
direction; SQLite is used for local unit tests.

## 6. Verified facts vs assumptions

### Verified facts (cited from code)

- Tenant ID is a normalized string slug, default `"default"`.
- Membership is user-centric via `company_id` + `company_ids_json`.
- `x-tenant-id` header spoofing is blocked for non-admins by `companyIds` membership check.
- `tenant_id` column is synced across `@moonwitness/orm`, `BaseRepository`, and addon repositories.
- `DEFAULT_TENANT_ID` is applied implicitly when no user or no tenant is present.
- System actors (`seed`/`migration`) have `actorId === null`.

### Assumptions (not yet verified in code, listed rather than guessed)

- PostgreSQL RLS policies are **not** yet enforced for PaaS tables (no `paas_*` tables exist yet).
- Tenant-admin UI for PaaS is not yet implemented.
- Dedicated worker daemon / `SKIP LOCKED` for background jobs is future work.
- Container/WASM sandbox for untrusted code is not yet implemented.

## 7. Unresolved decisions (listed, not guessed)

- Whether PaaS tables reuse the existing `tenant_id` / `company_id` membership model or introduce a
  separate PaaS tenant concept (to be decided in #565–#569).
- Exact RLS role and policy shape for PaaS tables (deferred to #565–#569).
- Whether `x-tenant-id` remains the sole tenant-selection mechanism for PaaS API or a new header is
  introduced (deferred to #566).
- Migration strategy for versioned PaaS schema changes (deferred to #567/#571).

## 8. Files inspected (evidence trail)

- `packages/orm/src/actor-context.ts` — `DEFAULT_TENANT_ID`, `normalizeTenantId`, `ActorContext`
- `packages/orm/src/base-metadata.ts` — model metadata / `tenant_id` sync
- `packages/addons/src/auth/models.ts` — `authUserSchema` (`company_id`, `company_ids_json`)
- `apps/api/src/middleware/auth.ts` — `resolveRequestTenant`, `resolveRequestIdentity`, `authMiddleware`
- `packages/mid/migrations/0001_init_mid.sql` — MID identity seed schema
- `packages/addon-runtime/src/job-queue.ts` — durable job queue foundation
- `docs/architecture/HYBRID-PAAS-READINESS-ASSESSMENT.md` — readiness scorecard
- `docs/architecture/adr-006-three-app-topology-and-trust-zones.md` — trust zones A/B/C
