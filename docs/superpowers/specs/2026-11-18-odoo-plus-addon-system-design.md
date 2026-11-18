---
status: "ACCEPTED"
date: "2026-11-18"
branch: "dev"
owner: "MoonWitness Architecture"
supersedes_partially:
  - "docs/superpowers/plans/2026-11-11-meta-model-driven-framework.md"
related_adrs:
  - "docs/architecture/adr-001-api-versioning.md"
  - "docs/architecture/adr-004-addon-system.md"
  - "docs/architecture/adr-006-three-app-topology-and-trust-zones.md"
  - "docs/architecture/adr-007-rocksoul-local-execution-and-data-boundary.md"
---

# Design Spec: MoonWitness Odoo++ Addon & Zero-Migration Auto-Sync Architecture

> **Status:** `ACCEPTED` (Owner selected Approach C on 2026-11-18 and delegated full architectural choices; builder-review resolutions incorporated below)

## 1. Intent & Why

Menjadikan **Addon System** (`packages/addons/*`) sebagai arsitektur tunggal platform MoonWitness di backend (`apps/api`) dan experience/console (`apps/web`), bergaya **Odoo++**:

- **Zero migration files:** Developer cukup mendeklarasikan atau mengubah `defineModel()` / `extendModel()` — ORM otomatis membuat tabel, menambah kolom baru, dan menyinkronkan index pada startup/upgrade (`_auto_init`), tanpa menulis atau mengunci file SQL migrasi manual.
- **Full-stack modular addons:** Setiap kapabilitas platform (auth, audit, timeline, canon/knowledge/witness, AI, control plane, probes, storage/network telemetry, epistemic engines) dikemas sebagai addon self-contained dengan manifest, dependency graph, auto-synced models, RBAC rules, REST endpoints, seed idempoten, dan deskriptor UI.
- **Lebih canggih dari Odoo klasik:** Schema ditulis sekali sebagai **Zod + TypeScript** → otomatis menjadi SQL DDL/sync, OpenAPI 3.0, REST + filter operators, Dynamic UI Views (`ir.views`), audit event-stream (`_orm_audit_log`), hot-extensible `_attrs`, serta `/_meta/models` + `/_meta/llms.txt` untuk AI agents.

---

## 2. Goals, Non-Goals, Anti-Goals & Constraints

### Goals

1. Menghapus kebutuhan file migrasi manual (`authMigrations`, `domainMigrations`, `timelineMigrations`, DLL SQL per versi) melalui **`syncModels()`** non-destruktif berbasis schema introspection.
2. Menyediakan **`extendModel()`** (Odoo `_inherit`) agar addon hilir dapat menambah field/kolom/index ke model addon inti secara type-safe tanpa duplikasi tabel.
3. Menyediakan system registry persistence (`ir_addons`, `ir_models`, `ir_model_fields`, `ir_rules`, `ir_views`, `ir_menus`) dengan auto-discovery addon, topological load via `depends`, auto-upgrade saat versi/schema berubah, dan runtime enable/disable toggle per modul.
4. Menyediakan **Auto-Generated UI Views** (`<AutoModelView />`) dan navigasi dinamis di `packages/ui` + `apps/web` untuk form, tabel, filter, detail, dan audit history langsung dari metadata `/_meta/views/:model` & `/_meta/navigation`.
5. Mengekstrak seluruh domain hardcoded di `apps/api/src/infrastructure/persistence/domain/*` dan modul `ADR-006` / `services/*` / `engines/*` ke dalam katalog addon resmi di `packages/addons/*`.

### Non-Goals

