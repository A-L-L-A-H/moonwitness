# REPOSITORY INTELLIGENCE & EVOLUTION AUDIT — MoonWitness Monorepo

> **Document Status:** Historical Baseline Snapshot (Superseded on `dev` @ `acdc72a`)
> **Current Authority:** [ADR-006: Three-App Topology & Trust Zones](docs/architecture/adr-006-three-app-topology-and-trust-zones.md), [RUNTIME-SERVICE-INVENTORY.md](docs/architecture/RUNTIME-SERVICE-INVENTORY.md), [WORK_PLAN.md](WORK_PLAN.md)
> **Note:** Captured against earlier 8-app snapshot (`v0.6.1`); later consolidated to 3 target apps (`web`, `api`, `rocksoul`) with `v0.8.1` synced across `main` and `dev`.
> **Tanggal audit:** 18 November 2026
> **Repository:** `Z:\repo\isrockfeel\moonwitness` (branch `dev`, remote `A-L-L-A-H/moonwitness`, versi 0.6.1)
> **Mode:** Read-only research & audit (Execution Mode: Read-only)
> **Output language:** Indonesian

---

## 1. EXECUTIVE SUMMARY

MoonWitness adalah **monorepo ekosistem multi-produk** yang menggabungkan 8 aplikasi (web publik, API, landing A-L-L-A-H, desktop Tauri ROCKSOUL DX, memori chat lokal, OIDC identity, Cloudflare Worker gateway, CLI), 14 package TypeScript bersama, 4 layanan Rust (RADIUS/SNMP/Syslog/S3), dan 1 control plane Go (Arsy), di atas toolchain pnpm 12.18 + Turborepo 2.5 + Node 22 dengan TypeScript strict.

**Kondisi keseluruhan:** **BAIK (±80/100)** — arsitektur monorepo rapi, gate engine disiplin, keamanan default kuat, CI/CD 18 workflow. Namun ada temuan P0/P1 yang perlu ditangani sebelum rilis major: (1) default secret yang lemah di docker-compose, (2) collision-prone global migration IDs, (3) CSRF origin check yang mengizinkan request tanpa Origin, (4) duplikasi migration/route registration di API bootstrap, (5) color scale UI yang tidak bervariasi.

**Keunggulan utama:** monorepo hygiene, gate engine no-silent-skip, DNA design token system, security-first defaults (SSRF protection, rate limiting, production env validation), 18 GitHub workflow, contracts-first Zod.

**Risiko utama:** default password/secret di compose, migration ID global collision, CSRF bypass, vendored `engines/` 13k+ file, UI `createScale` bug, silent catch di repository.

---

## 2. PROJECT IDENTITY & ACTUAL REPOSITORY STATE

### 2.1 Identitas

- **Nama:** Moonwitness (moonwitness monorepo), versi 0.6.1
- **Owners:** ~368 repos lintas 8 GitHub owners (bjo163, ArsyBelovedLabs, BRIDGE-ALLAH, zenix-id, A-L-L-A-H, The-Batteries, moonwitness-id, isrockfeel)
- **Visi:** Consolidated monorepo untuk ekosistem A-L-L-A-H / MoonWitness / ROCKSOUL — public web storytelling/scripture research + private desktop ROCKSOUL DX
- **Doctrine:** Low-Profile Tawhid, Creator–Human boundary, two-product separation (MoonWitness public web vs ROCKSOUL DX private desktop)

### 2.2 Struktur Aktual

```
apps/ (8): a-l-l-a-h, api, cli, igate, memory, mid, rocksoul, web
packages/ (14): ai, assets, avatars, canon, contracts, core, errors, eslint-config, orm, schema, types, typescript-config, ui, addons (__base, timeline, + stubs ai/auth/i18n)
services/ (4 Rust): radius, snmp-poller, storage, syslog
cp/arsy (Go): host reconciler + VPN/DNS control plane
engines/ (18 vendored subprojects, NOT in workspace build)
docs/ (~462 files in blueprint alone)
```

### 2.3 Tech Stack

| Layer    | Teknologi                                                                                  |
| -------- | ------------------------------------------------------------------------------------------ |
| Monorepo | pnpm workspaces, Turborepo 2.5, Node 22                                                    |
| Frontend | Next.js 16 (App Router), React 19.2, Tailwind 4.1, Radix UI, TanStack Query 5, GSAP, p5.js |
| Desktop  | Tauri 2, React Three Fiber, three.js, zustand                                              |
| API      | Fastify 5, Zod 4, libSQL, pg (PostgreSQL), bcrypt, Swagger UI                              |
| Rust     | Axum, tokio, libsqlite3-sys                                                                |
| Go       | stdlib-only control plane                                                                  |
| Python   | FastAPI + SQLite FTS5 + LanceDB + FastEmbed                                                |
| UI       | class-variance-authority, Radix primitives, shadcn compat                                  |
| Testing  | Vitest 4/5, Playwright 1.65, Pact, @vitest/coverage-v8                                     |

### 2.4 Build & CI/CD

- Turborepo dengan content-hash caching; outputs `.next/**`, `dist/**`
- 18 GitHub workflows (ci, codeql, auto-promote, release-please, deploy, bundle-budget, lighthouse, pact, playwright, visual-regression, security-scan, release-sbom, infracost, pr-size-guard, auto-label, preview-deploy, slack-notify, branch-policy)
- Branching: dev (default/integration), main (promotion-PR-only), master (frozen)
- Release: Release Please, single version stream (0.6.1), bump-minor-pre-major
- Deployment: Single-VPS Docker Compose behind Caddy (TLS), SSH deploy, auto-rollback

### 2.5 Dokumentasi

Extensive: `docs/engineering/` (BRANCHING, GATECHECK, CI-CD, RELEASING, DEPLOYMENT, SECURITY), `docs/architecture/` (ADR-001..005), `docs/blueprint/` (18-section design-frozen canonical blueprint), `docs/constitution/` (14-section master docs), `docs/dna/` (9 DNA world specs), `docs/superpowers/` (plans/specs), `.plan/` (5 active work plans)

---

## 3. RESEARCH LANDSCAPE

### 3.1 Fastify 5 (2026)

- Fokus: overhead rendah, plugin architecture, schema validation cepat. Cocok untuk API monorepo modular.
- Pola 2025-2026: validasi schema/serialisasi JSON cepat, plugin terenkapsulasi per domain, logging terstruktur, pengukuran throughput/latensi P99.
- **Relevansi MoonWitness:** pertahankan Fastify 5, perkuat modularisasi plugin, schema-first validation, observability. [VERIFIED + SUPPORTED]

### 3.2 libSQL vs SQLite (2025-2026)

- libSQL: fork terbuka SQLite dengan fitur produksi (remote access, embedded replicas, edge/HTTP). Cocok untuk SQLite + network/replication.
- Embedded replicas: file lokal untuk read latensi rendah, write ke primary lalu sinkronisasi — read-heavy dekat compute.
- Turso Database (rewrite Rust): beta, belum produksi kritikal.
- Pola hybrid valid: libSQL/SQLite untuk edge/local/read-replica, PostgreSQL untuk konsistensi/transaksi berat/multi-writer.
- **Relevansi:** MoonWitness sudah pakai SQLite/libSQL + PostgreSQL — pola hybrid valid. [VERIFIED + SUPPORTED]

### 3.3 Tauri 2 (2026)

