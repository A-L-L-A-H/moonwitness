# MoonWitness Odoo++ Wave 1 — Core Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the zero-migration Odoo++ runtime core (`syncModels()`, mutable `ModelRegistry`, `extendModel()`, live `_attrs` custom fields, `ir_*` system registry, zero-restart addon toggle, RBAC-gated `/_meta/views|navigation`, opt-in `/api/v1/m/:model`, and `<AutoModelView />`) and prove it by converting `addon-timeline` off manual migrations.

**Architecture:** `defineModel()` registers models into a mutable runtime `ModelRegistry` inside `@moonwitness/orm`; `syncModels()` introspects SQLite/Postgres tables and indexes on boot/upgrade without checksum-locked migration files. `@moonwitness/addon-base` owns `ir_addons`/`ir_models`/`ir_model_fields`/`ir_rules`/`ir_views`/`ir_menus` and pre-mounts all workspace addon Fastify scopes behind a live cache-backed `requireAddonEnabled()` guard so enable/disable requires zero restart.

**Tech Stack:** TypeScript 5.9, Zod 4, `@moonwitness/orm` (`@libsql/client`, Postgres SQL translation, Cloudflare D1 adapter), Fastify 5, React 19 + Next.js 16 + `@moonwitness/ui`, Vitest 4/5.

**Spec:** [2026-11-18-odoo-plus-addon-system-design.md](../specs/2026-11-18-odoo-plus-addon-system-design.md) (`ACCEPTED`)

## Global Constraints

- Stay strictly on local Git branch `dev` (`AGENTS.md`); zero extra local branches, zero stray `.db*` files in workspace cwd (`mkdtemp` in tests).
- No manual SQL migration files for new addon models — `syncModels()` derives DDL and non-destructive `ALTER TABLE ADD COLUMN` directly from `defineModel()` / `extendModel()`.
- Never auto-drop columns or alter data destructively on startup; deprecated DB columns remain untouched and are marked `deprecated: true` in `ir_model_fields`.
- Keep `/_meta/models`, `/_meta/models/:name`, `/_meta/openapi.json`, and `/_meta/llms.txt` scoped to explicit `publicFields` allowlists; gate `/_meta/addons`, `/_meta/views/*`, `/_meta/navigation`, `/_meta/models/*/fields`, and `/api/v1/m/*` with verified auth + `ir_rules`.
- Zero new npm dependencies without lockfile reconciliation; keep `packages/addons/__base` and `packages/ui` compatible with existing workspace deps.
- Postgres (`isPostgresUrl`) and SQLite (`LibSqlExecutor`) compatibility must both remain green (`translateSqlForPostgres` + driver tests).

## Review Focus

1. Adding a `NOT NULL` column without `.default(...)` via `defineModel()` or `extendModel()` to a table that already exists in DB must fail fast with an actionable error instead of running invalid SQL or corrupting rows — pinned by `Task 2` test `rejects non-null field addition without default on existing table`.
2. Calling any endpoint of a `disabled` addon (including runtime-toggled routes) must fail closed with HTTP `503 ADDON_DISABLED` without requiring Fastify restart — pinned by `Task 3` & `Task 4` test `enforces live addon enable/disable without restarting Fastify`.
3. Submitting an unknown or invalidly typed field into an `extensible: true` model's `_attrs` payload, or requesting `POST /_meta/models/:name/fields` as non-admin (`editor`/`viewer`), must be rejected (`400`/`403`) — pinned by `Task 1` & `Task 4` tests.
4. Attempting `GET /_meta/views/:model` or `/api/v1/m/:model` for a model with `restEnabled: false` or insufficient `ir_rules` role must fail closed (`403` / `404`), and models declaring worker/state-machine `actionBindings` must preserve custom proxy endpoints rather than routing writes to `/api/v1/m/:model` — pinned by `Task 4` & `Task 5` tests.
5. Adopting a pre-ORM legacy table lacking `BaseMetadata` columns when `legacyBackfill: true` is passed must safely backfill `id`, `create_date`, `write_date`, `status = 'active'`, `version = 1`, `source = 'migration'` without failing non-null checks — pinned by `Task 2` test `backfills BaseMetadata on legacy tables when legacyBackfill is enabled`.

---

### Task 1: Mutable `ModelRegistry`, `extendModel()`, Live Custom Fields & Write Outbox (`@moonwitness/orm`)

**Files:**