1. **Tidak memecah modular monolith menjadi microservices per addon:** Per [`adr-006`](../../architecture/adr-006-three-app-topology-and-trust-zones.md), `apps/api` tetap satu process Fastify modular monolith dan `apps/web` tetap satu aplikasi Next.js; worker eksternal (`services/*` Rust & `cp/arsy` Go) tetap dijalankan sebagai worker independen yang diintegrasikan lewat connector addon.
2. **Tidak mengubah Trust Zone B (`apps/rocksoul`):** Batas data lokal `apps/rocksoul` tetap tunduk pada [`adr-007`](../../architecture/adr-007-rocksoul-local-execution-and-data-boundary.md).
3. **Tidak membuka write schema untuk domain yang ditunda:** `Justice / ANGEL WITH SHOTGUN` tetap ditunda (`ADR-006 §2`) hingga kebijakan eksplisit disetujui.
4. **Tidak melakukan auto-`DROP COLUMN` saat boot:** Penghapusan field di kode hanya menandai kolom `deprecated` di `ir_model_fields` agar tidak pernah menghancurkan data produksi secara diam-diam.

### Anti-Goals

- **Zero Dual-Persistence:** Tidak boleh ada tabel ganda seperti `timeline_events` vs `ops_events` atau `users` vs `identity_user_profiles` yang berjalan terpisah secara permanen.
- **Zero Dynamic Renderer Regression:** `<AutoModelView />` wajib memakai Design DNA tokens (`@moonwitness/ui`) dan tidak menggantikan UX naratif/game custom di `/mission-control`, `/dock`, `/scriptures`, `/mtime`, atau `/codex`.
- **Zero Unauthenticated Metadata Leaks:** Endpoint `/_meta/views`, `/_meta/navigation`, `/_meta/addons` wajib memfilter aksi/menu berdasarkan RBAC caller; kolom sensitif (`password_hash`, `*_token`, `*secret*`) dilarang terekspos di `/_meta/*`.

---

## 3. Approaches Considered & Selected Approach

| Pendekatan                                                                             | Ringkasan                                                                                                                                                | Trade-off                                                                                                                          | Keputusan                 |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **A — Core Auto-Sync + Incremental Extraction**                                        | Bangun `syncModels()` + `extendModel()` + `ir_addons`, lalu ekstrak modul API ke addon bertahap.                                                         | Aman & zero-downtime, tapi UI `apps/web` masih perlu wiring manual per halaman CRUD baru.                                          | Bagian inti diadopsi ke C |
| **B — Hard Cutover Sekaligus**                                                         | Cabut semua tabel legacy (`users`, `sessions`, raw SQL) & refactor seluruh 15 addon dalam satu gelombang besar.                                          | Bersih sekaligus, tapi blast radius migrasi `users` & test suite sangat tinggi.                                                    | Ditolak                   |
| **C — Core Auto-Sync + Incremental Extraction + Auto-Generated UI Views (`ir.views`)** | Gabungan auto-sync schema, model inheritance, runtime addon registry, ekstraksi bertahap, plus auto-generated REST & UI view renderer berbasis metadata. | Kompleksitas awal lebih tinggi pada view engine, namun menghilangkan boilerplate CRUD backend & frontend untuk seluruh addon baru. | **Dipilih Owner (`C`)**   |

---

## 4. Architecture: The Odoo++ Engine

### 4.1 Zero-Migration Schema Auto-Sync (`packages/orm`)

Menggantikan pola `Migration[]` + checksum lock (`_orm_schema_migrations`) dengan fungsi **`syncModels(models, options)`** yang idempoten:

```
Addon Load / Upgrade
  └─▶ Collect base models + extendModel() patches
        └─▶ For each model (SQLite / D1 / Postgres):
              1. Introspect DB: PRAGMA table_info(table) / information_schema.columns
                                + index_list / pg_indexes
              2. Table absent? ─▶ CREATE TABLE IF NOT EXISTS (BaseMetadata + schema cols)
              3. Missing column? ─▶ Validate nullable or default present ─▶ ALTER TABLE ADD COLUMN
                 (Fail-fast startup error if non-null column added without default!)
              4. Existing DB column missing from schema? ─▶ Mark `deprecated` in ir_model_fields (NO DROP)
              5. Missing index? ─▶ CREATE [UNIQUE] INDEX IF NOT EXISTS
              6. Update ir_models & ir_model_fields snapshot + schema hash
```