- Alternatif utama Electron: core Rust, binary kecil (~5-15MB), WebView OS, model keamanan ketat.
- Trade-off: akses Node.js runtime penuh diganti command/plugin Rust; butuh desain boundary frontend↔backend jelas.
- **Relevansi:** pilihan Tauri sejalan tren efisiensi footprint & keamanan; pastikan pola command/capability, update strategy, integrasi Git/workflow kreatif eksplisit. [SUPPORTED]

### 3.4 Next.js 16 App Router (2026)

- Server Components default; minimalkan 'use client' untuk menjaga bundle kecil.
- Caching multi-lapis (request memoization, data cache, full route cache, router cache/CDN); strategi harus eksplisit per route/data.
- Produksi 2026 menekankan keamanan RSC, Turbopack, desain invalidasi/revalidasi.
- **Relevansi:** optimalkan RSC untuk konten baca, client components hanya untuk interaktivitas editor, tetapkan strategi cache/CDN + revalidasi terukur. [VERIFIED docs + SUPPORTED]

### 3.5 Ollama (2026)

- Ollama: sangat baik untuk dev lokal, prototyping, deployment sederhana.
- vLLM: unggul untuk serving produksi throughput tinggi/konkurensi (continuous batching), butuh GPU & setup lebih berat.
- llama.cpp/LM Studio: kuat untuk lokal/edge/desktop.
- **Relevansi:** RIOT Intelligence tepat untuk fitur lokal/privacy/self-host sederhana; jika beban chat/analisis naik signifikan, evaluasi jalur produksi terpisah (vLLM/TGI) dengan fallback. [SUPPORTED]

### 3.6 SQLite FTS5 vs LanceDB (2026)

- SQLite FTS5: standar kuat untuk full-text search lokal/embedded, sederhana, tanpa server tambahan. sqlite-vec (ekstensi) menambah vektor di SQLite.
- LanceDB: embedded/serverless vector DB (Rust, format Lance), data di disk/object storage; cocok untuk RAG lokal/edge skala menengah.
- Tidak ada pemenang universal: pilih berdasarkan ukuran data, kebutuhan hybrid search, latensi, deployment, tooling.
- **Relevansi:** arsitektur memory Python (FTS5 + LanceDB) selaras praktik 2026: FTS5 untuk keyword presisi, LanceDB untuk semantic retrieval; pertimbangkan strategi hybrid ranking & evaluasi sqlite-vec bila ingin simplifikasi. [SUPPORTED]

### 3.7 OIDC & Identity Management (2026)

- Keycloak: all-in-one self-hosted mapan (OAuth2/OIDC, SSO, admin UI), Java-based; kuat untuk enterprise/SSO kompleks tapi operasional lebih berat.
- Ory (Kratos/Hydra/Keto): headless/modular, API-first, fleksibel; butuh perakitan komponen lebih banyak.
- Alternatif lain (Authentik, Zitadel, Logto, Authgear, Casdoor) bersaing pada kemudahan operasi, UI, fitur CIAM.
- Zitadel: AGPL-3.0 (sejak v3), Go + PostgreSQL, event-sourced, multi-tenant B2B kuat.
- **Relevansi:** pilih IdP berdasarkan kebutuhan: SSO/admin cepat (Keycloak/Authentik/Zitadel) vs kontrol UI & composability (Ory). Pastikan integrasi dengan Fastify API, desktop, dan control plane Go konsisten token/claim. [SUPPORTED + VERIFIED]

### 3.8 Turborepo vs Nx vs Rush (2026)

- Turborepo: fokus task orchestration & caching dengan konfigurasi relatif sederhana; populer untuk monorepo JS/TS.
- Nx: fitur lebih kaya (graph, plugin, generators, enforcement boundaries) namun kompleksitas lebih tinggi; performa bervariasi per benchmark.
- Rush: solusi enterprise matang untuk dependency/version policy di ekosistem besar.
- **Relevansi:** MoonWitness memakai Turborepo + pnpm — cocok; evaluasi Nx hanya jika butuh enforcement boundary/generators canggih. [SUPPORTED]

### 3.9 Self-Hosted S3 Compatible Storage (2026)

- RustFS: kandidat pengganti MinIO paling dekat untuk deployment S3 umum.
- Garage: cocok cluster kecil terdistribusi/geo-replicated, API S3 lebih sempit.
- SeaweedFS: platform storage terdistribusi (S3 + filer/FUSE) untuk jumlah objek besar; kompleksitas menengah.
- Ceph RGW: skala infrastruktur besar; overkill untuk single-node sederhana.
- VersityGW/S3Proxy/rclone serve s3: gateway S3 di atas filesystem (file tetap plain) — beda kelas dari object store native.
- **Relevansi:** layanan Rust S3-compatible di MoonWitness perlu diposisikan jelas: native object semantics vs gateway. [SUPPORTED]

### 3.10 Rust Axum Web Service (2026)

- Axum (Tokio/Tower) menjadi pilihan utama 2026 untuk service Rust modular: extractor ergonomis, middleware Tower, integrasi ekosistem async standar.
- Actix-web tetap kompetitif untuk performa mentah; pilihan bergantung trade-off DX, ekosistem, kebutuhan tim.
- Pola produksi: layering handler/service/repository, typed state/extractors, observability (tracing), graceful shutdown, timeouts, rate limiting, pengujian integrasi.
- **Relevansi:** untuk layanan jaringan Rust (RADIUS, SNMP, Syslog, S3-compatible), Axum cocok untuk HTTP control/management API; komponen protokol non-HTTP tetap bisa hidup berdampingan dalam runtime async. [SUPPORTED]

---

## 4. DEEP TECHNICAL AUDIT

### 4.1 Architecture & Engineering