- Create: `packages/orm/src/registry.ts`
- Modify: `packages/orm/src/define-model.ts` (`defineModel`, `BaseRepository`, `DefineModelOptions`, `writeAudit`)
- Modify: `packages/orm/src/index.ts`
- Test: `packages/orm/src/__tests__/orm.registry.test.ts`

**Interfaces:**

- Consumes: `@moonwitness/orm` `unwrap`/`fieldSpec`/`BaseMetadata`/`AuditEntry` internals
- Produces:
  - `modelRegistry`: singleton `ModelRegistry` with `.register(def)`, `.extend(ext: ExtendModelOptions)`, `.setRuntimeCustomFields(modelName, fields: RuntimeCustomFieldSpec[])`, `.get(name)`, `.list()`, `.clearForTests()`
  - `extendModel(targetModelName: string, options: { addon: string; fields: z.ZodObject<any>; indexes?: ModelIndex[] }): ModelExtensionDef`
  - `onModelWrite(modelPattern: string, handler: (event: ModelWriteEvent) => Promise<void> | void): () => void`
  - `DefineModelOptions.extensible?: boolean`, `DefineModelOptions.restEnabled?: boolean`, `DefineModelOptions.publicFields?: string[]`

- [ ] **Step 1: Write failing tests in `packages/orm/src/__tests__/orm.registry.test.ts`**

Test cases:

1. `extendModel()` merges extension Zod fields & indexes into parent `ModelRegistry` entry without breaking base `create`/`find`/`update`.
2. `extensible: true` injects `_attrs` JSON column, validates registered `setRuntimeCustomFields(model, [{ name: "priority", type: "integer", required: true }])` on `create`/`update`, and rejects wrong types.
3. `onModelWrite("timeline.*", handler)` fires with `CREATE`/`UPDATE` diff after repository transaction succeeds, and unsubscribe removes listener.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/orm exec vitest run src/__tests__/orm.registry.test.ts`
Expected: FAIL (`Cannot find module '../registry.js'`).

- [ ] **Step 3: Implement `ModelRegistry`, `extendModel()`, `onModelWrite()` in `packages/orm/src/registry.ts`**

Store mutable composed model descriptors keyed by `model.name`. Compose base fields + extensions + runtime custom field validators cleanly; export `RuntimeCustomFieldSpec`, `ModelExtensionDef`, `ModelWriteEvent`, `modelRegistry`, `extendModel`, and `onModelWrite`. Extract default literal metadata inside `unwrapWithDefault` in `define-model.ts` (`defaultValue?: unknown`, `hasDefault: boolean`) so Task 2 uses exact SQL default descriptors.

- [ ] **Step 4: Wire `define-model.ts` and `BaseRepository` to `modelRegistry` & `_attrs` + outbox**

Update `defineModel()` so `extensible: true` adds `_attrs: z.record(z.string(), z.unknown()).default({})` (`TEXT DEFAULT '{}'` in DDL), registers the model into `modelRegistry`, and delegates validation/column lists inside `BaseRepository` to `modelRegistry.get(name)` dynamically (preserving existing 40 ORM tests verbatim). Invoke `emitModelWrite()` at the end of `create`/`update`/`archive`/`restore`/`delete` after audit insert commits. Export all new symbols in `packages/orm/src/index.ts`.

- [ ] **Step 5: Run tests & checks**

Run: `pnpm --filter @moonwitness/orm typecheck; pnpm --filter @moonwitness/orm lint; pnpm --filter @moonwitness/orm test`
Expected: PASS (`orm.core`, `orm.hardening`, `orm.backup`, `d1.driver`, `postgres.driver`, and `orm.registry` all green).

---

### Task 2: Zero-Migration `syncModels()` Schema Introspector & Safe `ALTER TABLE` Engine (`@moonwitness/orm`)

**Files:**

- Create: `packages/orm/src/sync.ts`
- Modify: `packages/orm/src/index.ts`
- Modify: `packages/orm/src/drivers/postgres.driver.ts` (add `PRAGMA index_list(table)` SQL translation if missing alongside existing `PRAGMA table_info`)
- Test: `packages/orm/src/__tests__/orm.sync.test.ts`

**Interfaces:**

- Consumes: `modelRegistry` (`get`, `list`), `getDb()`, `AUDIT_DDL`, `isPostgresUrl`
- Produces:
  - `syncModels(models?: Array<string | DefineModelReturn<any>>, options?: { legacyBackfill?: boolean; dialect?: "sqlite" | "postgres" }): Promise<SyncReport>`
  - `SyncReport`: `{ createdTables: string[]; addedColumns: Array<{ table: string; column: string }>; deprecatedColumns: Array<{ table: string; column: string }>; createdIndexes: string[]; schemaHashes: Record<string, string> }`

- [ ] **Step 1: Write failing tests in `packages/orm/src/__tests__/orm.sync.test.ts`**

Test cases:

1. Creates new tables & indexes when DB is empty (idempotent on 2nd run).
2. `ALTER TABLE ADD COLUMN` adds new nullable and `.default("open")` columns after table is populated, preserving existing rows and returning deterministic defaults.
3. Rejects adding non-null column without `.default(...)` on an already-existing table with clear error message naming `table` & `column`.
4. Marks DB columns removed from Zod schema as `deprecatedColumns` in `SyncReport` without issuing `DROP COLUMN`.
5. `extendModel()` columns added by another module sync onto the same physical table cleanly.
6. Backfills `BaseMetadata` (`id`, `create_date`, `write_date`, `status = 'active'`, `version = 1`, `source = 'migration'`) when `legacyBackfill: true` is run against a pre-ORM SQLite table containing rows.
7. Postgres dialect path translates `PRAGMA table_info` / `index_list` queries or `information_schema` inspection cleanly.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/orm exec vitest run src/__tests__/orm.sync.test.ts`
Expected: FAIL (`Cannot find module '../sync.js'`).