- **Fail-safe constraint & legacy backfill:** Di SQLite/Postgres, `ALTER TABLE ADD COLUMN` pada tabel berisi data hanya diizinkan otomatis jika kolom `nullable()` atau memiliki `.default(...)`. Bila developer menambah field wajib tanpa default pada model existing, `syncModels()` melempar error deskriptif agar developer memberi `.default(...)`. Khusus **first-time adoption pada tabel legacy non-ORM** (`command_center_workflows`, `igate_nodes`, dll.), `syncModels()` menyediakan mode backfill aman: menambah kolom `BaseMetadata` (`id`, `create_date`, `write_date`, `status='active'`, `version=1`, `source='migration'`) beserta default sementara lalu mengisi baris kosong sebelum menegakkan constraint strict.
- **Live Typed Custom Fields (`extensible: true` + `_attrs` + `ir_model_fields`):** Model yang menandai `extensible: true` mendapat kolom JSON `TEXT` (`JSONB` di Postgres) `_attrs` **sekaligus** mendukung registrasi field runtime terketik via `POST /_meta/models/:name/fields` & `PATCH /_meta/fields/:id` (admin-only, tercatat di `ir_model_fields` + `_orm_audit_log`). Saat `create`/`update`, Zod compiler runtime memvalidasi isi `_attrs` sesuai definisi field aktif di `ir_model_fields`, dan `<AutoModelView />` merendernya langsung tanpa restart server maupun migration file.
- **Backwards compatibility internal:** `_orm_audit_log` dan system table tetap di-ensure otomatis via `syncModels()`; `applyMigrations()` dideprekasi untuk kode addon baru.

### 4.2 Mutable `ModelRegistry` & Inheritance (`extendModel`, ala Odoo `_inherit`)

```ts
// Di packages/addons/canon-lore/src/models.ts
export const timelineCanonExt = extendModel("timeline.event", {
  addon: "canon-lore",
  fields: z.object({
    canon_patch_id: z.string().nullable().default(null),
    story_episode_code: z.string().nullable().default(null),
  }),
  indexes: [{ fields: ["canon_patch_id"] }],
});
```

- **Mutable Runtime `ModelRegistry`:** `defineModel()` mendaftarkan blueprint awal ke `ModelRegistry` global alih-alih mengunci `ddl`/`fullSchema`/`BaseRepository` secara statis saat import module. `repository` selalu membaca komposisi field terbaru (base fields + `extendModel()` + `ir_model_fields` runtime) melalui registry.
- **Registry Ownership:** `AddonRegistry` membedakan **`owns` (1 pemilik primer per model)** dan **`extends` (`extendModel()` oleh addon hilir)** sehingga tidak memicu false-positive `claim()` collision. Ekstensi kode ikut di-`syncModels()` saat startup/upgrade atau saat addon di-enable.

### 4.3 Addon Contract, `mid` Deduplication & Zero-Restart Auto-Loader (`packages/addons/__base`)

Setiap addon di `packages/addons/<name>/` mengikuti struktur seragam:

```
packages/addons/<name>/
├── manifest.json     # metadata, version, depends, defaultEnabled, autoInstall, provides
├── package.json      # @moonwitness/addon-<name>
└── src/
    ├── index.ts      # exports `addon: AddonDefinition`
    ├── models.ts     # defineModel() / extendModel()
    ├── routes.ts     # custom Fastify routes + registerModelRestRoutes()
    ├── views.ts      # declarative UI views, actionBindings, menus, & RBAC rules
    └── seed.ts       # idempotent upsert seeders (+ optional legacyImport)
```