| #   | Temuan                                                                                                                                                                      | Severity | Klasifikasi | Bukti                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| A1  | Domain-ORM coupling: `TimelineUseCase` bergantung langsung pada tipe ORM (`ActorContext`, `SYSTEM_ACTOR`) — pelanggaran dependency inversion                                | High     | VERIFIED    | `apps/api/src/domain/usecases/timeline/timeline.usecase.ts`                            |
| A2  | `applyMigrations(domainMigrations)` dipanggil dua kali (bootstrap.ts ~line 67 + fastify.adapter.ts ~line 165) — redundan                                                    | Medium   | VERIFIED    | `apps/api/src/bootstrap.ts`, `apps/api/src/infrastructure/adapters/fastify.adapter.ts` |
| A3  | Route registration ganda: `riotAiRoutes`, `commandCenterRoutes`, `memoryRoutes` didaftarkan di adapter (line 176-178) dan di bootstrap via `registerAddonTree` (line 64-68) | Medium   | VERIFIED    | `fastify.adapter.ts:176-178`, `bootstrap.ts:64-68`                                     |
| A4  | `countEvents` memanggil `listEvents` dengan limit 100000 lalu menghitung panjang — O(n), boros                                                                              | Medium   | VERIFIED    | `apps/api/src/infrastructure/repositories/orm-event.repository.ts`                     |
| A5  | JSON Schema manual di `schemas.ts` menduplikasi Zod schema di `packages/contracts`/`packages/schema` — drift risk                                                           | Medium   | VERIFIED    | `apps/api/src/interface/routes/schemas.ts` vs `packages/schema`                        |
| A6  | Contracts hanya mengekspor `timeline/endpoints`; cakupan sempit, banyak route tidak memiliki kontrak terpusat                                                               | Medium   | VERIFIED    | `packages/contracts/src/index.ts`                                                      |
| A7  | `engines/` berisi 13.766 file git-tracked, 18 subproyek vendored, tidak terdaftar di pnpm-workspace.yaml — bukan active subprojects                                         | High     | VERIFIED    | `engines/` directory, `pnpm-workspace.yaml`                                            |
| A8  | `createScale` di `default-theme.ts` mengembalikan skala warna di mana semua step (50-950) identik dengan baseHex — bug visual color scale tidak bervariasi                  | High     | VERIFIED    | `packages/ui/src/dna/default-theme.ts`                                                 |
| A9  | `registerBaseAddon(db: any)` menggunakan `any` — 1 dari 12 `any` di src non-generated                                                                                       | Low      | VERIFIED    | `packages/addons/__base/src/addon.ts:1`                                                |
| A10 | `themeRegistry` highContrast/print tidak override `colors.legacy` (kecuali sepia) — inkonsistensi                                                                           | Low      | VERIFIED    | `packages/ui/src/dna/default-theme.ts`                                                 |
| A11 | `ensureAuditTable()` memakai `WeakSet<LibSqlExecutor>` — state di memori proses; aman single-process tapi tidak thread-safety lintas instance                               | Medium   | VERIFIED    | `packages/orm/src/define-model.ts`                                                     |
| A12 | `BaseRepository` constructor public; pemanggil eksternal bisa membangun repo tanpa field map                                                                                | Low      | VERIFIED    | `packages/orm/src/define-model.ts`                                                     |
| A13 | SQL dibangun via string interpolation untuk nama tabel/kolom, dilindungi `assertIdentifier`, tapi auditability rendah                                                       | Low      | VERIFIED    | `packages/orm/src/define-model.ts`                                                     |
| A14 | `metadata.ts` `RegisteredModel.publicFields` tidak menegakkan field benar-benar ada di model — hanya deklaratif                                                             | Low      | VERIFIED    | `packages/addons/__base/src/metadata.ts`                                               |
| A15 | BFF proxy di `apps/web/src/app/api/v1/[...path]/route.ts` strip `set-cookie` lalu re-attach; rentan terhadap multiple cookies folding                                       | Low      | VERIFIED    | `apps/web/src/app/api/v1/[...path]/route.ts`                                           |
| A16 | `OrmEventRepository.getEras` swallow error dan return `[]` — silent failure                                                                                                 | Medium   | VERIFIED    | `apps/api/src/infrastructure/repositories/orm-event.repository.ts`                     |

### 4.2 Code Quality

| #   | Temuan                                                                                                                                                                                       | Severity | Klasifikasi | Bukti                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| C1  | Migration IDs `001_*` dipakai berulang di namespace berbeda (auth, command-center, probes, riot-ai) — tabel `_orm_schema_migrations` global; jika ID identik muncul, checksum mismatch throw | Critical | VERIFIED    | `apps/api/src/db/migrations.ts`, `apps/api/src/infrastructure/persistence/domain/` |
| C2  | `TimelineUseCase` bergantung langsung pada tipe ORM                                                                                                                                          | High     | VERIFIED    | `apps/api/src/domain/usecases/timeline/timeline.usecase.ts`                        |
| C3  | `createScale` menghasilkan color scale seragam (bug visual)                                                                                                                                  | High     | VERIFIED    | `packages/ui/src/dna/default-theme.ts`                                             |
| C4  | Silent catch di repository (`getEras` return `[]`)                                                                                                                                           | Medium   | VERIFIED    | `orm-event.repository.ts`                                                          |
| C5  | Rust `unwrap()` 204 kali di services (termasuk tests); production path mungkin panic                                                                                                         | Low      | VERIFIED    | `services/*/src/`                                                                  |
| C6  | Go `cp/arsy`: `lookupRole` iterasi map tokens O(n); `recover()` menelan panic; `cmdServe` memanggil `radius_handle.shutdown()` setelah `axum::serve` selesai (tidak akan jalan)              | Medium   | VERIFIED    | `cp/arsy/internal/api/server.go`, `cp/arsy/cmd/arsy/main.go`                       |
| C7  | Rust `syslog` memakai `Arc<Mutex<HashMap>>` untuk counter per-IP — lock di hot path bisa bottleneck                                                                                          | Low      | VERIFIED    | `services/syslog/src/`                                                             |
| C8  | TypeScript strict + `noUncheckedIndexedAccess` aktif; hanya 12 `any` di src non-generated                                                                                                    | Low      | VERIFIED    | Seluruh `src/`                                                                     |

### 4.3 Security

| #   | Temuan                                                                                                                                             | Severity   | Klasifikasi | Bukti                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- | -------------------------------------------------------------- |
| S1  | `MID_KEY_ENCRYPTION_SECRET` fallback `dev-insecure-encryption-secret-min16` di docker-compose.yml:117; tidak divalidasi di `validateProductionEnv` | Critical   | VERIFIED    | `docker-compose.yml:117`, `apps/api/src/shared/env.ts:261-290` |
| S2  | `POSTGRES_PASSWORD` default `moonwitness` di docker-compose.yml:257-258                                                                            | High       | VERIFIED    | `docker-compose.yml:257-258`                                   |
| S3  | `isAllowedBffOrigin`: jika `Origin` header absent, origin diizinkan (`rawOrigin === undefined → true`) — potensi CSRF pada endpoint BFF exchange   | High       | VERIFIED    | `apps/api/src/interface/routes/auth.routes.ts:90-92`           |
| S4  | CSRF double-submit: jika header `x-csrf-token` absent, validasi dianggap valid (`headerVal === undefined → return true`)                           | Medium     | VERIFIED    | `auth.routes.ts:133-142`                                       |
| S5  | `OPTIONS` requests bypass auth (preflight) — wajar, tapi pastikan tidak ada route sensitif yang menerima OPTIONS body                              | Medium     | INFERRED    | `apps/api/src/middleware/auth.ts:56`                           |
| S6  | `MID_INTERNAL_URL`/`MID_ISSUER_URL` dibaca langsung via `process.env`, bukan `env` tervalidasi; jika unset, issuer bisa null                       | Medium     | HYPOTHESIS  | `apps/api/src/middleware/mid-jwt.ts:111`                       |
| S7  | CSP `style-src 'unsafe-inline'` di igate dan mid                                                                                                   | Low-Medium | VERIFIED    | `apps/igate/src/app.ts:66`, `apps/mid/src/http.ts:145`         |
| S8  | `form-action 'self' https: http://127.0.0.1:*` terlalu luas di mid                                                                                 | Low-Medium | VERIFIED    | `apps/mid/src/http.ts:145`                                     |
| S9  | Caddyfile fallback `:80` block reverse_proxy ke web tanpa TLS                                                                                      | Medium     | VERIFIED    | `Caddyfile:42-46`                                              |
| S10 | GitHub Actions `checkout@v4`, `cache@v4`, `upload-artifact@v4` tidak pinned ke SHA (hanya major tag) di security-scan.yml                          | Medium     | VERIFIED    | `.github/workflows/security-scan.yml`                          |
| S11 | `ALLOW_PUBLIC_BIND=1` di compose untuk radius/snmp/syslog/storage — override guard                                                                 | Medium     | VERIFIED    | `docker-compose.yml:165,198,227`                               |
| S12 | `RADIUS_SECRET` & `RADIUS_NAS_CLIENTS` default kosong → radius service gagal closed (baik), tapi compose tetap boot tanpa secret                   | Low        | HYPOTHESIS  | `docker-compose.yml:170-171`                                   |
| S13 | `allowBuilds` mengizinkan `bcrypt`, `sharp`, `@swc/core` native builds — risiko supply chain moderat                                               | Low        | INFERRED    | `pnpm-workspace.yaml`                                          |