- [ ] **Step 3: Implement `syncModels()` in `packages/orm/src/sync.ts` and Postgres `index_list` translation**

Implement deterministic column diffing, safe SQL default literal formatting (`TEXT` single-quote escaped, `INTEGER` numeric/0/1, `JSON` quoted `{}`/`[]`), `legacyBackfill` `BaseMetadata` add + backfill update inside a transaction, and SHA-256 canonical schema hashing per model (`schemaHashes`). Re-export `syncModels` and `SyncReport` from `packages/orm/src/index.ts`.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/orm typecheck; pnpm --filter @moonwitness/orm lint; pnpm --filter @moonwitness/orm test`
Expected: PASS.

---

### Task 3: `ir_*` System Registry Models & Zero-Restart `AddonRegistry` Upgrade (`@moonwitness/addon-base`)

**Files:**

- Create: `packages/addons/__base/src/ir-models.ts`
- Create: `packages/addons/__base/src/runtime.ts`
- Modify: `packages/addons/__base/src/registry.ts` (support `provides.extends`, `autoInstall`, `defaultEnabled`)
- Modify: `packages/addons/__base/src/addon.ts` (`runAddonLifecycle` using `syncModels()` instead of `applyMigrations()`)
- Modify: `packages/addons/__base/src/index.ts`
- Test: `packages/addons/__base/src/runtime.test.ts`

**Interfaces:**

- Consumes: `@moonwitness/orm` (`defineModel`, `syncModels`, `modelRegistry`, `SyncReport`)
- Produces:
  - System models: `irAddonModel` (`ir_addons`), `irModelRecord` (`ir_models`), `irModelFieldModel` (`ir_model_fields`), `irRuleModel` (`ir_rules`), `irViewModel` (`ir_views`), `irMenuModel` (`ir_menus`)
  - `AddonDefinition`: `{ manifest: AddonManifestInput; models?: DefineModelReturn<any>[]; extensions?: ModelExtensionDef[]; rules?: IrRuleInput[]; views?: IrViewInput[]; menus?: IrMenuInput[]; registerRoutes?: (scope: FastifyInstance) => Promise<void> | void; seed?: () => Promise<void> | void }`
  - `AddonRuntimeController`: `.syncAll(addons)`, `.isEnabled(name)`, `.enable(name, actor)`, `.disable(name, actor)`, `.requireAddonEnabled(name)` Fastify `preHandler`, `.getNavigationForRole(role)`, `.getViewForModel(model, role)`

- [ ] **Step 1: Write failing tests in `packages/addons/__base/src/runtime.test.ts`**

Test cases:

1. `AddonRegistry` rejects two addons owning the same model (`provides.models`) while allowing downstream addon `provides.extends` on parent model.
2. `runAddonLifecycle()` calls `syncModels()` (zero migration files), persists `ir_addons`, `ir_models`, `ir_model_fields`, and runs `seed()` only on first install or `version` bump.
3. Pre-mounted Fastify route wrapped in `requireAddonEnabled("sample")` returns `200` when installed, `503 ADDON_DISABLED` immediately after `runtime.disable("sample")`, and `200` again after `runtime.enable("sample")` without recreating Fastify.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addon-base exec vitest run src/runtime.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `ir-models.ts`, `registry.ts` updates, and `runtime.ts`**

Define all 6 `ir_*` models via `defineModel()`. Update `AddonRegistry` to validate `provides.extends` targets exist in dependency chain (`depends`). Implement `AddonRuntimeController` managing the in-memory `enabledAddons: Map<string, boolean>` synchronized atomically with `ir_addons`, seeding `ir_rules`/`ir_views`/`ir_menus`, and keeping runtime custom fields (`ir_model_fields` where `is_custom = true`) applied to `modelRegistry`. Ensure `runAddonLifecycle()` preserves backwards compatibility for existing `apps/api` tests until Task 6 finishes migrating callers.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addon-base typecheck; pnpm --filter @moonwitness/addon-base test`
Expected: PASS.

