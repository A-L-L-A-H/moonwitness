# MoonWitness Backlog — Verified Status (Consolidated Monorepo)

## Verified Architecture & Completed Work

- **Issue #7 (P1) — Dock & Timeline UI:** COMPLETED. Verified via API + web tests.
- **Issues #31–#34 — RIOT Intelligence (Ollama Adapter, Fastify API, Provider Persistence, `/intelligence` UX):** IMPLEMENTED across `packages/ai/src/adapters/ollama`, `apps/api/src/interface/routes/riot-ai.*`, and `apps/web/src/app/intelligence`.
- **Issues #98–#105 — Operations Screens & Accessibility (`/syslog`, `/snmp`, `/storage`, `/radius`, `/vpn`, `/control`):** IMPLEMENTED with `OperationsShell` separation (`MW-UI-SPEC-001`), server-side SigV4 signing (`storage.routes.ts`), SNMP community redaction (`snmp-poller.routes.ts` & UI sanitizer), and authenticated role checks (`requireAuth` / `requireRole`).
- **Issue #8 — Persistent Command Center:** IMPLEMENTED via SQLite tables (`command_center_workflows`, `command_center_alerts`), Fastify routes (`/api/v1/command-center/*`), and live client synchronization in `apps/web/src/components/command-center/use-command-center.ts`.
- **Monorepo Consolidation & Docker Stack:** Canonical repository at `z:\repo\isrockfeel\moonwitness` (`dev` branch -> `A-L-L-A-H/moonwitness`), integrating `apps/rocksoul` (`rocksoul-dx`, port `1420`), `apps/a-l-l-a-h` (`3003`), `apps/memory` (`3005`/`8000`/`9000`), `apps/api` (`3002`), `apps/web` (`3000`), `@moonwitness/ui` (100% strict `tsc --noEmit` including `src/dna` & `src/skin`), and root multi-stage `Dockerfile` + `docker-compose.yml` (`moonwitness-data` volume, `/api/v1/healthz` healthcheck, `API_INTERNAL_URL=http://api:3002`). Optional REST bridge (`/api/v1/memory/*` & `ArchiveMemoryBridge`) connects `/intelligence` to `apps/memory`. Confirmed superseded GitHub remotes (`A-L-L-A-H/rocksoul-dx`, `bjo163/moonwitness-memory`, `The-Batteries/moonwitness`, `BRIDGE-ALLAH/ui`) are archived read-only.
- **ROCKSOUL M4 Installer & Persistence:** Verified `ROCKSOUL - DX_0.1.0_x64-setup.exe /S` install, app launch, SQLite `user_version=3` initialization, seeded row persistence across restart, in-place upgrade retention, and `uninstall.exe /S` per-user database preservation (`%APPDATA%\com.rocksoul.dx\rocksoul.sqlite3`).

## Remaining Operational / Future Milestones

| Area                  | Scope                                                    | Notes                                                      |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| ROCKSOUL MSI & Git UI | Interactive MSI wizard, signing, & live installed Git UI | Rust temp-repo Git suite passes; NSIS `/S` lifecycle green |
| Production Deployment | Docker Compose runtime & secrets provisioning            | Set `STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY` before boot  |