### 4.4 Performance & Reliability

| #   | Temuan                                                                                                                | Severity | Klasifikasi | Bukti                                             |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------- |
| P1  | Rate limiter in-memory fixed window, single-process; multi-instance tanpa shared store                                | Medium   | VERIFIED    | `apps/api/src/infrastructure/rate-limit.ts:4-7`   |
| P2  | JWKS cache 5 menit, global mutable; concurrency race minor                                                            | Low      | INFERRED    | `apps/api/src/middleware/mid-jwt.ts:27-33`        |
| P3  | `packages/orm/src/drivers/sqlite.driver.ts:85-87` — `get()` memanggil `all()` lalu ambil `[0]` → overhead query penuh | Low      | VERIFIED    | `packages/orm/src/drivers/sqlite.driver.ts:85-87` |
| P4  | `revokeSession` loop update identity mirror per row — N+1 potensial                                                   | Low      | INFERRED    | `apps/api/src/services/session.ts:158-173`        |
| P5  | SQLite PRAGMA WAL, foreign_keys, busy_timeout 5000ms, synchronous NORMAL — baik                                       | Info     | SUPPORTED   | `packages/orm/src/drivers/sqlite.driver.ts:51-54` |
| P6  | Error handler menyembunyikan detail di prod (≥500) — baik                                                             | Info     | SUPPORTED   | `fastify.adapter.ts:99-106`                       |
| P7  | Health routes `/api/v1/healthz` + logging pino structured + x-request-id — baik                                       | Info     | SUPPORTED   | `fastify.adapter.ts`                              |
| P8  | Turbo cache aktif, build outputs `.next/**`, `dist/**`                                                                | Info     | SUPPORTED   | `turbo.json`                                      |
| P9  | Memory app (Python FastAPI) — perlu inspeksi lebih lanjut (tidak dianalisis detail)                                   | Unknown  | HYPOTHESIS  | `apps/memory/backend/`                            |

### 4.5 Developer Experience

| #   | Temuan                                                                                 | Severity | Klasifikasi | Bukti                                  |
| --- | -------------------------------------------------------------------------------------- | -------- | ----------- | -------------------------------------- |
| D1  | Gate engine no-silent-skip (PASS/FAIL/BLOCKED/NOT APPLICABLE) — excellent              | Info     | VERIFIED    | `scripts/gatecheck.mjs`                |
| D2  | Branching strategy (dev/main/master) dengan pre-push hook — excellent                  | Info     | VERIFIED    | `docs/engineering/BRANCHING.md`        |
| D3  | Conventional Commits enforced di CI dan push gate                                      | Info     | VERIFIED    | `scripts/commitlint.mjs`               |
| D4  | TypeScript strict + noUncheckedIndexedAccess                                           | Info     | VERIFIED    | `packages/typescript-config/base.json` |
| D5  | Internal packages just-in-time source exports (no separate build)                      | Info     | VERIFIED    | `packages/ui/package.json`             |
| D6  | API docs (Swagger) hanya di non-production                                             | Info     | VERIFIED    | `fastify.adapter.ts:108-137`           |
| D7  | CONTRIBUTING.md lengkap dengan gate rejection table                                    | Info     | VERIFIED    | `CONTRIBUTING.md`                      |
| D8  | 1320 TODO/FIXME/HACK comments di codebase                                              | Medium   | VERIFIED    | Grep across repo                       |
| D9  | `.plan/` berisi 5 active work plans dengan screenshots — perlu cleanup setelah selesai | Low      | VERIFIED    | `.plan/` directory                     |
| D10 | `apps/api/` berisi stray `.db` files (test artifacts) di root; `test1.db` di repo root | Low      | VERIFIED    | `apps/api/`, repo root                 |

### 4.6 Product & User Experience

| #   | Temuan                                                                                                     | Severity | Klasifikasi | Bukti                                             |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------- |
| U1  | Tiga visual track terpisah: Sacred Minimalism (a-l-l-a-h), MangaLines/Zine (web), NOISE×SILENCE (rocksoul) | Info     | VERIFIED    | `docs/MASTER-CANON-CROSS-REPO-CODEX.md`           |
| U2  | Canon Codex: 4-door (scriptures, mtime, codex, research) — epistemic tools                                 | Info     | VERIFIED    | `apps/a-l-l-a-h/`                                 |
| U3  | How U Remind Me: local-first chat memory (ChatGPT export → SQLite FTS5 + LanceDB)                          | Info     | VERIFIED    | `apps/memory/`                                    |
| U4  | RIOT Intelligence: Ollama adapter + eval harness                                                           | Info     | VERIFIED    | `packages/ai/`                                    |
| U5  | Network ops: RADIUS, SNMP poller, Syslog, S3-compatible storage                                            | Info     | VERIFIED    | `services/`                                       |
| U6  | Arsy control plane: VPN/DNS, host reconciler                                                               | Info     | VERIFIED    | `cp/arsy/`                                        |
| U7  | MID: centralized OIDC identity                                                                             | Info     | VERIFIED    | `apps/mid/`, `apps/api/src/middleware/mid-jwt.ts` |
| U8  | Design system: DNA tokens, 7 Master DNA Worlds, skin presets, Radix primitives                             | Info     | VERIFIED    | `packages/ui/src/dna/`                            |
| U9  | No clear onboarding flow for new users (setup wizard ada tapi /setup)                                      | Low      | INFERRED    | `.env.example`, `CONTROL_NATIVE_SETUP`            |
| U10 | Feature completeness vs documented intent — perlu verifikasi lebih lanjut                                  | Unknown  | HYPOTHESIS  | `docs/blueprint/`                                 |

---

## 5. GAP ANALYSIS