---

### Task 4: Admin/Agent Meta API, Live Custom Field Registration & Generic Model CRUD (`/api/v1/_meta/*`, `/api/v1/m/:model`) (`@moonwitness/addon-base` & `apps/api`)

**Files:**

- Modify: `packages/addons/__base/src/metadata.ts` (keep public allowlist `/_meta/models*`, `/_meta/openapi.json`, `/_meta/llms.txt`; register protected runtime routes `/_meta/addons`, `/_meta/addons/:name/enable|disable`, `/_meta/models/:name/fields`, `/_meta/fields/:id`, `/_meta/navigation`, `/_meta/views/:model`)
- Create: `packages/addons/__base/src/generic-crud.ts` (`registerGenericModelRoutes` for opt-in `restEnabled` models, enforcing `ir_rules` ACL, `FindOptions` `$ne`/`$gt`/`$in`/`$like`/`$ilike`, `version` conflict `409`, `_attrs` validation, `history`)
- Modify: `packages/addons/__base/src/index.ts`
- Modify: `apps/api/src/bootstrap.ts` (wire `AddonRuntimeController` + generic model routes + auth guards)
- Test: `packages/addons/__base/src/generic-crud.test.ts` & `apps/api/src/addon-meta-runtime.test.ts`

**Interfaces:**

- Consumes: `AddonRuntimeController`, `modelRegistry`, `requireAuth`/`requireRole` hook callbacks passed cleanly from `apps/api` host via `registerBaseAddon(fastify, opts)` so `@moonwitness/addon-base` stays decoupled from `apps/api` session internals.
- Produces: HTTP contract for:
  - `GET /api/v1/_meta/addons`, `POST /api/v1/_meta/addons/:name/enable`, `POST /api/v1/_meta/addons/:name/disable` (admin)
  - `POST /api/v1/_meta/models/:name/fields`, `PATCH /api/v1/_meta/fields/:id` (admin)
  - `GET /api/v1/_meta/navigation` (authenticated; filters by role + enabled addons)
  - `GET /api/v1/_meta/views/:model` (authenticated; includes `fields`, `views`, `actionBindings`, and caller ACL `{ canRead, canCreate, canUpdate, canDelete }`)
  - `GET/POST /api/v1/m/:model`, `GET/PATCH/DELETE /api/v1/m/:model/:id`, `POST /api/v1/m/:model/:id/archive|restore`, `GET /api/v1/m/:model/:id/history`

- [ ] **Step 1: Write failing tests in `packages/addons/__base/src/generic-crud.test.ts` and `apps/api/src/addon-meta-runtime.test.ts`**

Test cases:

1. Anonymous `GET /_meta/models` remains public and exposes only `publicFields`; anonymous `GET /_meta/views/timeline.event` and `POST /api/v1/m/timeline.event` return `401`.
2. Non-admin (`editor`) calling `POST /_meta/addons/timeline/disable` or `POST /_meta/models/timeline.event/fields` receives `403`.
3. Admin registering a live custom field `POST /_meta/models/:name/fields` (`{ field_name: "priority", field_type: "integer", label: "Priority", ui_widget: "number" }`) makes subsequent `POST /api/v1/m/:model` validate & persist `_attrs.priority` and surfaces it in `GET /_meta/views/:model`.
4. Generic CRUD rejects access (`404`) when model has `restEnabled: false`, enforces `ir_rules` (`viewer` cannot `POST`/`PATCH`), returns `409` on stale `version`, and returns `history` entries.
5. Disabling an addon via `POST /_meta/addons/:name/disable` hides its menus from `GET /_meta/navigation` and returns `503` on its routes without server restart.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/addon-base test; pnpm --filter @moonwitness/api exec vitest run src/addon-meta-runtime.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `generic-crud.ts`, protected `/_meta/*` routes in `metadata.ts`, and wire into `apps/api/src/bootstrap.ts`**

