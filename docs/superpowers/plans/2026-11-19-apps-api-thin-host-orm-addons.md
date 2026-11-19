# `apps/api` Thin-Host & ORM/Addon Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink `apps/api` from an 8,556-LOC fat monolith into a ~1,050-LOC thin Fastify host kernel by fixing all 5 P0 ORM/addon defects, removing ~1,150 LOC of dead/ghost code, enforcing `tenant_id` across all routes, moving the remaining 10 hollow-addon route/service stacks into `@moonwitness/addons`, and locking boundaries with an automated fitness gate.

**Architecture:** `@moonwitness/addon-runtime` defines a single `AddonHostContext` contract (`auth`, `rateLimit`, `proxy`, `mid`, `seedDemo`), derives `/_meta/*` dynamically from `modelRegistry` + `ir_*`, and enforces live `isModelEnabled()` checks on `/api/v1/m/:model`. Every one of the 15 domain addons in `@moonwitness/addons` becomes fully self-contained (models, views, rules, services, routes, seeds, verified `actionBindings`) and exports `createPlatformAddons(host)`. `apps/api` retains only process bootstrap, env validation, DB init/close, Fastify kernel middleware, auth/tenant bridge, unified rate limiter, `/health*`/`/readyz`/`/metrics`, and `AddonRuntimeController.syncAll()`.

**Tech Stack:** TypeScript 5.9, Zod 4, Fastify 5, `@moonwitness/orm` (SQLite/libSQL, PostgreSQL, D1 adapter), `@moonwitness/addon-runtime`, `@moonwitness/addons`, `@moonwitness/mid`, `@moonwitness/ai`, `@moonwitness/contracts`, Vitest 4, tsup 8.

**Spec:** [2026-11-18-odoo-plus-addon-system-design.md](../specs/2026-11-18-odoo-plus-addon-system-design.md) (`ACCEPTED`) & Audit Report `apps-api-orm-addon-audit.md` (`HEAD = caf7061`).

## Global Constraints

- Stay strictly on local Git branch `dev` (`AGENTS.md`); zero extra local branches; never leave stray `.db*` files in `apps/api` cwd (`mkdtemp` in tests).
- Zero manual SQL migration files for domain models (`applyMigrations(model.ddl)` forbidden) — `syncModels()` via `AddonRuntimeController.syncAll()` is the sole schema synchronizer.
- Preserve every active HTTP endpoint path, status code, response envelope, RBAC rule, and Pact contract under `/api/v1/*` and `/_meta/*`.
- Maintain SQLite/libSQL AND PostgreSQL (`PostgresDriver` / `translateSqlForPostgres`) compatibility on every query.
- Keep `tsup` bundle safety in `apps/api/package.json`: because `tsup.config.ts` uses `noExternal: [/^@moonwitness\//]`, external native/driver deps dynamically imported by bundled workspace packages (`@libsql/client`, `pg`, `bcrypt`) must remain resolvable at runtime by `node dist/index.js`; only remove workspace/plugin packages that are fully bundled or eliminated (`@fastify/rate-limit`, `@moonwitness/ai`, `@moonwitness/mid`).
- Zero mock data, zero placeholder functions, zero `// TODO`, zero silent empty `catch {}` blocks hiding schema validation failures.

## Review Focus

1. **Disabled addon bypass via `/api/v1/m/:model`:** Disabling an addon via `POST /api/v1/_meta/addons/:name/disable` must reject BOTH its custom routes AND `/api/v1/m/<model>` with `503 { code: "ADDON_DISABLED" }` — pinned by Task 2 & Task 5 tests.
2. **Schema extensibility without migration checksum crashes:** Calling `extendModel("riot_ai.provider_config", ...)` after initial boot must auto-sync via `syncModels()` without throwing `_orm_schema_migrations` checksum mismatch — pinned by Task 3 test.
3. **Cross-tenant data isolation across custom & generic routes:** Records written under `tenant-a` via `timeline`, `command-center`, `probes`, `memory`, `audit`, and `/m/:model` must never be readable or mutable by `tenant-b` — pinned by Task 4, Task 6, Task 7, and Task 12 tests.
4. **SNMP ORM mirror fidelity:** `POST /snmp/devices` with `version: "v3"` must persist `snmp_version: "v3"` (not silently default to `"v2c"`), and `POST /snmp/devices/:id/targets` must persist a valid `snmp_targets` row with `label` and `interval_sec` — pinned by Task 3 test.
5. **Compiled production bundle (`dist/index.js`) runtime resolution:** After pruning `apps/api/package.json`, `pnpm --filter @moonwitness/api build` must succeed and loading `apps/api/dist/index.js` modules under Node must not hit `ERR_MODULE_NOT_FOUND` — pinned by Task 11 verification.

---

## Target File Structure

### `@moonwitness/addon-runtime` (`packages/addon-runtime/src/`)

- Create `fastify.d.ts` — module augmentation for `FastifyInstance.midMounted`, `FastifyRequest.{user,tenantId,cookies,traceparent}`, and `FastifyReply.{setCookie,clearCookie}` so self-hosted addons typecheck cleanly outside `apps/api`.
- Create `host-context.ts` — `AddonHostContext`, extended `BaseAddonAuthBridge` (`optionalAuthenticate`, `resolveActorContext`), `HostRateLimitFactory`, `HostProxyBridge`, `HostMidConfig`.
- Create `upstream.ts` — shared `resolveUpstreamServiceUrl`, `getEdgeLoopbackErrorPayload`, `getUpstreamBridgeHeaders`, `resolveTraceContext`, `buildChildTraceparent`, `isBlockedRuntimeHost`, `validateServiceEndpointUrl`, `createUpstreamForwarder`.
- Modify `runtime.ts` — `isModelEnabled(modelName)`, model-to-addon ownership map.
- Modify `generic-crud.ts` — enforce `runtime.isModelEnabled(desc.name)` (`503 ADDON_DISABLED`).
- Modify `metadata.ts` — `buildMetadataRegistryFromModels(runtime)` auto-derived from `modelRegistry` + active `ir_*`, dynamic OpenAPI paths.
- Modify `index.ts` — mount `registerMetadataRoutes` under `apiPrefix` as well as root; export new runtime helpers.

### `@moonwitness/addons` (`packages/addons/src/`)

- Modify `package.json` — add `@moonwitness/core`, `@moonwitness/ai`, `fastify` (peer/dep) so all 15 addons compile cleanly standalone.
- Modify `index.ts` — export `createPlatformAddons(host: AddonHostContext): AddonDefinition[]`.
- Self-host routes/services + align `actionBindings` in the 10 currently hollow addons:
  - `timeline/{schemas,routes}.ts`, `repository.ts` (`tenantId` scoped), `views.ts`, `index.ts`
  - `command-center/{service,routes}.ts`, `index.ts`
  - `probes/{service,routes}.ts`, `index.ts`
  - `auth/{mid-jwt,bff,admin-routes,routes}.ts`, `service.ts` (dedup audit), `index.ts`
  - `control/{native-auth,upstream,routes}.ts`, `index.ts` (wired to ADR-010 `createControlScheduler`)
  - `storage/{sigv4,routes}.ts`, `index.ts`
  - `snmp/routes.ts`, `index.ts`
  - `syslog/routes.ts`, `index.ts`
  - `radius/routes.ts`, `index.ts`
  - `ai/{persistence,audit,schemas,chat,riot-routes,memory-routes}.ts`, `index.ts`
- Refactor `audit/index.ts` onto `auditLogModel.repository` with `tenantId` scoping; thread `tenantId` in `i18n`, `canon-lore`, `witness-research`, `epistemic`.

### `apps/api` (`apps/api/src/` — Target ~1,050 non-test LOC)