- **Zero Auth Double (`packages/mid` × `addon-auth`):**
  - Saat ini `packages/mid` (`@moonwitness/mid`) memegang engine protokol OIDC/OAuth 2.1 (`id.moonwitness.biz.id`), namun langsung meng-query raw SQL `users`, `sessions`, dan punya `mid_audit_logs` terpisah, sementara `identity_*` di `apps/api` juga duplikat.
  - Solusi resmi: **`packages/mid` dimurnikan menjadi stateless OIDC/PKCE/JWKS protocol library** dengan interface **`MidIdentityStore`** (menggunakan user ID `string` / UUIDv7). **`addon-auth` adalah SATU-SATUNYA Identity Addon** yang memiliki tabel terpadu (`auth.user`, `auth.session`, `auth.oauth_token`, `mid.signing_key`, `mid.client`, `mid.auth_code`, `mid.refresh_token`), me-mount route `/auth/*` + `/oauth/*` bila aktif, dan mengarahkan audit event langsung ke **`addon-audit`** (`ops_audit_logs`). Tabel duplikat `identity_*` dan `mid_audit_logs` terpisah dihapus.

**System Registry Tables di `__base`** (juga dibuat via `syncModels()`):

- `ir_addons` (`name`, `version`, `schema_hash`, `state`: `installed | disabled | upgrade_pending | error`, `auto_install`, `depends_json`, `last_error`)
- `ir_models` (`name`, `addon`, `table_name`, `extensible`, `soft_delete`, `schema_json`)
- `ir_model_fields` (`model_name`, `field_name`, `field_type`, `nullable`, `deprecated`, `is_custom`, `origin_addon`, `ui_widget`, `label`, `selection_json`)
- `ir_rules` (`model_name`, `role`: `admin|editor|viewer|public`, `can_read`, `can_create`, `can_update`, `can_delete`)
- `ir_views` (`model_name`, `view_type`: `list|form|detail|kanban`, `addon`, `priority`, `action_bindings_json`, `spec_json`)
- `ir_menus` (`menu_key`, `addon`, `parent_key`, `label`, `href`, `icon`, `plane`: `creator|operations`, `order`, `min_role`)

**Lifecycle Startup & Zero-Restart Toggle (`runAddonLifecycle()`):**

1. Discovery addon yang terdaftar / terdeteksi di workspace, validasi `depends` & route/`owns` model collision via `AddonRegistry` (`topological sort`, `__base` selalu pertama).
2. Sinkronisasi `ir_addons`: addon dengan `autoInstall: true` otomatis aktif pada boot pertama; addon opsional (mis. worker hardware) bisa aktif otomatis bila env endpoint diset atau di-toggle Admin via UI/API.
3. Fastify route sealing solution: **Semua addon workspace di-pre-mount ke Fastify pada boot dalam scope terenkapsulasi yang dijaga `preHandler: requireAddonEnabled(addonName)`** (mengecek cache in-memory yang tersinkron dengan `ir_addons`). Kumpulkan seluruh `models` & `extends` dari addon aktif → jalankan `syncModels()`, dan jalankan idempotent `seed()` saat install atau `manifest.version` naik (setara `odoo -u`). Toggle via API berlaku **live tanpa restart** (`disable` langsung mengembalikan `503 ADDON_DISABLED` dan menyembunyikan menu dari `/_meta/navigation`).

### 4.4 Metadata Visibility (`/_meta/*`), Daemon Action Bindings & UI Engine

- **Batas Keamanan `/_meta/*`:**
  - **Public-safe allowlist (kompatibel tes anonim):** `GET /_meta/models`, `GET /_meta/models/:name`, `GET /_meta/openapi.json`, `GET /_meta/llms.txt` hanya mengekspor kolom yang terdaftar di allowlist **`publicFields`** (kolom internal/sensitif tidak pernah masuk public metadata).
  - **Authenticated + RBAC (`requireAuth()` + Admin/Role):** `GET /_meta/addons`, `POST /_meta/addons/:name/enable|disable`, `POST /_meta/models/:name/fields`, `PATCH /_meta/fields/:id`, `GET /_meta/navigation` (difilter `ir_rules` + addon aktif), `GET /_meta/views/:model` (merged view + ACL flags user).
  - **Generic Model REST (`/api/v1/m/:model`):** Aktif hanya untuk model opt-in `restEnabled: true`, dijaga middleware ACL `ir_rules`, mendukung `$ne`/`$gt`/`$in`/`$like`/`$ilike`, sort/pagination, optimistic locking `version`, `archive`/`restore`, dan audit `history`.