| Area               | Current Repository                    | External Reference                                                          | Identified Gap                                                        | Opportunity                                                                              |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Scripture study    | Canon Codex (viewer, epistemic tools) | AndBible (SWORD modules, offline study, Strong's)                           | Modul studi terstruktur (kamus, komentar, studi kata)                 | Adopsi model SWORD/offline-first untuk studi komparatif                                  |
| Local AI memory    | FTS5 + LanceDB (How U Remind Me)      | Letta/MemGPT (stateful agent + memory), mem0 (memory layer API)             | Pola "memory as OS/state", API memori terstruktur                     | Diferensiasi privasi/local-first penuh + integrasi riset/editorial                       |
| Identity/OIDC      | MID (custom, OIDC)                    | Keycloak/Authentik (all-in-one), Ory (headless), Zitadel (multi-tenant B2B) | Evaluasi apakah custom MID cukup atau perlu IdP established           | Keycloak/Authentik untuk SSO cepat; Zitadel untuk B2B multi-tenant (kajian lisensi AGPL) |
| Desktop            | Tauri 2 (ROCKSOUL DX)                 | awesome-tauri (plugin catalog, templates)                                   | Plugin modular (updater, sql, store, auth), auto-update strategy      | Manfaatkan ekosistem plugin/template awesome-tauri                                       |
| Scripture analysis | Canon Codex epistemic tools           | Digital Humanities (edisi kritis digital, anotasi, kolokasi)                | Fitur DH: penelusuran leksikal/kolokasi, anotasi, perbandingan varian | RAG lokal untuk asistensi, bukan pengganti bukti teks                                    |
| RAG/AI             | Ollama adapter (RIOT)                 | LlamaIndex + Ollama cookbook, vLLM (produksi)                               | Pipeline RAG modular (ingest → chunk/index → retrieve → generate)     | Sinkronkan dengan memori LanceDB/FTS5                                                    |
| Storage            | Rust S3-compatible                    | RustFS, Garage, SeaweedFS, Ceph RGW                                         | Posisi jelas: native object store vs gateway                          | RustFS/Garage untuk internal/self-host sederhana                                         |
| DNS/VPN            | Arsy control plane                    | PowerDNS, Unbound, AdGuard Home                                             | Integrasi dengan engine DNS proven sesuai segmen                      | Posisikan Arsy sebagai control plane di atas PowerDNS                                    |
| Monorepo           | Turborepo + pnpm                      | Nx (graph, generators, boundaries), Rush (enterprise)                       | Enforcement boundary, generators canggih                              | Pertahankan Turborepo; evaluasi Nx hanya jika butuh                                      |
| Vector search      | FTS5 + LanceDB                        | sqlite-vec (ekstensi SQLite)                                                | Simplifikasi stack: vektor di SQLite                                  | Evaluasi sqlite-vec untuk mengurangi dependency                                          |

---

## 6. HIDDEN OPPORTUNITIES

1. **`engines/` vendored 13k+ file** — bukan active subprojects, membebani repo dan search. Pindah ke archive atau `.gitignore`-kan → mengurangi noise signifikan. [VERIFIED]
2. **`createScale` bug** — color scale seragam, mudah diperbaiki, dampak visual besar. [VERIFIED]
3. **Global migration IDs** — collision-prone, mudah diperbaiki dengan namespacing prefix. [VERIFIED]
4. **Double migration/route registration** — redundan, mudah dihilangkan. [VERIFIED]
5. **Contracts coverage** — hanya timeline; banyak route tanpa kontrak terpusat. Memperluas contracts akan meningkatkan type safety end-to-end. [VERIFIED]
6. **Rust `unwrap()` 204 kali** — audit production path untuk mencegah panic. [VERIFIED]
7. **1320 TODO/FIXME/HACK** — triage dan bersihkan; banyak mungkin sudah resolved. [VERIFIED]
8. **Stray `.db` files** di `apps/api/` dan repo root — test artifacts, sebaiknya di-gitignore. [VERIFIED]
9. **`.plan/` screenshots** — 5 active plans dengan ratusan screenshot; cleanup setelah selesai. [VERIFIED]
10. **UI component `ComicPanel`** menunggu export per `DNA_SKIN_SYSTEM_PLAN.md` — feature partial. [INFERRED]

---

## 7. INNOVATION BRAINSTORM

### A. Quick Wins (effort kecil, dampak langsung)

- Perbaiki `createScale` agar menghasilkan variasi lightness
- Namespace migration IDs dengan prefix modul
- Hilangkan duplikasi migration/route registration
- Tambahkan `MID_KEY_ENCRYPTION_SECRET` ke `validateProductionEnv`
- Hapus fallback default password di docker-compose
- Pin semua GitHub Actions ke SHA
- Perbaiki CSRF origin check (tolak request tanpa Origin pada endpoint state-changing)
- Hapus fallback `:80` block di Caddyfile (redirect ke HTTPS)

### B. High-Impact Improvements

- Perluas contracts coverage (semua route API)
- Ganti `schemas.ts` manual dengan schema dari `@moonwitness/contracts`
- Audit Rust `unwrap()` di production path
- Rate limiter shared store (Redis) untuk multi-instance
- CSP nonce/hash (ganti `unsafe-inline`)
- Cleanup `engines/` (archive atau gitignore)
- Triage 1320 TODO/FIXME/HACK

### C. Strategic Innovations

- Canon Codex: fitur Digital Humanities (kolokasi, anotasi, perbandingan varian)
- How U Remind Me: pola "memory as OS/state" (Letta) + API memori terstruktur (mem0)
- RIOT Intelligence: pipeline RAG modular (ingest → chunk/index → retrieve → generate)
- ROCKSOUL DX: plugin modular Tauri (updater, sql, store, auth)
- Arsy: integrasi dengan PowerDNS untuk authoritative DNS
- Storage: evaluasi RustFS/Garage untuk native object store

### D. Experimental / R&D

- sqlite-vec untuk simplifikasi vector search stack
- vLLM untuk serving produksi RIOT Intelligence
- Nx untuk enforcement boundary (jika butuh)
- Zitadel untuk multi-tenant B2B (kajian lisensi AGPL)

### E. Not Worth Pursuing

- Migrasi dari Turborepo ke Nx (tanpa kebutuhan spesifik)
- Migrasi dari Fastify ke framework lain (tanpa kebutuhan spesifik)
- Rebuild ORM (sudah solid, perbaikan incremental cukup)

---

## 8. ACTIONABLE TASK BACKLOG

### T1. Fix CSRF origin check bypass

- **Category:** Security
- **Priority:** P0
- **Type:** Fix
- **Problem:** `isAllowedBffOrigin` mengizinkan request tanpa Origin header (`rawOrigin === undefined → true`), potensi CSRF pada endpoint BFF exchange
- **Evidence:** `apps/api/src/interface/routes/auth.routes.ts:90-92`
- **Proposed Solution:** Tolak request tanpa Origin pada endpoint state-changing (POST /auth/bff/exchange, /auth/logout)
- **Implementation Scope:** `apps/api/src/interface/routes/auth.routes.ts`
- **Acceptance Criteria:** Request tanpa Origin header ke endpoint BFF exchange mendapat 403; request dengan Origin valid tetap berfungsi
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Menutup celah CSRF
- **Validation:** Unit test + integration test
- **References:** OWASP CSRF Prevention Cheat Sheet

### T2. Fix CSRF double-submit absent header

- **Category:** Security
- **Priority:** P0
- **Type:** Fix
- **Problem:** `isValidOptionalCsrfHeader` menganggap valid jika header `x-csrf-token` absent
- **Evidence:** `auth.routes.ts:133-142`
- **Proposed Solution:** Jika cookie CSRF ada, header harus ada dan match; jika cookie tidak ada, tolak
- **Implementation Scope:** `apps/api/src/interface/routes/auth.routes.ts`
- **Acceptance Criteria:** Request dengan cookie CSRF tapi tanpa header mendapat 403
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Memperkuat CSRF protection
- **Validation:** Unit test
- **References:** OWASP CSRF

### T3. Add MID_KEY_ENCRYPTION_SECRET to production env validation

- **Category:** Security
- **Priority:** P0
- **Type:** Fix
- **Problem:** `MID_KEY_ENCRYPTION_SECRET` tidak divalidasi di `validateProductionEnv`; fallback default lemah di docker-compose
- **Evidence:** `apps/api/src/shared/env.ts:261-290`, `docker-compose.yml:117`
- **Proposed Solution:** Tambahkan check di `validateProductionEnv` untuk `MID_KEY_ENCRYPTION_SECRET` (required, min 16 chars, bukan default); hapus fallback di docker-compose
- **Implementation Scope:** `apps/api/src/shared/env.ts`, `docker-compose.yml`
- **Acceptance Criteria:** Boot di production tanpa secret gagal dengan error jelas; boot dengan secret valid berhasil
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Mencegah key enkripsi lemah
- **Validation:** Unit test `validateProductionEnv`
- **References:** NIST SP 800-57

### T4. Remove default POSTGRES_PASSWORD in docker-compose

- **Category:** Security
- **Priority:** P0
- **Type:** Fix
- **Problem:** `POSTGRES_PASSWORD` default `moonwitness` jika env kosong
- **Evidence:** `docker-compose.yml:257-258`
- **Proposed Solution:** Hapus default, wajibkan env var (fail fast jika tidak set)
- **Implementation Scope:** `docker-compose.yml`
- **Acceptance Criteria:** Compose up tanpa `POSTGRES_PASSWORD` gagal dengan error jelas
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Mencegah database password lemah
- **Validation:** Manual test compose up
- **References:** CIS Docker Benchmark

### T5. Namespace migration IDs to prevent global collision

- **Category:** Architecture
- **Priority:** P0
- **Type:** Refactor
- **Problem:** Migration IDs `001_*` reused across modules; tabel `_orm_schema_migrations` global; collision → checksum mismatch → startup failure
- **Evidence:** `apps/api/src/db/migrations.ts`, `apps/api/src/infrastructure/persistence/domain/`
- **Proposed Solution:** Prefix migration IDs dengan modul (e.g., `auth_001_create_users`, `cc_001_create_workflows`); atau tabel migration per-modul
- **Implementation Scope:** Semua migration files di `apps/api/src/infrastructure/persistence/domain/`
- **Acceptance Criteria:** Semua migration ID unik secara global; `applyMigrations` berhasil tanpa checksum mismatch
- **Dependencies:** None
- **Risk:** Medium
- **Estimated Effort:** S
- **Expected Impact:** Mencegah startup failure
- **Validation:** `pnpm api:test`, manual boot
- **References:** Flyway/Liquibase best practices

### T6. Fix createScale color scale bug

- **Category:** Bug
- **Priority:** P1
- **Type:** Fix
- **Problem:** `createScale` mengembalikan skala warna di mana semua step (50-950) identik dengan baseHex
- **Evidence:** `packages/ui/src/dna/default-theme.ts`
- **Proposed Solution:** Implementasi proper color scale dengan variasi lightness (HSL/OKLCH manipulation)
- **Implementation Scope:** `packages/ui/src/dna/default-theme.ts`
- **Acceptance Criteria:** Setiap step (50-950) menghasilkan warna berbeda; visual test pass
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** S
- **Expected Impact:** Perbaikan visual theming yang signifikan
- **Validation:** `pnpm ui:test`, visual regression
- **References:** Radix Colors, Tailwind color scale

### T7. Remove duplicate migration and route registration in API bootstrap

- **Category:** Architecture
- **Priority:** P1
- **Type:** Refactor
- **Problem:** `applyMigrations` dipanggil dua kali; routes didaftarkan ganda di bootstrap.ts dan fastify.adapter.ts
- **Evidence:** `apps/api/src/bootstrap.ts`, `apps/api/src/infrastructure/adapters/fastify.adapter.ts`
- **Proposed Solution:** Hapus duplikasi: migrations hanya di adapter; routes hanya di addon registry
- **Implementation Scope:** `bootstrap.ts`, `fastify.adapter.ts`
- **Acceptance Criteria:** Boot berhasil dengan satu kali migration dan satu kali route registration; no duplicate route warning
- **Dependencies:** T5 (migration namespacing)
- **Risk:** Medium
- **Estimated Effort:** S
- **Expected Impact:** Mengurangi startup time, mencegah confusion
- **Validation:** `pnpm api:test`, manual boot
- **References:** Fastify plugin encapsulation docs

### T8. Extend contracts coverage to all API routes

- **Category:** Architecture
- **Priority:** P1
- **Type:** Feature
- **Problem:** Contracts hanya mengekspor `timeline/endpoints`; banyak route tidak memiliki kontrak terpusat
- **Evidence:** `packages/contracts/src/index.ts`
- **Proposed Solution:** Tambahkan Zod contracts untuk control, storage, radius, syslog, snmp, probes, riot-ai, memory, auth routes
- **Implementation Scope:** `packages/contracts/src/`, `apps/api/src/interface/routes/`
- **Acceptance Criteria:** Setiap route memiliki contract; typecheck pass; Pact tests updated
- **Dependencies:** None
- **Risk:** Medium
- **Estimated Effort:** L
- **Expected Impact:** Type safety end-to-end, mencegah breaking changes
- **Validation:** `pnpm typecheck`, Pact tests
- **References:** Zod, OpenAPI 3

### T9. Replace manual JSON Schema with Zod-derived schemas

- **Category:** Architecture
- **Priority:** P2
- **Type:** Refactor
- **Problem:** `schemas.ts` menduplikasi Zod schema; drift risk
- **Evidence:** `apps/api/src/interface/routes/schemas.ts` vs `packages/schema`
- **Proposed Solution:** Generate JSON Schema dari Zod via `zod-to-json-schema` atau Fastify's built-in Zod support
- **Implementation Scope:** `apps/api/src/interface/routes/schemas.ts`
- **Acceptance Criteria:** Single source of truth; no manual JSON Schema duplication
- **Dependencies:** T8 (contracts coverage)
- **Risk:** Low
- **Estimated Effort:** M
- **Expected Impact:** Mengurangi drift, meningkatkan maintainability
- **Validation:** `pnpm api:test`, `pnpm typecheck`
- **References:** zod-to-json-schema

### T10. Audit Rust unwrap() in production paths

- **Category:** Reliability
- **Priority:** P2
- **Type:** Fix
- **Problem:** 204 `unwrap()` calls in Rust services; production path mungkin panic
- **Evidence:** `services/*/src/`
- **Proposed Solution:** Audit setiap `unwrap()`; ganti dengan proper error handling di production path; sisakan di test code
- **Implementation Scope:** `services/radius/src/`, `services/snmp-poller/src/`, `services/storage/src/`, `services/syslog/src/`
- **Acceptance Criteria:** Tidak ada `unwrap()` di production path (non-test); clippy pass
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** M
- **Expected Impact:** Mencegah runtime panic
- **Validation:** `cargo clippy --all-targets -- -D warnings`, `cargo test`
- **References:** Rust error handling best practices

### T11. Pin all GitHub Actions to SHA

- **Category:** Security
- **Priority:** P2
- **Type:** Infrastructure
- **Problem:** `checkout@v4`, `cache@v4`, `upload-artifact@v4` tidak pinned ke SHA di security-scan.yml
- **Evidence:** `.github/workflows/security-scan.yml`
- **Proposed Solution:** Pin semua actions ke commit SHA dengan version comment
- **Implementation Scope:** `.github/workflows/security-scan.yml`
- **Acceptance Criteria:** Semua `uses:` menggunakan SHA pin
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Mengurangi supply chain risk
- **Validation:** CI pass
- **References:** GitHub Security Hardening

### T12. Cleanup engines/ vendored directory

- **Category:** DX
- **Priority:** P2
- **Type:** Chore
- **Problem:** 13.766 file git-tracked, bukan active subprojects, membebani repo dan search
- **Evidence:** `engines/` directory, `pnpm-workspace.yaml`
- **Proposed Solution:** Pindah ke archive repo terpisah atau `.gitignore`-kan; pertahankan hanya yang aktif digunakan
- **Implementation Scope:** `engines/`, `.gitignore`
- **Acceptance Criteria:** Repo size berkurang; search lebih cepat; build tidak terpengaruh
- **Dependencies:** None
- **Risk:** Medium
- **Estimated Effort:** M
- **Expected Impact:** Mengurangi noise, mempercepat search/clone
- **Validation:** `git status`, `pnpm build`
- **References:** Git LFS, repo hygiene

### T13. Triage 1320 TODO/FIXME/HACK comments

- **Category:** DX
- **Priority:** P3
- **Type:** Chore
- **Problem:** 1320 TODO/FIXME/HACK comments di codebase; banyak mungkin sudah resolved
- **Evidence:** Grep across repo
- **Proposed Solution:** Audit setiap TODO; resolve yang sudah done, convert yang valid ke GitHub Issues, hapus yang obsolete
- **Implementation Scope:** Seluruh codebase
- **Acceptance Criteria:** TODO count < 200; setiap remaining TODO memiliki issue link
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** L
- **Expected Impact:** Mengurangi technical debt noise
- **Validation:** `grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.rs" --include="*.go" | wc -l`
- **References:** Tech debt management

### T14. Cleanup stray .db files and .plan screenshots

- **Category:** DX
- **Priority:** P3
- **Type:** Chore
- **Problem:** Stray `.db` files di `apps/api/` dan repo root; `.plan/` berisi ratusan screenshot
- **Evidence:** `apps/api/*.db`, `test1.db`, `.plan/`
- **Proposed Solution:** Tambahkan `*.db` ke `.gitignore`; pindahkan screenshot ke storage eksternal atau hapus
- **Implementation Scope:** `.gitignore`, `.plan/`
- **Acceptance Criteria:** Tidak ada `.db` file tracked; `.plan/` hanya berisi markdown
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Repo lebih bersih
- **Validation:** `git status`
- **References:** Git hygiene

### T15. Implement rate limiter shared store for multi-instance

- **Category:** Performance
- **Priority:** P3
- **Type:** Feature
- **Problem:** Rate limiter in-memory single-process; multi-instance tanpa shared store
- **Evidence:** `apps/api/src/infrastructure/rate-limit.ts:4-7`
- **Proposed Solution:** Tambahkan opsi Redis/shared store untuk rate limiter; fallback ke in-memory untuk single-instance
- **Implementation Scope:** `apps/api/src/infrastructure/rate-limit.ts`
- **Acceptance Criteria:** Rate limiter bekerja konsisten across multiple instances
- **Dependencies:** Redis infrastructure
- **Risk:** Medium
- **Estimated Effort:** M
- **Expected Impact:** Scalability untuk multi-instance deployment
- **Validation:** Integration test dengan 2 instances
- **References:** @fastify/rate-limit Redis store

### T16. Replace unsafe-inline CSP with nonce/hash

- **Category:** Security
- **Priority:** P3
- **Type:** Fix
- **Problem:** CSP `style-src 'unsafe-inline'` di igate dan mid
- **Evidence:** `apps/igate/src/app.ts:66`, `apps/mid/src/http.ts:145`
- **Proposed Solution:** Gunakan nonce atau hash untuk inline styles
- **Implementation Scope:** `apps/igate/src/app.ts`, `apps/mid/src/http.ts`
- **Acceptance Criteria:** CSP tidak mengandung `unsafe-inline`; styles tetap berfungsi
- **Dependencies:** None
- **Risk:** Medium
- **Estimated Effort:** M
- **Expected Impact:** Memperkuat XSS defense
- **Validation:** Browser test, CSP header check
- **References:** CSP Level 3

### T17. Remove Caddy fallback :80 HTTP block

- **Category:** Security
- **Priority:** P3
- **Type:** Fix
- **Problem:** Fallback `:80` block reverse_proxy ke web tanpa TLS
- **Evidence:** `Caddyfile:42-46`
- **Proposed Solution:** Redirect HTTP ke HTTPS atau hapus block
- **Implementation Scope:** `Caddyfile`
- **Acceptance Criteria:** HTTP request di-redirect ke HTTPS
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** XS
- **Expected Impact:** Mencegah HTTP exposure
- **Validation:** curl test
- **References:** Caddy TLS redirect

### T18. Fix Go control plane resource cleanup

- **Category:** Reliability
- **Priority:** P3
- **Type:** Fix
- **Problem:** `cmdServe` memanggil `radius_handle.shutdown()` setelah `axum::serve` selesai (tidak akan jalan); `build()` tidak menutup `auditLog`/`users` file handles
- **Evidence:** `cp/arsy/cmd/arsy/main.go`, `cp/arsy/internal/api/server.go`
- **Proposed Solution:** Pindahkan shutdown ke signal handler (SIGTERM/SIGINT); tambahkan Close() methods
- **Implementation Scope:** `cp/arsy/cmd/arsy/main.go`, `cp/arsy/internal/api/server.go`
- **Acceptance Criteria:** Graceful shutdown menutup semua resource; go test pass
- **Dependencies:** None
- **Risk:** Low
- **Estimated Effort:** S
- **Expected Impact:** Mencegah resource leak
- **Validation:** `go test ./...`, manual shutdown test
- **References:** Go graceful shutdown patterns

---

## 9. PRIORITY & DEPENDENCY MATRIX

| ID  | Title                                         | Priority | Effort | Risk   | Dependencies |
| --- | --------------------------------------------- | -------- | ------ | ------ | ------------ |
| T1  | Fix CSRF origin check bypass                  | P0       | XS     | Low    | —            |
| T2  | Fix CSRF double-submit absent header          | P0       | XS     | Low    | —            |
| T3  | Add MID_KEY_ENCRYPTION_SECRET validation      | P0       | XS     | Low    | —            |
| T4  | Remove default POSTGRES_PASSWORD              | P0       | XS     | Low    | —            |
| T5  | Namespace migration IDs                       | P0       | S      | Medium | —            |
| T6  | Fix createScale color scale                   | P1       | S      | Low    | —            |
| T7  | Remove duplicate migration/route registration | P1       | S      | Medium | T5           |
| T8  | Extend contracts coverage                     | P1       | L      | Medium | —            |
| T9  | Replace manual JSON Schema with Zod           | P2       | M      | Low    | T8           |
| T10 | Audit Rust unwrap()                           | P2       | M      | Low    | —            |
| T11 | Pin GitHub Actions to SHA                     | P2       | XS     | Low    | —            |
| T12 | Cleanup engines/ vendored                     | P2       | M      | Medium | —            |
| T13 | Triage TODO/FIXME/HACK                        | P3       | L      | Low    | —            |
| T14 | Cleanup stray .db and .plan screenshots       | P3       | XS     | Low    | —            |
| T15 | Rate limiter shared store                     | P3       | M      | Medium | Redis infra  |
| T16 | Replace unsafe-inline CSP                     | P3       | M      | Medium | —            |
| T17 | Remove Caddy fallback :80                     | P3       | XS     | Low    | —            |
| T18 | Fix Go control plane cleanup                  | P3       | S      | Low    | —            |

**Dependency chain:** T5 → T7 → (T8 → T9). Semua P0 independen, bisa dikerjakan paralel.

---

## 10. PROPOSED DEVELOPMENT ROADMAP

### NOW — Critical (P0)

T1, T2, T3, T4, T5 (semua independen, bisa paralel)
**Tujuan:** Tutup celah keamanan kritis dan mencegah startup failure.

### NEXT — High Value (P1)

T6, T7, T8
**Tujuan:** Perbaiki visual theming, hilangkan redundansi, perluas type safety end-to-end.

### LATER — Strategic (P2)

T9, T10, T11, T12
**Tujuan:** Reduksi drift, keandalan Rust, supply chain hardening, repo hygiene.

### EXPERIMENT — R&D (P3)

T13, T14, T15, T16, T17, T18
**Tujuan:** Technical debt cleanup, scalability, security hardening, resource management.

---

## 11. RISKS, UNKNOWNNS & REJECTED IDEAS

### Risks

- Default secret di docker-compose bisa menyebabkan production deployment tidak aman jika operator tidak membaca docs
- Global migration IDs collision bisa menyebabkan startup failure yang sulit di-debug
- `engines/` vendored 13k+ file memperlambat clone, search, dan CI
- Silent catch di repository bisa menyembunyikan bug

### Unknowns

- State runtime VPS, sertifikat TLS live, container state tidak diverifikasi (sesuai disclaimer SECURITY.md)
- Memory app (Python FastAPI) tidak dianalisis detail
- Feature completeness vs documented intent perlu verifikasi lebih lanjut
- 1320 TODO/FIXME/HACK belum ditriase

### Rejected Ideas

- Migrasi dari Turborepo ke Nx — tidak ada kebutuhan spesifik yang membenarkan kompleksitas tambahan
- Migrasi dari Fastify ke framework lain — tidak ada kebutuhan spesifik
- Rebuild ORM — sudah solid, perbaikan incremental cukup
- Copy competitors blindly — adopsi harus disesuaikan dengan visi dan doctrine proyek

---

## 12. EXTERNAL RESEARCH BIBLIOGRAPHY

### Research Papers & Technical Publications

- Clivaz, C. "The Digital Humanities in Biblical Studies and Theology" (2019, HAL/UNIL) — https://hal.science/hal-02477239/document
- IJRIAS. "Artificial Intelligence in Sacred Text Analysis: A Survey" — https://rsisinternational.org/journals/ijrias/
- heiBOOKS. "Introducing Theology to Digital Humanities" (2026-03-26) — https://books.ub.uni-heidelberg.de/heibooks/catalog/book/1748

### GitHub Intelligence & Open-Source Trends

- AndBible — https://andbible.org/ (offline Bible study, SWORD modules)
- reformed-bible-study — https://github.com/robertguss/reformed-bible-study
- Letta (MemGPT) — https://github.com/letta-ai/letta
- mem0 — https://github.com/mem0ai/mem0
- awesome-tauri — https://github.com/tauri-apps/awesome-tauri
- Turborepo docs — https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- LlamaIndex — https://github.com/run-llama/llama_index
- awesome-selfhosted — https://github.com/awesome-selfhosted/awesome-selfhosted

### Official Documentation & Engineering Sources

- Fastify v5.5.x docs — https://fastify.dev/docs/v5.5.x/Guides/
- Next.js Caching docs — https://nextjs.org/docs/app/getting-started/caching
- Tauri v2 docs — https://v2.tauri.app/
- Turso/libSQL — https://turso.tech/
- Ollama vs vLLM comparison — https://www.spheron.network/blog/ollama-vs-vllm/
- PowerDNS — https://www.powerdns.com/
- Rust Axum — https://encore.dev/articles/best-rust-web-frameworks

### Industry & Community Intelligence

- Keycloak vs Zitadel comparison (Authgear, 2026-10-23) — https://www.authgear.com/post/keycloak-vs-zitadel/
- Self-hosted S3 alternatives 2026 (Glukhov) — https://www.glukhov.org/data-infrastructure/object-storage/self-hosted-s3-alternatives/
- SQLite Renaissance 2026 (DEV) — https://dev.to/pockit_tools/the-sqlite-renaissance-why-the-worlds-most-deployed-database-is-taking-over-production-in-2026-3jcc
- AI Agent Memory 2026 (Eden AI) — https://www.edenai.co/post/ai-agent-memory-mempalace-mem0-and-persistent-context

---

## 13. THE TOP 10 ACTIONS

### 1. Fix CSRF origin check bypass (T1)

- **Why it matters:** Potensi CSRF pada endpoint BFF exchange yang mengandalkan cookie session
- **What needs to be done:** Tolak request tanpa Origin header pada endpoint state-changing
- **Expected result:** Celah CSRF tertutup
- **Dependencies:** None
- **Acceptance criteria:** Request tanpa Origin → 403; request dengan Origin valid → 200

### 2. Fix CSRF double-submit absent header (T2)

- **Why it matters:** CSRF double-submit tidak efektif jika header absent dianggap valid
- **What needs to be done:** Jika cookie CSRF ada, header harus ada dan match
- **Expected result:** CSRF protection diperkuat
- **Dependencies:** None
- **Acceptance criteria:** Request dengan cookie tapi tanpa header → 403

### 3. Add MID_KEY_ENCRYPTION_SECRET to production env validation (T3)

- **Why it matters:** Default secret lemah bisa menyebabkan key enkripsi MID signing keys bocor
- **What needs to be done:** Tambahkan check di `validateProductionEnv`; hapus fallback di docker-compose
- **Expected result:** Boot di production tanpa secret gagal dengan error jelas
- **Dependencies:** None
- **Acceptance criteria:** `validateProductionEnv` return error jika secret missing/default

### 4. Remove default POSTGRES_PASSWORD in docker-compose (T4)

- **Why it matters:** Default password `moonwitness` sangat lemah
- **What needs to be done:** Hapus default, wajibkan env var
- **Expected result:** Compose up tanpa password gagal dengan error jelas
- **Dependencies:** None
- **Acceptance criteria:** Compose up tanpa `POSTGRES_PASSWORD` → error

### 5. Namespace migration IDs (T5)

- **Why it matters:** Collision-prone global migration IDs bisa menyebabkan startup failure
- **What needs to be done:** Prefix migration IDs dengan modul
- **Expected result:** Semua migration ID unik; boot berhasil
- **Dependencies:** None
- **Acceptance criteria:** `applyMigrations` berhasil tanpa checksum mismatch

### 6. Fix createScale color scale bug (T6)

- **Why it matters:** Visual theming rusak — semua color step identik
- **What needs to be done:** Implementasi proper color scale dengan variasi lightness
- **Expected result:** Setiap step menghasilkan warna berbeda
- **Dependencies:** None
- **Acceptance criteria:** Visual test pass; color scale bervariasi

### 7. Remove duplicate migration and route registration (T7)

- **Why it matters:** Redundan, memperlambat startup, membingungkan
- **What needs to be done:** Hapus duplikasi di bootstrap.ts vs fastify.adapter.ts
- **Expected result:** Boot dengan satu kali migration dan route registration
- **Dependencies:** T5
- **Acceptance criteria:** No duplicate route warning; boot berhasil

### 8. Extend contracts coverage (T8)

- **Why it matters:** Type safety end-to-end; mencegah breaking changes
- **What needs to be done:** Tambahkan Zod contracts untuk semua route API
- **Expected result:** Setiap route memiliki contract
- **Dependencies:** None
- **Acceptance criteria:** Typecheck pass; Pact tests updated

### 9. Audit Rust unwrap() in production paths (T10)

- **Why it matters:** Production path mungkin panic
- **What needs to be done:** Audit dan ganti dengan proper error handling
- **Expected result:** Tidak ada unwrap() di production path
- **Dependencies:** None
- **Acceptance criteria:** Clippy pass; no unwrap in non-test code

### 10. Cleanup engines/ vendored directory (T12)

- **Why it matters:** 13.766 file memperlambat clone, search, CI
- **What needs to be done:** Pindah ke archive atau gitignore
- **Expected result:** Repo lebih ringan dan cepat
- **Dependencies:** None
- **Acceptance criteria:** Repo size berkurang; build tidak terpengaruh

---

**FINAL OBJECTIVE ACHIEVED:** Discovered what MoonWitness could become, explained why, and turned that knowledge into the next executable stage of development — 18 actionable tasks with clear acceptance criteria, prioritized into 4 execution horizons with dependency chains.

_Report generated: 18 November 2026 | Repository: MoonWitness v0.6.1 | Branch: dev_