- Keep & tighten: `index.ts`, `app.ts`, `bootstrap.ts` (sole composition root), `seed.ts`, `middleware/auth.ts`, `infrastructure/rate-limit.ts`, `interface/routes/health.routes.ts`, `interface/routes/metrics.ts`, `shared/env.ts`, `shared/seed-safety.ts`, `shared/trace.ts`, `types/fastify.d.ts`.
- Create: `architecture.test.ts` (permanent fitness gate `API-GATE-01..08`).
- Delete: `infrastructure/adapters/fastify.adapter.ts`, `infrastructure/persistence/domain/*`, `infrastructure/audit/audit-log.ts`, `infrastructure/repositories/*`, `db/seeders/index.ts`, `domain/*`, `interface/controllers/*`, `services/*`, `shared/auth.ts`, `shared/upstream.ts`, and all 10 domain route/persistence/helper modules in `interface/routes/`.

---

## Wave 0 — P0 Runtime Correctness & Dead-Code Purge

### Task 1: Purge Dead Files, Ghost Models & Passthrough Barrels (`apps/api`)

**Files:**

- Delete:
  - `apps/api/src/infrastructure/repositories/orm-event.repository.ts`
  - `apps/api/src/infrastructure/repositories/in-memory-event.repository.ts`
  - `apps/api/src/interface/routes/riot-ai.usage.ts`
  - `apps/api/src/db/seeders/index.ts`
  - `apps/api/src/infrastructure/persistence/domain/identity.ts`
  - `apps/api/src/infrastructure/persistence/domain/command-control.ts`
  - `apps/api/src/infrastructure/persistence/domain/memory-syslog-snmp-radius.ts`
  - `apps/api/src/infrastructure/persistence/domain/ops-events.ts`
  - `apps/api/src/infrastructure/persistence/domain/probes.ts`
  - `apps/api/src/infrastructure/persistence/domain/storage.ts`
  - `apps/api/src/infrastructure/persistence/domain/index.ts`
  - `apps/api/src/infrastructure/audit/audit-log.ts`
  - `apps/api/src/domain/usecases/auth/types.ts`
  - `apps/api/src/interface/routes/index.ts`
  - `apps/api/src/services/user.ts`
  - `apps/api/src/services/session.ts`
  - `apps/api/src/shared/auth.ts`
  - `apps/api/src/shared/auth.test.ts`
- Modify:
  - `packages/addons/src/auth/passwords.ts` (export `generateToken(length?: number): string`)
  - `apps/api/src/**/*.ts` (replace barrel imports with direct `@moonwitness/addons/*` imports; remove dead `commandCenterMigrations`, `probesMigrations` exports)
  - `apps/api/src/infrastructure/adapters/fastify.adapter.ts` (import models/services directly from `@moonwitness/addons/*`; drop empty `domainMigrations` except `riotAiMigrations` until Task 3)
  - `apps/api/src/infrastructure/persistence/domain-migrations.test.ts` (import models & audit helpers directly from `@moonwitness/addons/*`)

**Interfaces:**

- Consumes: existing subpath exports in `@moonwitness/addons/{auth,audit,ai,command-center,control,probes,storage,snmp,syslog,radius}`
- Produces: `generateToken(length = 32): string` exported from `@moonwitness/addons/auth`; zero ghost `identity.*` entries in `modelRegistry`

- [ ] **Step 1: Add regression assertion in `apps/api/src/infrastructure/persistence/domain-migrations.test.ts`**