- **Anti-Bypass untuk Worker & State Machine (`actionBindings` di `ir_views`):**
  - `<AutoModelView />` membaca `ir_views.action_bindings_json` (`{ listUrl, createUrl, updateUrl, deleteUrl, transitionUrl }`).
  - Model murni (mis. `canon.world_patch`, `audit.log`, `i18n.term`) memakai `/api/v1/m/:model`.
  - Model worker eksternal atau state-machine (`snmp.*`, `storage.*`, `radius.*`, `command.workflow`) memetakan mutasi UI langsung ke endpoint proxy/state-machine resminya (`/api/v1/snmp/*`, `/api/v1/storage/*`, `/api/v1/command-center/*`) agar Rust/Go daemon & `WORKFLOW_TRANSITIONS` selalu dieksekusi penuh.
- **Frontend Dynamic Engine (`packages/ui` + `apps/web`):**
  - Shell navigation (`ConsoleShellAdapter` / `OperationsShell`) membaca `/_meta/navigation` dengan fallback static manifest untuk SSR/pre-hydration agar nol layout shift.
  - **`<AutoModelView model="..." />`** di `packages/ui` merender tabel/filter/form create-edit (termasuk custom fields `ir_model_fields` di `_attrs`) & Audit History drawer memakai token Design DNA `@moonwitness/ui`.
  - Halaman konsol dengan instrumen naratif/khusus (`/dock`, `/mission-control`, `/scriptures`, `/mtime`, `/codex`) tetap mempertahankan custom UX-nya sambil dapat menyematkan `<AutoModelForm />` / `<AutoAuditDrawer />`.

### 4.5 Event Outbox & Hook Engine (`packages/orm` + `addon-audit`)

- `_orm_audit_log` berfungsi sebagai event stream:
  - `onModelWrite(pattern, handler)` mengeksekusi hook async/in-tx (mis. `addon-command-center` memperbarui live feed setiap mutasi `timeline.*`, `radius.*`, atau `control.*` tanpa tiap controller memanggil logger secara manual).

---

## 5. Complete MoonWitness Addon Catalog (16 Modules)

Worker jaringan dipisah **per service** (`storage`, `snmp`, `syslog`, `radius`) mengikuti profil container independen di `docker-compose.yml` sehingga operator dapat menonaktifkan addon yang daemon-nya tidak dijalankan.