Ensure `apps/api/src/bootstrap.ts` passes `auth: { authenticate, requireRole, getUserRole }` cleanly into `registerBaseAddon()` and exposes routes under both `/_meta/*` (existing root health/discovery paths) and `/api/v1/_meta/*` + `/api/v1/m/*` cleanly without Fastify route collision.

- [ ] **Step 4: Run tests & checks**

Run: `pnpm --filter @moonwitness/addon-base typecheck; pnpm --filter @moonwitness/addon-base test; pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api exec vitest run src/addon-meta-runtime.test.ts src/addon-lifecycle.test.ts src/app.test.ts`
Expected: PASS.

---

### Task 5: Dynamic View Renderer (`<AutoModelView />`) & Metadata Navigation (`@moonwitness/ui` & `apps/web`)

**Files:**

- Create: `packages/ui/src/composites/auto-model-view.tsx` (pure UI renderer + widget mapping for `text`, `textarea`, `select`, `number`, `date`, `checkbox`, `tags`, + audit history drawer)
- Modify: `packages/ui/src/index.ts` & `packages/ui/package.json`
- Create: `apps/web/src/lib/api/meta-views.ts` (`useMetaNavigation`, `useMetaView`, `useMetaAddons`, dynamic CRUD fetchers respecting `actionBindings`)
- Create: `apps/web/src/components/meta/auto-model-console.tsx` (wired container binding `AutoModelView` to live API + `actionBindings`)
- Modify: `apps/web/src/components/shell/console-shell-adapter.tsx` (merge `/_meta/navigation` with static fallback nav cleanly)
- Test: `packages/ui/src/composites/auto-model-view.test.ts` & `apps/web/tests/meta-navigation.test.ts`

**Interfaces:**

- Consumes: `GET /api/v1/_meta/navigation`, `GET /api/v1/_meta/views/:model`, `actionBindings` endpoints (`listUrl`, `createUrl`, `updateUrl`, `archiveUrl`, `deleteUrl`, `historyUrl`)
- Produces: `<AutoModelView descriptor={...} rows={...} onCreate={...} onUpdate={...} onArchive={...} onDelete={...} />` in `@moonwitness/ui` and `<AutoModelConsole model="..." />` in `apps/web`.

- [ ] **Step 1: Write failing tests in `packages/ui/src/composites/auto-model-view.test.ts` and `apps/web/tests/meta-navigation.test.ts`**

Test cases:

1. `<AutoModelView />` renders list columns, custom `_attrs` fields registered in metadata, hides Create/Edit/Delete buttons when `acl` denies them, and disables conflicting submit on invalid required fields.
2. `meta-views` API client uses `actionBindings.createUrl` (e.g. `/api/v1/command-center/workflows` instead of `/api/v1/m/...`) when defined on `ir_views`.
3. `ConsoleShellAdapter` keeps static fallback nav when unauthenticated/offline and filters out items whose addon is disabled when `/_meta/navigation` returns a filtered active set.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @moonwitness/ui test; pnpm --filter @moonwitness/web exec vitest run tests/meta-navigation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `<AutoModelView />`, `meta-views.ts`, `auto-model-console.tsx`, and shell navigation sync**

Adhere strictly to `@moonwitness/ui` Design DNA tokens (`ZineCardRough`, `Input`, `Badge`, accessible contrast, keyboard focus) so zero contrast tests break (`pnpm ui:contrast`).

- [ ] **Step 4: Run tests, contrast check & web build**

Run: `pnpm --filter @moonwitness/ui typecheck; pnpm --filter @moonwitness/ui test; pnpm --filter @moonwitness/ui ui:contrast; pnpm --filter @moonwitness/web typecheck; pnpm --filter @moonwitness/web lint; pnpm --filter @moonwitness/web test`
Expected: PASS.

---

### Task 6: Convert `addon-timeline` to Zero-Migration Auto-Sync + Action Bindings Proof Pilot

**Files:**