Add test asserting `modelRegistry.list().map((m) => m.name)` contains none of `"identity.user_profile"`, `"identity.session"`, `"identity.oauth_token"`, `"identity.auth_event"`, and that `generateToken(24)` from `@moonwitness/addons/auth` returns a 48-char hex string.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @moonwitness/api exec vitest run src/infrastructure/persistence/domain-migrations.test.ts`
Expected: FAIL (`identity.user_profile` still registered in `modelRegistry` or `generateToken` missing).

- [ ] **Step 3: Export `generateToken` from `packages/addons/src/auth/passwords.ts`, delete the 18 dead/barrel files, and rewrite imports**

Export `generateToken(length = 32): string` (using `crypto.getRandomValues` + `bytesToHex`) in `packages/addons/src/auth/passwords.ts` (already re-exported via `export * from "./passwords.js"` in `packages/addons/src/auth/index.ts`). Delete all 18 listed files. Rewrite every import in `apps/api/src` from `../../services/user`, `../../services/session`, `../../infrastructure/audit/audit-log`, `../../infrastructure/persistence/domain*`, and `../../shared/auth` directly to `@moonwitness/addons/*`. Update `packages/addons/src/auth/index.test.ts` to cover `hashAuthPassword`/`verifyAuthPassword` PBKDF2 + bcrypt parity previously tested in `apps/api/src/shared/auth.test.ts`.

- [ ] **Step 4: Run verification**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api lint; pnpm --filter @moonwitness/api test`
Expected: PASS (0 TS errors, 0 lint errors, all tests green).

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons apps/api
git commit -m "refactor(api): purge dead repositories, ghost identity models, and passthrough barrels"
```

---

### Task 2: Harden `@moonwitness/addon-runtime` (Live Guard on `/m/:model`, `/api/v1/_meta/models`, Dynamic Metadata, `AddonHostContext` & Shared Proxy Helpers)

**Files:**

- Create: `packages/addon-runtime/src/fastify.d.ts`
- Create: `packages/addon-runtime/src/host-context.ts`
- Create: `packages/addon-runtime/src/upstream.ts`
- Modify: `packages/addon-runtime/src/runtime.ts`
- Modify: `packages/addon-runtime/src/generic-crud.ts`
- Modify: `packages/addon-runtime/src/metadata.ts`
- Modify: `packages/addon-runtime/src/index.ts`
- Test: `packages/addon-runtime/src/generic-crud.test.ts`, `packages/addon-runtime/src/metadata.test.ts`, `packages/addon-runtime/src/upstream.test.ts`

**Interfaces:**

- Consumes: `@moonwitness/orm` (`modelRegistry`, `createActorContext`, `DEFAULT_TENANT_ID`, `ActorContext`)
- Produces:
  - `AddonRuntimeController.isModelEnabled(modelName: string): boolean`
  - `BaseAddonAuthBridge` extended with optional `optionalAuthenticate?: FastifyPreHandler` and `resolveActorContext?: (request: FastifyRequest) => ActorContext`
  - `AddonHostContext`:
    ```ts
    export interface AddonHostContext {
      readonly prefix: string;
      readonly auth: BaseAddonAuthBridge;
      readonly rateLimit?: (options: {
        max: number;
        windowMs: number;
        scope: string;
        message?: string;
      }) => (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
      readonly proxy?: HostProxyBridge;
      readonly mid?: {
        readonly keyEncryptionSecret?: string;
        readonly issuerUrl: string;
        readonly cookieDomain?: string;
        readonly corsOrigins?: string;
      };
      readonly seedDemo?: boolean;
    }
    ```
  - `buildMetadataRegistryFromModels(runtime: AddonRuntimeController): MetadataRegistry`
  - `resolveActorContextFromBridge(auth: BaseAddonAuthBridge, request: FastifyRequest): ActorContext`
  - `packages/addon-runtime/src/upstream.ts`: `resolveTraceContext`, `buildChildTraceparent`, `isCloudflareWorkersRuntime`, `isLoopbackServiceUrl`, `resolveUpstreamServiceUrl`, `getEdgeLoopbackErrorPayload`, `getUpstreamBridgeHeaders`, `isBlockedRuntimeHost`, `validateServiceEndpointUrl`

- [ ] **Step 1: Write failing tests in `packages/addon-runtime/src/generic-crud.test.ts`, `metadata.test.ts`, and `upstream.test.ts`**

Assertions to add:

1. `generic-crud.test.ts` — `"returns 503 ADDON_DISABLED on /m/:model when the owning addon is disabled"`: sync addon owning `crud.item`, disable it via `runtime.disable("crud-demo")`, send `GET /m/crud.item` and `POST /m/crud.item` → both return `503` with `{ code: "ADDON_DISABLED" }`; re-enable → returns `200`.
2. `metadata.test.ts` — `"mounts /_meta/models under apiPrefix and derives public fields from modelRegistry excluding disabled addons and sensitive fields"`: call `registerBaseAddon(fastify, { runtime, apiPrefix: "/api/v1" })`, verify `GET /api/v1/_meta/models` returns `200` with active models only, omits `password_hash`/`access_token`/`refresh_token`, and drops models of a disabled addon.
3. `upstream.test.ts` — pins `isBlockedRuntimeHost("169.254.169.254") === true`, `validateServiceEndpointUrl`, `getEdgeLoopbackErrorPayload`, and W3C child `traceparent` generation in `getUpstreamBridgeHeaders`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/addon-runtime test`
Expected: FAIL (`503` assertion gets `200`; `/api/v1/_meta/models` gets `404`; `upstream.ts` missing).

- [ ] **Step 3: Implement `isModelEnabled`, `/m/:model` guard, dynamic metadata, `/api/v1/_meta/models` mount, `host-context.ts`, and `upstream.ts`**

1. In `runtime.ts`: track `private readonly modelOwners = new Map<string, string>()` populated during `syncAll()` from each addon's `models`; expose `isModelEnabled(modelName: string): boolean` returning `owner ? this.isEnabled(owner) : true`.
2. In `generic-crud.ts`: before ACL checks on every `/m/:model*` route, call `if (!runtime.isModelEnabled(target.desc.name)) return reply.code(503).send({ error: \`Addon for model '${target.desc.name}' is disabled\`, code: "ADDON_DISABLED" })`.
3. In `metadata.ts`: implement `buildMetadataRegistryFromModels(runtime)` reading `modelRegistry.list()` filtered by `runtime.isModelEnabled(desc.name)` and projecting only `desc.publicFields` (stripping `/password_hash|_token|_secret|encrypted_private/i`); update `registerMetadataRoutes(fastify, registryOrResolver)` to accept either a static `MetadataRegistry` or `() => MetadataRegistry` so live enable/disable reflects immediately in `/_meta/models`, `/_meta/models/:name`, `/_meta/openapi.json`, and `/_meta/llms.txt`.
4. In `index.ts`: when `opts.runtime` is provided and `opts.extraModels` is omitted, derive metadata dynamically via `() => buildMetadataRegistryFromModels(runtime)`; mount `registerMetadataRoutes` inside `opts.apiPrefix` scope as well as root (keep root mount for backwards compatibility with existing tests).
5. Create `fastify.d.ts` (augmenting `FastifyInstance.midMounted`, `FastifyRequest.{user,tenantId,cookies,traceparent}`, and `FastifyReply.{setCookie,clearCookie}` so `@moonwitness/addons` typechecks standalone), `host-context.ts`, and `upstream.ts` (porting pure functions from `apps/api/src/shared/{trace,upstream,env}.ts` with zero Fastify-app coupling); export all symbols from `packages/addon-runtime/src/index.ts`.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addon-runtime typecheck; pnpm --filter @moonwitness/addon-runtime lint; pnpm --filter @moonwitness/addon-runtime test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/addon-runtime
git commit -m "feat(addon-runtime): enforce addon guard on /m/:model, dynamic /_meta/*, AddonHostContext, and upstream helpers"
```

---

### Task 3: Fix P0 SNMP Mirror Schema Drift & Rewrite `riot-ai.persistence.ts` onto `BaseRepository`

**Files:**

- Modify: `apps/api/src/interface/routes/snmp-poller.routes.ts:61-144`
- Modify: `apps/api/src/interface/routes/riot-ai.persistence.ts:1-330`
- Modify: `apps/api/src/interface/routes/riot-ai.routes.ts:27-30`
- Test: `apps/api/src/interface/routes/snmp-poller.routes.test.ts`, `apps/api/src/interface/routes/riot-ai.persistence.test.ts`

**Interfaces:**

- Consumes: `snmpDeviceModel`, `snmpTargetModel` (`@moonwitness/addons/snmp`), `providerConfigModel`, `usageSummaryModel` (`@moonwitness/addons/ai`), `BaseRepository` (`upsert`, `find` with `$gte`/`$lt`, `delete`, `history`)
- Produces: Zero raw SQL and zero `applyMigrations(model.ddl)` in `riot-ai.persistence.ts`; accurate ORM mirror writes in `snmp-poller.routes.ts`

- [ ] **Step 1: Write failing tests in `snmp-poller.routes.test.ts` and `riot-ai.persistence.test.ts`**

Assertions to add:

1. `snmp-poller.routes.test.ts`:
   - `"mirrors SNMP v3 device and target fields accurately into snmp_devices and snmp_targets"`: mock upstream `POST /api/devices` returning `{ id: "dev-v3", name: "Core Switch", host: "10.0.0.1", port: 161, version: "v3", enabled: true }` → assert `snmpDeviceModel.repository.find({ device_key: "dev-v3" })` has `snmp_version === "v3"`.
   - Mock upstream `POST /api/devices/dev-v3/targets` returning `{ id: "tgt-1", oid: "1.3.6.1.2.1.1.3.0", name: "sysUpTime", interval_sec: 30, enabled: true }` → assert `snmpTargetModel.repository.find({ target_key: "tgt-1" })` has length 1 with `label === "sysUpTime"` and `interval_sec === 30`.
2. `riot-ai.persistence.test.ts`:
   - `"writes tenant_id and emits onModelWrite when upserting provider config"`: subscribe `onModelWrite("riot_ai.provider_config", spy)`, call `upsertProviderConfig(..., createActorContext("u1", "api", "req-1", "tenant-x"))` → assert `spy` called once AND persisted row has `tenant_id === "tenant-x"`.
   - `"allows extendModel('riot_ai.provider_config', ...) without checksum mismatch on re-initialization"`: call `initializeRiotAiPersistence()`, then `extendModel("riot_ai.provider_config", { addon: "ext-test", fields: z.object({ note: z.string().nullable().default(null) }) })`, then call `initializeRiotAiPersistence()` again → resolves without throwing.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/api exec vitest run src/interface/routes/snmp-poller.routes.test.ts src/interface/routes/riot-ai.persistence.test.ts`
Expected: FAIL (`snmp_version` is `"v2c"`, `snmp_targets` length is 0, `onModelWrite` spy not called, `applyMigrations` throws checksum mismatch).

- [ ] **Step 3: Fix `snmp-poller.routes.ts` and rewrite `riot-ai.persistence.ts`**

1. In `snmp-poller.routes.ts`: normalize upstream `version` (`"v1" | "v2c" | "v3"`, default `"v2c"`) into `snmp_version`; populate `snmpTargetModel` with `{ target_key, device_key, oid, label: String(resObj.label ?? resObj.name ?? bodyObj.label ?? bodyObj.name ?? oid).slice(0, 200), interval_sec: Number.isInteger(intervalRaw) && intervalRaw > 0 ? intervalRaw : 60, enabled }`; pass `tenantId` from `(request as AuthenticatedRequest).tenantId` into `createActorContext`; log mirror errors via `request.log.warn({ err, target }, "snmp ORM mirror failed")` instead of silent empty catch.
2. In `riot-ai.persistence.ts`:
   - Replace `riotAiMigrations` + `applyMigrations` with `export async function initializeRiotAiPersistence(): Promise<void> { await syncModels([providerConfigModel, usageSummaryModel]); }` (remove `riotAiMigrations` export and delete `ensureRiotAiAuditTable()`).
   - Rewrite `upsertProviderConfig(input, actor)` to call `providerConfigModel.repository.upsert({ profile_key: input.profileKey }, { profile_key: input.profileKey, label: input.label, provider: "ollama", enabled: input.enabled, preferred_model: input.preferredModel }, actor)`.
   - Rewrite `maintainUsageRetention(retentionDays)` to query `usageSummaryModel.repository.find({ occurred_at: { $lt: cutoff } })` and soft-delete each via `usageSummaryModel.repository.delete(row.id, createActorContext("system:retention", "migration"))`.
   - Rewrite `listOperatorUsageSummary(options)` to call `usageSummaryModel.repository.find({ occurred_at: { $gte: options.since } }, { limit: options.limit, orderBy: [{ field: "occurred_at", direction: "DESC" }, { field: "id", direction: "DESC" }], ...(options.tenantId ? { tenantId: options.tenantId } : {}) })`.
   - Update `apps/api/src/infrastructure/adapters/fastify.adapter.ts` to drop the `applyMigrations(riotAiMigrations)` call.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api exec vitest run src/interface/routes/snmp-poller.routes.test.ts src/interface/routes/riot-ai.persistence.test.ts src/interface/routes/riot-ai.routes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/interface/routes/snmp-poller.routes.ts apps/api/src/interface/routes/snmp-poller.routes.test.ts apps/api/src/interface/routes/riot-ai.persistence.ts apps/api/src/interface/routes/riot-ai.persistence.test.ts apps/api/src/infrastructure/adapters/fastify.adapter.ts
git commit -m "fix(api/orm): repair SNMP mirror fields and migrate riot-ai persistence to BaseRepository + syncModels"
```

---

## Wave 1 — Single Composition Root, ORM Hygiene, Audit Dedup & Multi-Tenant Propagation

### Task 4: Refactor `@moonwitness/addons/audit` onto `BaseRepository` (`tenant_id`) & Eliminate Triple Audit Writes

**Files:**

- Modify: `packages/addons/src/audit/index.ts`
- Modify: `packages/addons/src/auth/service.ts`
- Modify: `apps/api/src/interface/controllers/timeline.controller.ts`
- Modify: `apps/api/src/interface/routes/command-center.persistence.ts`
- Modify: `apps/api/src/interface/routes/probes.persistence.ts`
- Modify: `packages/addons/src/i18n/index.ts`, `packages/addons/src/epistemic/index.ts`, `packages/addons/src/witness-research/index.ts`, `packages/addons/src/canon-lore/index.ts` (propagate `tenantId` in existing self-hosted addons)
- Test: `packages/addons/src/audit/index.test.ts`

**Interfaces:**

- Consumes: `auditLogModel.repository`, `resolveActorContextFromBridge` (`@moonwitness/addon-runtime`)
- Produces:
  - `ListAuditLogsOptions.tenantId?: string`
  - `RecordAuditInput.tenantId?: string`
  - Exactly 1 `ops_audit_logs` row per ORM mutation (no duplicate manual + outbox writes)

- [ ] **Step 1: Write failing tests in `packages/addons/src/audit/index.test.ts`**

Assertions to add:

1. `"isolates ops_audit_logs records by tenantId across recordAuditLog and listAuditLogs"`: record 1 log for `tenant-a` and 1 for `tenant-b`, assert `listAuditLogs({ tenantId: "tenant-a" })` returns only `tenant-a`'s row.
2. `"writes exactly one ops_audit_logs row when an ORM model is created with audit outbox attached"`: attach outbox, create a `timeline.event` / `auth.user` via repository, assert `ops_audit_logs` count for that entity is `1` (not `2`).

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/audit/index.test.ts`
Expected: FAIL (`listAuditLogs` returns rows from both tenants).

- [ ] **Step 3: Refactor `audit/index.ts` onto `auditLogModel.repository` and deduplicate manual audit calls**

1. In `packages/addons/src/audit/index.ts`:
   - Rewrite `recordAuditLog()` to call `auditLogModel.repository.create({ domain, entity, entity_id, action, actor_id, actor_role, correlation_id, request_path, outcome, before_json, after_json, metadata_json, occurred_at }, createActorContext(actorId, "api", correlationId ?? undefined, tenantId))` (outbox already ignores `event.model === "ops.audit_log"` so no recursion).
   - Rewrite `listAuditLogs(options)` to call `auditLogModel.repository.find(filters, { limit, orderBy: [{ field: "occurred_at", direction: "DESC" }, { field: "id", direction: "DESC" }], ...(options.tenantId ? { tenantId: options.tenantId } : {}) })`.
   - Pass `tenantId: auth.getActorTenant?.(request)` inside `GET ${prefix}/audit/logs`.
2. Remove redundant manual `tryRecordAuditLog()` calls directly following `BaseRepository` writes in:
   - `packages/addons/src/auth/service.ts` (`createUser`, `updateUserRole`, `createSession`, `revokeSession`; keep `deleteUser` audit until physical cascade is refactored or convert `deleteUser` to emit via `modelRegistry.emitWrite`).
   - `apps/api/src/interface/controllers/timeline.controller.ts` (all 5 mutation handlers).
   - `apps/api/src/interface/routes/command-center.persistence.ts` (all 3 mutation helpers).
   - `apps/api/src/interface/routes/probes.persistence.ts` (`recordProbeEvent`).
3. Update `i18n`, `epistemic`, `witness-research`, and `canon-lore` route handlers to obtain `actor = resolveActorContextFromBridge(auth, request)` and pass `{ tenantId: actor.tenantId }` on reads/writes.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/addons apps/api
git commit -m "refactor(audit/addons): route audit persistence through BaseRepository with tenant isolation and dedup outbox writes"
```

---

### Task 5: Collapse `fastify.adapter.ts` into Single Host `bootstrap.ts`, Remove Shadow Metadata, Stop Hot-Path `syncModels`, and Unify Rate Limiting

**Files:**

- Modify: `apps/api/src/bootstrap.ts`
- Delete: `apps/api/src/infrastructure/adapters/fastify.adapter.ts`
- Modify: `apps/api/src/infrastructure/rate-limit.ts`
- Modify: `apps/api/src/middleware/auth.ts`
- Modify: `apps/api/src/interface/routes/health.routes.ts`
- Modify: `apps/api/src/interface/routes/command-center.routes.ts`, `command-center.persistence.ts`
- Modify: `apps/api/src/interface/routes/probes.persistence.ts`
- Modify: `apps/api/src/interface/routes/auth.routes.test.ts`, `bff-auth.routes.test.ts`, `identity-authz-matrix.test.ts`, `mid-jwt.test.ts`, `addon-meta-runtime.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `buildMetadataRegistryFromModels`, `createUpstreamProxy` (`@moonwitness/addon-runtime`), `irAddonModel` (`@moonwitness/addon-runtime`)
- Produces:
  - Single host entrypoint `buildCoreApp(options?: CoreAppOptions): Promise<FastifyInstance>` in `apps/api/src/bootstrap.ts`
  - `createHostRateLimitPreHandler(options)` in `apps/api/src/infrastructure/rate-limit.ts` (uses `RATE_LIMIT_STORE` + `TRUSTED_PROXY_COUNT`)
  - Zero `domainMetadataModels` shadow list; zero hot-path `syncModels()` inside HTTP handlers

- [ ] **Step 1: Write failing tests in `apps/api/src/addon-meta-runtime.test.ts`**

Assertions to add:

1. `"serves /api/v1/_meta/models from live modelRegistry without ghost or phantom entries"`: `GET /api/v1/_meta/models` returns `200`, contains `"auth.user"`, `"probe.node"`, `"timeline.event"`, `"canon.codex"`, and does NOT contain `"probe.target"` or `"identity.user_profile"`.
2. `"blocks /api/v1/m/:model with 503 ADDON_DISABLED when owning addon is disabled"`: disable `canon-lore`, send `GET /api/v1/m/canon.codex` with admin cookie → expects `503` and `json().code === "ADDON_DISABLED"`.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/api exec vitest run src/addon-meta-runtime.test.ts`
Expected: FAIL (`/api/v1/_meta/models` returns `404`; `/api/v1/m/canon.codex` returns `200` while disabled).

- [ ] **Step 3: Merge `fastify.adapter.ts` into `bootstrap.ts`, remove hot-path `syncModels`, and migrate the 4 test files**

1. Move Fastify instance creation (logger, `genReqId`, `metricsCollector`, `onRequest` traceparent/rate-limit, `@fastify/cookie`, `@fastify/cors`, security headers, error handler, non-prod Swagger, `/metrics`, prefixed health routes) into `apps/api/src/bootstrap.ts`. Delete `apps/api/src/infrastructure/adapters/fastify.adapter.ts`.
2. Delete `domainMetadataModels` (lines 59–193 of `bootstrap.ts`); call `registerBaseAddon(target, { runtime, auth: authBridge, apiPrefix: prefix })` so `/_meta/models` and `/api/v1/_meta/models` auto-derive from `modelRegistry` + `ir_models`.
3. Build `hostContext: AddonHostContext` in `bootstrap.ts` (including `optionalAuthenticate: optionalAuth()`, `resolveActorContext`, `rateLimit: createHostRateLimitPreHandler`, `proxy`, `mid`, `seedDemo: seed`).
4. Wire `signingPolicy` from optional `ADDON_SIGNING_MODE` env var (`"permissive"` default, `"strict"` opt-in per ADR-010) and pass `{ runSeeds: true }` to `runtime.syncAll(addons, target, ...)` so `i18n` and `auth` run their `AddonDefinition.seed` lifecycle cleanly (keep `seedTimeline()` strictly gated behind `if (seed)` + `assertDemoSeedAllowed`).
5. Remove `ensureCommandCenterSchema()` calls from every handler in `command-center.routes.ts` and `seedActorDefaultsIfEmpty()` in `command-center.persistence.ts`; remove `ensureProbesSchema()` calls from `listProbeNodes`, `listRecentProbeEvents`, `recordProbeEvent` in `probes.persistence.ts` (seed default probe nodes once via `probesAddon.seed` / explicit test setup). Replace raw `DELETE FROM orm_probe_events` with a repository-based retention helper.
6. Update `health.routes.ts` to read `irAddonModel.repository.find()` instead of raw `SELECT state FROM ir_addons`.
7. Update `rate-limit.ts`: add `createHostRateLimitPreHandler(opts)` using the shared memory/ORM store and `resolveRateLimitKey(..., env.TRUSTED_PROXY_COUNT)`.
8. Update the 4 test files (`auth.routes.test.ts`, `bff-auth.routes.test.ts`, `identity-authz-matrix.test.ts`, `mid-jwt.test.ts`) to import `buildCoreApp` from `../../bootstrap` (or `../bootstrap`) instead of `buildFastify`.

- [ ] **Step 4: Run full API test suite**

Run: `pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api lint; pnpm --filter @moonwitness/api test`
Expected: PASS (all 30 test suites green).

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "refactor(api): unify bootstrap host, drop shadow metadata registry, and remove hot-path syncModels"
```

---

## Wave 2 — Co-Locate Pure ORM/Domain Addon Routes into `@moonwitness/addons`

### Task 6: Move `timeline` Routes into `@moonwitness/addons/timeline` & Eliminate Redundant Controller/UseCase Layers

**Files:**

- Create: `packages/addons/src/timeline/schemas.ts`
- Create: `packages/addons/src/timeline/routes.ts`
- Modify: `packages/addons/src/timeline/repository.ts`
- Modify: `packages/addons/src/timeline/views.ts`
- Modify: `packages/addons/src/timeline/index.ts`
- Delete:
  - `apps/api/src/domain/errors.ts`
  - `apps/api/src/domain/usecases/timeline/timeline.repository.ts`
  - `apps/api/src/domain/usecases/timeline/timeline.usecase.ts`
  - `apps/api/src/interface/controllers/timeline.controller.ts`
  - `apps/api/src/interface/routes/timeline.routes.ts`
  - `apps/api/src/interface/routes/schemas.ts`
- Modify: `apps/api/src/bootstrap.ts`, `apps/api/src/seed.ts`, `apps/api/src/types/fastify.d.ts`
- Test: `packages/addons/src/timeline/index.test.ts`, `apps/api/src/app.test.ts`, `apps/api/src/interface/routes/timeline.contracts.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `resolveActorContextFromBridge` (`@moonwitness/addon-runtime`), `TimelineRepository`
- Produces:
  - `createTimelineAddon(host?: Partial<AddonHostContext> & { repository?: ITimelineRepository }): AddonDefinition`
  - `registerTimelineRoutes(scope: FastifyInstance, options: { auth: BaseAddonAuthBridge; repository?: ITimelineRepository }): Promise<void>`
  - `TimelineFilters.tenantId?: string`; `getEvent(id, tenantId?)`, `getStats(tenantId?)`, `getEras(tenantId?)`

- [ ] **Step 1: Write failing tests in `packages/addons/src/timeline/index.test.ts`**

Assertions to add:

1. `"mounts /api/v1/timeline/* routes directly from createTimelineAddon and isolates events by tenantId"`: create event under `tenant-a` via `POST /api/v1/timeline/events`, verify `GET /api/v1/timeline/events` as `tenant-a` returns `total: 1` while `tenant-b` returns `total: 0`.
2. `"calls TimelineRepository.listEvents only once per GET /api/v1/timeline/events request"`: spy on `repo.listEvents`, call `GET /api/v1/timeline/events` → `expect(spy).toHaveBeenCalledTimes(1)` (fixes double-query regression).
3. `"exposes valid actionBindings for timeline.event and timeline.era"`: verify `timeline.era` `actionBindings` points `createUrl` to `"/api/v1/m/timeline.era"` (or omits non-existent `POST /api/v1/timeline/eras`).

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/timeline/index.test.ts`
Expected: FAIL (`createTimelineAddon` not exported / `tenantId` ignored).

- [ ] **Step 3: Move schemas & routes into `packages/addons/src/timeline/`, wire `tenantId`, and delete `apps/api` timeline layers**

1. Update `packages/addons/src/timeline/repository.ts`: add `tenantId?: string` support to `listEvents`, `getEvent`, `getStats`, `getEras` (`if (filters.tenantId) clauses.push("tenant_id = ?")`).
2. Create `packages/addons/src/timeline/schemas.ts` (moved from `apps/api/src/interface/routes/schemas.ts`) and `routes.ts` calling `TimelineRepository` directly (handling `ConflictError` → `409`, `ZodError` → `400`, missing → `404`), using `auth.optionalAuthenticate`, `auth.authenticate`, `auth.requireRole`, and `resolveActorContextFromBridge(auth, request)`.
3. Update `views.ts` so `timeline.era` uses `listUrl: "/api/v1/timeline/eras"` and `createUrl: "/api/v1/m/timeline.era"` (matching real mounted endpoints).
4. Export `createTimelineAddon(host)` in `packages/addons/src/timeline/index.ts`; wire `createTimelineAddon(hostContext)` in `apps/api/src/bootstrap.ts`.
5. Delete the 6 `apps/api` timeline files and remove `timelineUseCase` from `apps/api/src/types/fastify.d.ts`.
6. Simplify `apps/api/src/seed.ts` to call `syncModels([timelineEventModel, timelineEraModel])` + `seedTimeline()` (preserving `--sql` mode via a helper in `@moonwitness/addons/timeline` if still used).
7. Update `apps/api/src/app.test.ts` (verify actor propagation via `registerTimelineRoutes` + spied `ITimelineRepository`) and `apps/api/src/interface/routes/timeline.contracts.test.ts`.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons/src/timeline apps/api
git commit -m "refactor(timeline): co-locate routes in @moonwitness/addons/timeline, enforce tenantId, and drop redundant usecase layer"
```

---

### Task 7: Move `command-center` & `probes` Services and Routes into `@moonwitness/addons/{command-center,probes}`

**Files:**

- Create: `packages/addons/src/command-center/service.ts`, `packages/addons/src/command-center/routes.ts`
- Modify: `packages/addons/src/command-center/index.ts`
- Create: `packages/addons/src/probes/service.ts`, `packages/addons/src/probes/routes.ts`
- Modify: `packages/addons/src/probes/index.ts`
- Delete:
  - `apps/api/src/interface/routes/command-center.persistence.ts`
  - `apps/api/src/interface/routes/command-center.routes.ts`
  - `apps/api/src/interface/routes/probes.persistence.ts`
  - `apps/api/src/interface/routes/probes.routes.ts`
- Modify: `apps/api/src/bootstrap.ts`
- Test: `packages/addons/src/command-center/index.test.ts`, `packages/addons/src/probes/index.test.ts`, `apps/api/src/interface/routes/command-center.routes.test.ts`, `apps/api/src/interface/routes/probes.routes.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `resolveActorContextFromBridge`, `isBlockedRuntimeHost` (`@moonwitness/addon-runtime`), `listAuditLogs` (`../audit`)
- Produces:
  - `createCommandCenterAddon(host?: Partial<AddonHostContext>): AddonDefinition`
  - `createProbesAddon(host?: Partial<AddonHostContext>): AddonDefinition` (with `seed: seedDefaultProbeNodes`)
  - Corrected `actionBindings` on `command.workflow`, `command.alert`, and `probe.node` matching real mounted routes

- [ ] **Step 1: Write failing tests in `packages/addons/src/command-center/index.test.ts` and `packages/addons/src/probes/index.test.ts`**

Assertions to add:

1. `command-center/index.test.ts`:
   - Verify `command.workflow` `actionBindings.listUrl === "/api/v1/command-center/state"` and custom action uses `PATCH /api/v1/command-center/workflows/{id}/toggle`.
   - Verify `command.alert` `actionBindings.listUrl === "/api/v1/command-center/state"` and dismiss action uses `DELETE /api/v1/command-center/alerts/{id}`.
   - Verify `tenant-a` workflows created via `POST /api/v1/command-center/workflows` are invisible to `tenant-b` on `GET /api/v1/command-center/state`.
2. `probes/index.test.ts`:
   - Verify `probe.node` `actionBindings.listUrl === "/api/v1/probes/nodes"` and run action uses `POST /api/v1/probes/run`.
   - Verify `createProbesAddon(host)` mounts `/api/v1/probes/{nodes,events,run}` and `/api/v1/igate/{status,probe}` and seeds `DEFAULT_PROBE_NODES` via `seed()`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/command-center/index.test.ts src/probes/index.test.ts`
Expected: FAIL (old phantom `actionBindings` URLs & routes not self-mounted).

- [ ] **Step 3: Move `command-center` and `probes` logic into `packages/addons/src/` and update `bootstrap.ts`**

1. Move `command-center.persistence.ts` → `packages/addons/src/command-center/service.ts` and `command-center.routes.ts` → `packages/addons/src/command-center/routes.ts`; thread `actor: ActorContext` (with `tenantId`) through all service calls; keep zero hot-path `syncModels`. Update `commandCenterViews` `actionBindings` to match mounted routes.
2. Move `probes.persistence.ts` → `packages/addons/src/probes/service.ts` (using `isBlockedRuntimeHost` from `@moonwitness/addon-runtime`) and `probes.routes.ts` → `packages/addons/src/probes/routes.ts`; wire `seedDefaultProbeNodes` into `probesAddon.seed`; update `probesViews` `actionBindings` to match mounted routes.
3. Delete the 4 files from `apps/api/src/interface/routes/`, update `apps/api/src/bootstrap.ts` to 1-line `createCommandCenterAddon(hostContext)` and `createProbesAddon(hostContext)`, and update test imports in `command-center.routes.test.ts` / `probes.routes.test.ts`.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons/src/command-center packages/addons/src/probes apps/api
git commit -m "refactor(addons): self-host command-center and probes routes with aligned actionBindings and tenantId"
```

---

### Task 8: Move `auth` Routes, BFF Exchange, Admin Routes, MID JWT & MID Plugin Mounting into `@moonwitness/addons/auth`

**Files:**

- Modify: `packages/addons/package.json` (add `"@moonwitness/core": "workspace:*"`)
- Create: `packages/addons/src/auth/mid-jwt.ts`
- Create: `packages/addons/src/auth/bff.ts`
- Create: `packages/addons/src/auth/admin-routes.ts`
- Create: `packages/addons/src/auth/routes.ts`
- Modify: `packages/addons/src/auth/index.ts`
- Delete:
  - `apps/api/src/interface/routes/auth.routes.ts`
  - `apps/api/src/interface/routes/auth.admin.ts`
  - `apps/api/src/interface/routes/auth.bff.ts`
  - `apps/api/src/middleware/mid-jwt.ts`
- Modify: `apps/api/src/middleware/auth.ts`, `apps/api/src/bootstrap.ts`
- Test: `packages/addons/src/auth/index.test.ts`, `apps/api/src/interface/routes/auth.routes.test.ts`, `bff-auth.routes.test.ts`, `identity-authz-matrix.test.ts`, `apps/api/src/middleware/mid-jwt.test.ts`, `apps/api/src/mid-plugin-startup.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext` (`auth`, `rateLimit`, `mid`), `@moonwitness/mid` (`midFastifyPlugin`), `@moonwitness/core` (`verifyEs256Jwt`, `normalizeIssuerUrl`, `DEFAULT_MID_ISSUER_URL`), `@moonwitness/orm` (`createD1DatabaseFromOrm`, `getDb`)
- Produces:
  - `createAuthAddon(host?: Partial<AddonHostContext> & { runBootstrapSeed?: boolean; mountAuditRoute?: boolean }): AddonDefinition`
  - `verifyMidBearerToken`, `verifyMidBffExchangeClaims`, `resolveAllowedApiAudiences`, `resetMidJwksCacheForTests` exported from `@moonwitness/addons/auth`
  - Fixed `authViews`: `createUrl: "/api/v1/auth/users"` (replaces 404 `/api/v1/auth/register`)

- [ ] **Step 1: Write failing tests in `packages/addons/src/auth/index.test.ts`**

Assertions to add:

1. `"declares createUrl '/api/v1/auth/users' in auth.user view actionBindings"`.
2. `"mounts /api/v1/auth/{login,logout,me,users,bff/exchange} and optional midFastifyPlugin directly from createAuthAddon(host)"`.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/auth/index.test.ts`
Expected: FAIL (`createUrl` is `"/api/v1/auth/register"`).

- [ ] **Step 3: Move auth route stack & MID JWT verifier into `packages/addons/src/auth/`**

1. Add `"@moonwitness/core": "workspace:*"` to `packages/addons/package.json` dependencies.
2. Move `apps/api/src/middleware/mid-jwt.ts` → `packages/addons/src/auth/mid-jwt.ts`; move `auth.{bff,admin,routes}.ts` → `packages/addons/src/auth/{bff,admin-routes,routes}.ts`.
3. Replace `@fastify/rate-limit` inside `packages/addons/src/auth/routes.ts` with `host.rateLimit({ max: 10, windowMs: 60_000, scope: "auth", message: "terlalu banyak percobaan; coba lagi nanti" })` (preserving exact `429` error payload `{ statusCode: 429, error: "Too Many Requests", message }`).
4. In `packages/addons/src/auth/index.ts`, have `createAuthAddon(host)` register `midFastifyPlugin` (when `host.mid?.keyEncryptionSecret` is non-empty, decorating `midMounted = true` on parent instance) and `authRoutes` under `host.prefix`; fix `authViews` `createUrl` to `"/api/v1/auth/users"`.
5. Update `apps/api/src/middleware/auth.ts` to import `verifyMidBearerToken` from `@moonwitness/addons/auth`, and replace the manual `createAuthAddon({ registerRoutes: ... })` block in `apps/api/src/bootstrap.ts` with 1-line `createAuthAddon(hostContext)`.
6. Delete the 4 moved files from `apps/api` and update test import paths.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons typecheck; pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons/package.json packages/addons/src/auth apps/api
git commit -m "refactor(auth): move auth routes, BFF, MID JWT verifier, and MID plugin mounting into @moonwitness/addons/auth"
```

---

## Wave 3 — Co-Locate Proxy, Telemetry & AI Addons into `@moonwitness/addons`

### Task 9: Move `control` Routes & Native Setup into `@moonwitness/addons/control` and Wire ADR-010 `createControlScheduler`

**Files:**

- Create: `packages/addons/src/control/native-auth.ts`
- Create: `packages/addons/src/control/upstream.ts`
- Create: `packages/addons/src/control/routes.ts`
- Modify: `packages/addons/src/control/index.ts`
- Delete:
  - `apps/api/src/interface/routes/control.native-auth.ts`
  - `apps/api/src/interface/routes/control.upstream.ts`
  - `apps/api/src/interface/routes/control.routes.ts`
- Modify: `apps/api/src/bootstrap.ts`
- Test: `packages/addons/src/control/index.test.ts`, `apps/api/src/interface/routes/control.routes.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `getEdgeLoopbackErrorPayload`, `resolveUpstreamServiceUrl` (`@moonwitness/addon-runtime`), `authUserModel` & auth helpers (`../auth`), `createControlScheduler` (`./scheduler.js`)
- Produces:
  - `createControlAddon(host?: Partial<AddonHostContext>): AddonDefinition`
  - `ARSY_V1_SUPPORTED_RESOURCE_KINDS`, `ARSY_V1_DEFERRED_RESOURCE_KINDS` exported from `@moonwitness/addons/control`

- [ ] **Step 1: Write failing tests in `packages/addons/src/control/index.test.ts`**

Assertions to add:

1. `"dispatches POST /api/v1/control/plan into DurableQueueSchedulerAdapter (202 + ops.job) when CONTROL_SCHEDULER=queue"`: set `CONTROL_SCHEDULER=queue`, send valid `POST /api/v1/control/plan` with `resources: [{ kind: "files" }]` as admin → returns `202` with `{ backend: "queue", jobId }` and records both `ops_jobs` and `control_command_history` with caller's `tenant_id`.
2. `"checks setup status via authUserModel.repository instead of raw SQL in native setup mode"`.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/control/index.test.ts`
Expected: FAIL (`createControlAddon` does not mount routes).

- [ ] **Step 3: Move `control` route files into `packages/addons/src/control/` and wire `createControlScheduler`**

1. Move `control.{native-auth,upstream,routes}.ts` into `packages/addons/src/control/`.
2. Replace raw `SELECT COUNT(*) ... FROM auth_users` in `native-auth.ts` with `authUserModel.repository.count()` and `authUserModel.repository.find({}, { orderBy: "create_date ASC", limit: 1 })`.
3. Replace `@fastify/rate-limit` in `control/routes.ts` with `host.rateLimit({ max: AUTH_RATE_MAX, windowMs: AUTH_RATE_WINDOW_MS, scope: "control-auth", message: "terlalu banyak percobaan; coba lagi nanti" })`.
4. In `POST /control/:path` when `path === "plan" || path === "apply"` and `process.env.CONTROL_SCHEDULER === "queue"`, dispatch via `createControlScheduler({ mode: "queue" }).dispatch(...)`, record `controlCommandModel` with `actor` (including `tenantId`), and return `202`; default `"arsy"` mode keeps existing HTTP proxy behavior while recording `controlCommandModel` with `tenantId`.
5. Delete the 3 files from `apps/api/src/interface/routes/`, update `apps/api/src/bootstrap.ts` to 1-line `createControlAddon(hostContext)`, and update imports in `control.routes.test.ts`.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons/src/control apps/api
git commit -m "refactor(control): self-host control routes in @moonwitness/addons/control and wire ADR-010 queue scheduler"
```

---

### Task 10: Move `storage`, `snmp`, `syslog`, `radius` Routes & SigV4 Signer into `@moonwitness/addons/*`

**Files:**

- Create: `packages/addons/src/storage/sigv4.ts`, `packages/addons/src/storage/routes.ts`; modify `packages/addons/src/storage/index.ts`
- Create: `packages/addons/src/snmp/routes.ts`; modify `packages/addons/src/snmp/index.ts`
- Create: `packages/addons/src/syslog/routes.ts`; modify `packages/addons/src/syslog/index.ts`
- Create: `packages/addons/src/radius/routes.ts`; modify `packages/addons/src/radius/index.ts`
- Delete:
  - `apps/api/src/services/storage-sigv4.ts`
  - `apps/api/src/interface/routes/storage.routes.ts`
  - `apps/api/src/interface/routes/snmp-poller.routes.ts`
  - `apps/api/src/interface/routes/syslog.routes.ts`
  - `apps/api/src/interface/routes/radius.routes.ts`
  - `apps/api/src/shared/upstream.ts`
- Modify: `apps/api/src/bootstrap.ts`
- Test: `packages/addons/src/{storage,snmp,syslog,radius}/index.test.ts`, `apps/api/src/interface/routes/{storage,snmp-poller,radius}.routes.test.ts`, `apps/api/src/services/storage-sigv4.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `resolveActorContextFromBridge`, `resolveUpstreamServiceUrl`, `getEdgeLoopbackErrorPayload`, `getUpstreamBridgeHeaders` (`@moonwitness/addon-runtime`), `tryRecordAuditLog` (`../audit`)
- Produces:
  - Self-contained `createStorageAddon(host)`, `createSnmpAddon(host)`, `createSyslogAddon(host)`, `createRadiusAddon(host)`
  - SigV4 exports (`signStorageRequest`, `resolveStorageTarget`, etc.) from `@moonwitness/addons/storage`
  - Fixed `actionBindings`:
    - `storage.bucket`: `listUrl: "/api/v1/storage/buckets"` (remove broken POST `createUrl`)
    - `syslog.entry`: `listUrl: "/api/v1/syslog/messages"`
    - `radius.client`: `listUrl: "/api/v1/radius/users"`, `createUrl: "/api/v1/radius/users"`

- [ ] **Step 1: Write failing tests in `packages/addons/src/{storage,snmp,syslog,radius}/index.test.ts`**

Assert updated `actionBindings` match actual routes (`syslog.entry` → `/api/v1/syslog/messages`, `radius.client` → `/api/v1/radius/users`, `storage.bucket` has no phantom POST `createUrl`) and that `create{Storage,Snmp,Syslog,Radius}Addon(host)` self-mount their routes under `${host.prefix}/*`.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/storage/index.test.ts src/snmp/index.test.ts src/syslog/index.test.ts src/radius/index.test.ts`
Expected: FAIL.

- [ ] **Step 3: Move SigV4 and the 4 proxy route modules into `packages/addons/src/*` and update `bootstrap.ts`**

Move each route file into its owning addon directory, replacing `../../shared/upstream` imports with `@moonwitness/addon-runtime` and threading `resolveActorContextFromBridge(auth, request)` (including `tenantId`) into every ORM mirror write (`storageBucketModel`, `storageObjectModel`, `snmpDeviceModel`, `snmpTargetModel`) and `radius` audit log. Delete the 6 moved files from `apps/api`, update `bootstrap.ts` to 1-line calls, and update test imports.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons/src/storage packages/addons/src/snmp packages/addons/src/syslog packages/addons/src/radius apps/api
git commit -m "refactor(addons): co-locate storage, snmp, syslog, and radius proxy routes with aligned actionBindings"
```

---

### Task 11: Move `riot-ai` & `memory` into `@moonwitness/addons/ai`, Export `createPlatformAddons(host)`, and Prune `apps/api/package.json`

**Files:**

- Modify: `packages/addons/package.json` (add `"@moonwitness/ai": "workspace:*"`)
- Create:
  - `packages/addons/src/ai/persistence.ts`
  - `packages/addons/src/ai/audit.ts`
  - `packages/addons/src/ai/schemas.ts`
  - `packages/addons/src/ai/chat.ts`
  - `packages/addons/src/ai/riot-routes.ts`
  - `packages/addons/src/ai/memory-routes.ts`
- Modify: `packages/addons/src/ai/index.ts`, `packages/addons/src/index.ts`
- Delete:
  - `apps/api/src/interface/routes/riot-ai.persistence.ts`
  - `apps/api/src/interface/routes/riot-ai.audit.ts`
  - `apps/api/src/interface/routes/riot-ai.schemas.ts`
  - `apps/api/src/interface/routes/riot-ai.chat.ts`
  - `apps/api/src/interface/routes/riot-ai.routes.ts`
  - `apps/api/src/interface/routes/memory.routes.ts`
- Modify: `apps/api/src/bootstrap.ts`, `apps/api/package.json`
- Test: `packages/addons/src/ai/index.test.ts`, `apps/api/src/interface/routes/riot-ai.*.test.ts`, `apps/api/src/interface/routes/memory.routes.test.ts`

**Interfaces:**

- Consumes: `AddonHostContext`, `resolveActorContextFromBridge`, `validateServiceEndpointUrl`, `getUpstreamBridgeHeaders` (`@moonwitness/addon-runtime`), `@moonwitness/ai` (`OllamaAdapter`), `@moonwitness/contracts/continuity` (`MemorySyncBatchPayloadSchema`)
- Produces:
  - `createAiAddon(host?: Partial<AddonHostContext>): AddonDefinition` (with `riot_ai.provider_config` `actionBindings.listUrl === "/api/v1/riot-ai/config"`)
  - `createPlatformAddons(host: AddonHostContext): AddonDefinition[]` in `@moonwitness/addons` (canonical 15-addon composition list)
  - Thin `apps/api/src/bootstrap.ts` (~110 LOC) calling `createPlatformAddons(hostContext)`

- [ ] **Step 1: Write failing tests in `packages/addons/src/ai/index.test.ts`**

Assertions to add:

1. `"declares '/api/v1/riot-ai/config' for riot_ai.provider_config view actionBindings"`.
2. `"mounts /api/v1/riot-ai/* and /api/v1/memory/* from createAiAddon(host) and scopes memory entries by tenantId"`.
3. `"createPlatformAddons(host) returns all 15 domain addons with valid dependency order under AddonRuntimeController"`.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addons exec vitest run src/ai/index.test.ts`
Expected: FAIL (`actionBindings.listUrl` is `"/api/v1/riot-ai/status"`, `createPlatformAddons` not exported).

- [ ] **Step 3: Move `riot-ai` + `memory` into `packages/addons/src/ai/`, add `createPlatformAddons`, simplify `bootstrap.ts`, and prune `apps/api/package.json`**

1. Add `"@moonwitness/ai": "workspace:*"` to `packages/addons/package.json`.
2. Move `riot-ai.{persistence,audit,schemas,chat,routes}.ts` and `memory.routes.ts` into `packages/addons/src/ai/`; switch chat rate-limiting to `host.rateLimit(...)`, SSRF URL validation to `validateServiceEndpointUrl` from `@moonwitness/addon-runtime`, and thread `actor = resolveActorContextFromBridge(auth, request)` (`tenantId`) through `memory/entries`, `memory/sync`, `memory/knowledge` mirror, and `riot-ai` config/usage queries.
3. Update `packages/addons/src/ai/index.ts` (`listUrl: "/api/v1/riot-ai/config"`) and export `createPlatformAddons(host: AddonHostContext)` from `packages/addons/src/index.ts`.
4. Simplify `apps/api/src/bootstrap.ts` to register `[baseAddonDef, ...createPlatformAddons(hostContext)]`.
5. Delete the 6 moved files from `apps/api/src/interface/routes/` and update test imports.
6. Remove `@fastify/rate-limit`, `@moonwitness/ai`, and `@moonwitness/mid` from `apps/api/package.json` dependencies (keep `@libsql/client`, `pg`, and `bcrypt` in `apps/api/package.json` so `tsup`-bundled `dist/index.js` resolves native/driver externals cleanly under strict pnpm isolation).

- [ ] **Step 4: Run tests & production bundle verification**

Run: `pnpm --filter @moonwitness/addons typecheck; pnpm --filter @moonwitness/addons test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api lint; pnpm --filter @moonwitness/api test; pnpm --filter @moonwitness/api build`
Expected: PASS + clean `apps/api/dist/index.js` build. Verify `node -e "import('./apps/api/dist/index.js').catch((e)=>{console.error(e);process.exit(1)})"` does not throw `ERR_MODULE_NOT_FOUND` (or verify bundle externals via static check).

- [ ] **Step 5: Commit**

```bash
git add -A packages/addons apps/api
git commit -m "refactor(ai/api): co-locate riot-ai and memory in @moonwitness/addons/ai and collapse bootstrap to createPlatformAddons"
```

---

## Wave 4 — Architecture Fitness Gate & Documentation Sync

### Task 12: Add `apps/api/src/architecture.test.ts` Fitness Gate & Synchronize Docs

**Files:**

- Create: `apps/api/src/architecture.test.ts`
- Modify: `apps/api/README.md`
- Modify: `docs/orm-domain-backlog.md`

**Interfaces:**

- Consumes: `buildApp` (`./app`), `irViewModel` (`@moonwitness/addon-runtime`), `createUser`/`createSession` (`@moonwitness/addons/auth`)
- Produces: Permanent Vitest fitness gate (`API-GATE-01..08`) running in `pnpm test` and `pnpm gate:local`

- [ ] **Step 1: Write `apps/api/src/architecture.test.ts` asserting all 8 thin-host invariants**

Gates to assert:

- `API-GATE-01`: Zero `defineModel(` calls in non-test `apps/api/src/**/*.ts`.
- `API-GATE-02`: Zero `getDb(` calls in non-test `apps/api/src/**/*.ts` outside `health.routes.ts` and `infrastructure/rate-limit.ts`.
- `API-GATE-03`: Zero domain route files in `apps/api/src` — only `health.routes.ts` and `metrics.ts` allowed under `interface/routes/` (or `routes/`).
- `API-GATE-04`: Total non-test LOC across `apps/api/src/**/*.ts` `<= 1350` (ratchet ceiling).
- `API-GATE-05`: Boot `buildApp()` on temp SQLite DB, query all `irViewModel.repository.find()` rows, parse every `action_bindings_json`, and assert **every** declared `listUrl`, `createUrl`, `updateUrl`, `archiveUrl`, `restoreUrl`, `deleteUrl`, `historyUrl`, and `customActions[].urlTemplate` (converting `{id}` → `:id`) matches a live registered route in `app.printRoutes()` — **zero phantom 404 `actionBindings`**.
- `API-GATE-06`: Zero `applyMigrations(` calls in non-test `apps/api/src` and `packages/addons/src`.
- `API-GATE-07`: Zero `syncModels(` calls inside `packages/addons/src/**/routes.ts` or `**/service.ts` HTTP handlers (allowed only in `ensure*` test/bootstrap helpers and `addon-runtime`).
- `API-GATE-08`: End-to-end multi-tenant smoke test booting `buildApp()`, writing records as admin with `x-tenant-id: tenant-a`, and asserting reads as `x-tenant-id: tenant-b` return empty sets on `/api/v1/timeline/events`, `/api/v1/command-center/state`, `/api/v1/memory/entries`, `/api/v1/audit/logs`, and `/api/v1/m/canon.codex`.

- [ ] **Step 2: Run the new architecture gate**

Run: `pnpm --filter @moonwitness/api exec vitest run src/architecture.test.ts`
Expected: PASS (if any gate flags a missed file, leftover import, or unmatched `actionBindings` URL, fix it inline before proceeding).

- [ ] **Step 3: Update `apps/api/README.md` and `docs/orm-domain-backlog.md`**

Update `apps/api/README.md` to document the thin-host architecture (`buildCoreApp`, `AddonHostContext`, `createPlatformAddons`, `architecture.test.ts` gates `API-GATE-01..08`). Update `docs/orm-domain-backlog.md` to mark legacy scaffolding (`identity_*`, `domainMigrations`, `db/seeders`, `orm-event.repository`) as retired and superseded by `@moonwitness/addons/*` + `syncModels()`.

- [ ] **Step 4: Run full monorepo verification**

Run:

```bash
pnpm --filter @moonwitness/orm test
pnpm --filter @moonwitness/addon-runtime lint && pnpm --filter @moonwitness/addon-runtime typecheck && pnpm --filter @moonwitness/addon-runtime test
pnpm --filter @moonwitness/addons lint && pnpm --filter @moonwitness/addons typecheck && pnpm --filter @moonwitness/addons test
pnpm --filter @moonwitness/api lint && pnpm --filter @moonwitness/api typecheck && pnpm --filter @moonwitness/api test && pnpm --filter @moonwitness/api build
pnpm --filter @moonwitness/ui exec vitest run src/dx/architecture.test.ts
```

Expected: ALL PASS with zero errors, zero stray `.db` files in `git status`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/architecture.test.ts apps/api/README.md docs/orm-domain-backlog.md
git commit -m "test(api): enforce thin-host ORM/addon architecture gates (API-GATE-01..08) and update docs"
```