| #   | Package (`@moonwitness/...`)                              | Tier                  | Depends                                    | Models (`defineModel` / `extendModel`)                                                                                       | Surface / UI Mode                                      |
| --- | --------------------------------------------------------- | --------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `addon-base` (`__base`)                                   | Foundation            | `—`                                        | `ir_addons`, `ir_models`, `ir_model_fields`, `ir_rules`, `ir_views`, `ir_menus`                                              | `/health`, `/_meta/*`, `/api/v1/m/*`                   |
| 2   | `addon-i18n`                                              | Core                  | `__base`                                   | `i18n.locale`, `i18n.term`                                                                                                   | Dictionary API + AutoView `/admin/i18n`                |
| 3   | `addon-auth` _(unifies stub `auth` + `@moonwitness/mid`)_ | Core                  | `__base`, `i18n`                           | `auth.user`, `auth.session`, `auth.oauth_token`, `mid.signing_key`, `mid.client`, `mid.auth_code`, `mid.refresh_token`       | `/auth/*`, `/oauth/*` (MID IDP), Crew Manager UI       |
| 4   | `addon-audit`                                             | Core                  | `__base`, `auth`                           | `audit.log` (`ops_audit_logs`, absorbs `mid_audit_logs`) + outbox listener                                                   | `/audit/logs` + AutoView Audit Explorer                |
| 5   | `addon-timeline` _(existing)_                             | Chronicle             | `__base`, `auth`, `audit`                  | `timeline.event`, `timeline.era` _(absorbs `ops_events` -> single `timeline_events`)_                                        | `/timeline/*`, `/dock` Hybrid UX + AutoForm            |
| 6   | `addon-canon-lore`                                        | Canon                 | `__base`, `timeline`                       | `canon.entity`, `canon.term`, `canon.world_patch`, `canon.episode` + `extendModel("timeline.event")`                         | `/canon/*`, Tab Canon Lore `/dock` + AutoView          |
| 7   | `addon-witness-research`                                  | Epistemic (`ADR-006`) | `__base`, `canon-lore`, `audit`            | `knowledge.source`, `witness.claim`, `research.run`, `sidra.edge`                                                            | `/witness/*`, `/research/*`, `/codex` + AutoView       |
| 8   | `addon-command-center`                                    | Operations            | `__base`, `auth`, `audit`                  | `command.workflow`, `command.alert`                                                                                          | `/command-center/*`, `/mission-control` HUD            |
| 9   | `addon-probes`                                            | Operations            | `__base`, `command-center`                 | `probe.node` _(absorbs `igate_nodes`/`orm_probe_nodes`)_, `probe.event`                                                      | `/probes/*`, `/ecosystem-health`                       |
| 10  | `addon-control`                                           | Host CP               | `__base`, `auth`, `audit`                  | `control.command`, `control.host_snapshot`                                                                                   | `/control/*` (`cp/arsy` adapter), `/setup`, `/control` |
| 11  | `addon-ai` _(isi stub)_                                   | Intelligence          | `__base`, `auth`, `audit`                  | `riot_ai.provider_config`, `riot_ai.usage_log`, `memory.record`                                                              | `/riot-ai/*`, `/memory/*`, `/intelligence`             |
| 12  | `addon-storage`                                           | Worker                | `__base`, `auth`, `audit`                  | `storage.bucket`, `storage.object`, `storage.upload_session`                                                                 | `/storage/*` SigV4 proxy + `/storage`                  |
| 13  | `addon-snmp`                                              | Worker                | `__base`, `auth`, `probes`                 | `snmp.device`, `snmp.target`, `snmp.sample`                                                                                  | `/snmp/*` proxy + `/snmp` AutoView/Console             |
| 14  | `addon-syslog`                                            | Worker                | `__base`, `auth`, `audit`                  | `syslog.entry`                                                                                                               | `/syslog/*` proxy + `/syslog` AutoView/Console         |
| 15  | `addon-radius`                                            | Worker                | `__base`, `auth`, `audit`                  | `radius.client`, `radius.session`                                                                                            | `/radius/*` proxy + `/radius` AutoView/Console         |
| 16  | `addon-epistemic`                                         | Engines               | `__base`, `canon-lore`, `witness-research` | `epistemic.eval_run` _(TS/JSON runtime engines: `divine-text`, `mtime` TS port, `crayon` RGBL/SRGBL, `prophetic` contracts)_ | `/scriptures`, `/mtime`, `/codex` evaluation APIs      |

---

## 6. Legacy Consolidation & Identity Cutover

1. **Auth Full UUIDv7 Cutover (`addon-auth` + `@moonwitness/mid` + `apps/web`):**
   - `packages/mid` (`db.ts`, `MidFastifyPluginOptions`), `verifyMidBearerToken`, `/auth/users/:id/*`, `/control/setup/*`, dan `apps/web/src/lib/session.ts` diubah untuk menerima `userId: string` (UUIDv7 primer, kompatibel sementara bila token transisi memuat angka).
   - Pada boot pertama `addon-auth`, `legacyImport()` otomatis menyalin baris existing dari tabel raw `users` → `auth_users` (menyimpan `legacy_int_id`), memetakan `sessions`/`bff_oauth_tokens`/`mid_auth_codes`/`mid_refresh_tokens` ke ID baru, dan menandai tabel legacy retired (tanpa dual-write berkelanjutan).
   - Tabel bayangan `identity_user_profiles`, `identity_sessions`, `identity_oauth_tokens`, `identity_auth_events`, dan `mid_audit_logs` dipensiunkan (dilebur menjadi satu `auth.*` + `audit.log`).