- Modify: `packages/addons/timeline/manifest.json` (mark `autoInstall: true`, update metadata; remove `migrations` list or keep informational empty)
- Modify: `packages/addons/timeline/src/model.ts` (mark `extensible: true`, define `publicFields`)
- Create: `packages/addons/timeline/src/views.ts` (`timelineRules`, `timelineViews` with `actionBindings` pointing to `/api/v1/timeline/events*`, `timelineMenus`)
- Modify: `packages/addons/timeline/src/index.ts` (export `addon: AddonDefinition` wired with `syncModels`, `seedTimeline`, `views`, `rules`, `menus`)
- Modify: `apps/api/src/bootstrap.ts` (stop passing `timelineMigrations` to `applyMigrations`; let `AddonRuntimeController.syncAll` auto-sync `timeline`)
- Modify: `apps/web/src/components/dock/event-detail-panel.tsx` (optional dynamic custom `_attrs` fields display when `timeline.event` has registered `ir_model_fields`)
- Test: `packages/addons/timeline/src/index.test.ts` & `apps/api/src/app.test.ts`

**Interfaces:**

- Consumes: Tasks 1–5 (`syncModels`, `AddonDefinition`, `AddonRuntimeController`, `ir_views` with `actionBindings`)
- Produces: `timelineAddon: AddonDefinition` operating end-to-end with zero SQL migration files.

- [ ] **Step 1: Write failing test verifying `addon-timeline` auto-syncs without `_orm_schema_migrations` dependency**

Add test in `packages/addons/timeline/src/index.test.ts` proving `runAddonLifecycle()` creates `timeline_events` & `timeline_eras`, supports `extendModel("timeline.event", ...)` column auto-sync, and registers `ir_views` pointing writes to `/api/v1/timeline/events`.

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @moonwitness/addon-timeline test`
Expected: FAIL.

- [ ] **Step 3: Implement `views.ts`, `extensible: true` + `_attrs` support on `timelineEventModel`, `timelineAddon`, and update `bootstrap.ts`**

Remove manual `applyMigrations(timelineMigrations)` call in `apps/api/src/bootstrap.ts` (keep `timelineMigrations` deprecated export only if needed externally or remove cleanly once all callers updated). Ensure all existing `/api/v1/timeline/*` endpoints, RBAC, and Dock tests remain green.

- [ ] **Step 4: Run full Wave 1 workspace verification**

Run:

- `pnpm --filter @moonwitness/orm typecheck; pnpm --filter @moonwitness/orm lint; pnpm --filter @moonwitness/orm test`
- `pnpm --filter @moonwitness/addon-base typecheck; pnpm --filter @moonwitness/addon-base test`
- `pnpm --filter @moonwitness/addon-timeline typecheck; pnpm --filter @moonwitness/addon-timeline lint; pnpm --filter @moonwitness/addon-timeline test`
- `pnpm --filter @moonwitness/ui typecheck; pnpm --filter @moonwitness/ui lint; pnpm --filter @moonwitness/ui test`
- `pnpm --filter @moonwitness/api typecheck; pnpm --filter @moonwitness/api lint; pnpm --filter @moonwitness/api test; pnpm --filter @moonwitness/api build`
- `pnpm --filter @moonwitness/web typecheck; pnpm --filter @moonwitness/web lint; pnpm --filter @moonwitness/web test; pnpm --filter @moonwitness/web build`

Expected: All 6 packages exit 0, `git branch --show-current` = `dev`, stray `.db*` = `0`.

---

## Downstream Waves (Separate Plan Files After Wave 1 Verification)

Per `writing-plans` modularity rule, Waves 2–4 each get their dedicated task plan consuming Wave 1's verified `AddonRuntimeController` & `syncModels()`:

- **Wave 2 (`2026-11-18-odoo-plus-wave-2-identity-audit.md`):** Consolidate `@moonwitness/mid` (`MidIdentityStore` string IDs) + `addon-auth` (retire duplicate `identity_*` + legacy `users`/`sessions`) + `addon-audit` + `addon-i18n`.
- **Wave 3 (`2026-11-18-odoo-plus-wave-3-ops-control-ai.md`):** Extract `addon-control`, `addon-command-center`, `addon-probes`, `addon-ai` (`services/memory` bridge).
- **Wave 4 (`2026-11-18-odoo-plus-wave-4-workers-canon-epistemic.md`):** Extract `addon-storage`, `addon-snmp`, `addon-syslog`, `addon-radius`, `addon-canon-lore`, `addon-witness-research`, `addon-epistemic`.
