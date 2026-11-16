# MoonWitness Backlog — Verified Status (Consolidated Monorepo)

## Verified Architecture & Completed Work

- **Issue #7 (P1) — Dock & Timeline UI:** COMPLETED. Verified via API + web tests.
- **Issues #31–#34 — RIOT Intelligence (Ollama Adapter, Fastify API, Provider Persistence, `/intelligence` UX):** IMPLEMENTED across `packages/ai/src/adapters/ollama`, `apps/api/src/interface/routes/riot-ai.*`, and `apps/web/src/app/intelligence`.
- **Issues #98–#105 — Operations Screens & Accessibility (`/syslog`, `/snmp`, `/storage`, `/radius`, `/vpn`, `/control`):** IMPLEMENTED with `OperationsShell` separation (`MW-UI-SPEC-001`), server-side SigV4 signing (`storage.routes.ts`), SNMP community redaction (`snmp-poller.routes.ts` & UI sanitizer), and authenticated role checks (`requireAuth` / `requireRole`).
- **Issue #8 — Persistent Command Center:** IMPLEMENTED via SQLite tables (`command_center_workflows`, `command_center_alerts`), Fastify routes (`/api/v1/command-center/*`), and live client synchronization in `apps/web/src/components/command-center/use-command-center.ts`.
- **Monorepo Consolidation:** Canonical repository at `z:\repo\isrockfeel\moonwitness` (`dev` branch), integrating `apps/rocksoul` (`rocksoul-dx`, port `1420`), `apps/a-l-l-a-h` (`3003`), `apps/memory` (`3005`/`8000`/`9000`), `apps/api` (`3002`), `apps/web` (`3000`), and `@moonwitness/ui`; optional REST bridge (`/api/v1/memory/*` & `ArchiveMemoryBridge`) connects `/intelligence` to `apps/memory`. Confirmed superseded GitHub remotes (`A-L-L-A-H/rocksoul-dx`, `bjo163/moonwitness-memory`, `The-Batteries/moonwitness`, `BRIDGE-ALLAH/ui`) are archived read-only.

## Remaining Operational / Future Milestones

| Area                  | Scope                                               | Notes                                                  |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| ROCKSOUL M4 Install   | Interactive MSI/NSIS install, restart, & uninstall  | Requires manual user Windows installer acceptance      |
| Production Deployment | Docker Compose orchestration & secrets provisioning | Set real secrets in environment before production boot |