2. **Non-Auth Dual-Persistence Consolidation:**
   - Setiap addon membaca/menulis satu tabel ORM kanonik: `timeline_events` (`addon-timeline`, menyerap `ops_events`), `command_center_workflows_orm` & `command_center_alerts_orm` (`addon-command-center`, auto-import `command_center_workflows`/`alerts` 1x saat kosong), `orm_probe_nodes` & `orm_probe_events` (`addon-probes`, auto-import `igate_nodes`/`probe_events` 1x saat kosong).
3. **`addon-epistemic` & `engines/*` Runtime Scope:**
   - Wave 4 membungkus mesin TS & korpus JSON yang terverifikasi berjalan murni di Node/TS (`engines/divine-text`, `engines/mtime` TS solar-lunar M6 engine + fixtures, `engines/crayon`/`@moonwitness/canon` RGBL/SRGBL, `engines/prophetic` TypeScript contracts) dengan memuatnya sebagai library/data workspace tanpa mensyaratkan toolchain Rust (`cargo`) di container API; jembatan CLI Rust (`engines/ontology`, `engines/mtime` CLI) bersifat opt-in terpisah.
4. **Bootstrap Single-Path (`apps/api`):**
   - Seluruh pendaftaran domain di [`fastify.adapter.ts`](../../../apps/api/src/infrastructure/adapters/fastify.adapter.ts) dipindahkan ke addon masing-masing dan dimuat tunggal oleh [`bootstrap.ts`](../../../apps/api/src/bootstrap.ts) melalui `runAddonLifecycle()`.

---

## 7. Implementation Phasing & Verification Strategy

- **Wave 1 — Core Engine:** `@moonwitness/orm` (`syncModels()`, `extendModel()`, `extensible: true` `_attrs`, `onModelWrite()` outbox) + `@moonwitness/addon-base` (`ir_*` system models, runtime enable/disable guard, `/_meta/views`, `/_meta/navigation`, `/api/v1/m/:model` generic CRUD router).
- **Wave 2 — Proof Pair + Dynamic UI:** Konversi `addon-timeline` ke `syncModels()` + build `addon-auth` (dengan auto-import legacy `users`) & `addon-audit` + komponen `<AutoModelView />` di `packages/ui` & dynamic nav di `apps/web`.
- **Wave 3 — Control, Ops & AI:** Ekstrak `addon-control`, `addon-command-center`, `addon-probes`, `addon-ai`, `addon-i18n`.
- **Wave 4 — Workers & Canon/Epistemic Engines:** Ekstrak `addon-storage`, `addon-snmp`, `addon-syslog`, `addon-radius`, `addon-canon-lore`, `addon-witness-research`, `addon-epistemic`.

**Acceptance Criteria Target:**

- Menghapus/menambah field pada Zod `defineModel()` / `extendModel()` langsung tersinkron saat restart/reload DB test (SQLite & Postgres DDL) tanpa membuat file migrasi baru.
- Addon toggle (`disable` → `404/503` terprediksi + hilang dari `/_meta/navigation` -> `enable` → aktif kembali tanpa data hilang).
- Seluruh suite test existing di `orm`, `addon-*`, `contracts`, `api`, `web` tetap 100% hijau pada setiap wave.

---

## 8. Builder Boundaries (Left to Planning / Implementation)

- Exact file split & package bundling inside each `packages/addons/*` package (`tsup` vs workspace `.ts` entrypoints per existing `packages/addons/__base` and `packages/addons/timeline`).
- Exact Zod AST-to-JSONSchema / UI Widget mapper rules for `<AutoModelView />` (`select`, `date`, `tags`, `textarea`, `relation`).
- Caching strategy for `ir_addons` enabled checks & `ir_rules` per request inside Fastify `onRequest`/`preHandler`.
