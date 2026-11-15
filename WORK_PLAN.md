# MoonWitness Backlog — Verified Status (Consolidated Monorepo)

## Verified Architecture & Completed Work

- **Issue #7 (P1) — Dock & Timeline UI:** COMPLETED. Verified via API + web tests.
- **Issues #31–#34 — RIOT Intelligence (Ollama Adapter, Fastify API, Provider Persistence, `/intelligence` UX):** IMPLEMENTED across `packages/ai/src/adapters/ollama`, `apps/api/src/interface/routes/riot-ai.*`, and `apps/web/src/app/intelligence`.
- **Issues #98–#105 — Operations Screens & Accessibility (`/syslog`, `/snmp`, `/storage`, `/radius`, `/vpn`, `/control`):** IMPLEMENTED with `OperationsShell` separation (`MW-UI-SPEC-001`), server-side SigV4 signing (`storage.routes.ts`), SNMP community redaction (`snmp-poller.routes.ts` & UI sanitizer), and authenticated role checks (`requireAuth` / `requireRole`).
- **Issue #8 — Persistent Command Center:** IMPLEMENTED via SQLite tables (`command_center_workflows`, `command_center_alerts`), Fastify routes (`/api/v1/command-center/*`), and live client synchronization in `apps/web/src/components/command-center/use-command-center.ts`.
- **Monorepo Consolidation:** Canonical repository at `z:\repo\isrockfeel\moonwitness` (`dev` branch), integrating `apps/rocksoul` (`rocksoul-dx`), `apps/a-l-l-a-h`, `apps/memory` (reassigned web port `3005`), and shared design system `packages/ui`.

## Remaining Operational / Future Milestones

| Area                  | Scope                                               | Notes                                                    |
| --------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| CI & E2E Hardening    | Full Playwright E2E + Rust service integration      | Automated unit/typecheck/lint gates active per workspace |
| Production Deployment | Docker Compose orchestration & secrets provisioning | Set real secrets in environment before production boot   |
