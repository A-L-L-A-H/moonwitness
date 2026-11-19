# @moonwitness/web

Unified Next.js App Router web surface for **A-L-L-A-H Sanctuary** (`a-l-l-a-h.com`) and **MoonWitness Operations / Dock** (`moonwitness.biz.id`), operating in Trust Zone A/B ([ADR-006](../../docs/architecture/adr-006-three-app-topology-and-trust-zones.md)).

## Architecture & Provider Lifecycle

- **Root Composition (`src/app/layout.tsx`):** Enforces startup auth safety (`assertProductionAuthSafety`) and mounts the single top-level `<Providers>` (`QueryClientProvider` + `RootSkinProvider`) and `<SettingsProvider>` hydrated from request cookies (`getSettingsFromCookie()`, `getServerMode()`).
- **Singleton Context Guards:** Nested `<Providers>` (`ProvidersMountedContext`) and unparameterized nested `<SettingsProvider>` (`SettingsMountedContext`) reuse the root `QueryClient` and Vuexy settings state rather than allocating duplicate trees or resetting React state on sub-layouts (`(console)/layout.tsx`, `[lang]/layout.tsx`).
- **Sanctuary Skin Isolation:** `RootSkinProvider` scopes `SkinProvider` locally (`scope="local" persist={false} defaultDna="01-imperium-lumen"`) on public sanctuary routes (`/`, `/scriptures`, `/codex`, `/mtime`) so document-wide console themes never leak into `<SkinRoot>` surfaces.
- **Settings State vs. Cookie Persistence (`src/@core/contexts/settingsContext.tsx`):** React state updates run unconditionally while cookie persistence is controlled via `{ updateCookie?: boolean }`, allowing page-level overrides (`updatePageSettings`) to revert cleanly on unmount.

## Routes & Canonical Ownership

All 45 App Router page routes across `(sanctuary)`, `(console)`, `auth`, `[lang]/(front-pages)`, `[lang]/(blank-layout-pages)`, and `[lang]/(dashboard)/(private)` are cataloged in `ROUTE_INVENTORY` (`src/configs/routePolicy.ts`) and verified by `WEB-GATE-07` in `tests/enterprise-structure.test.ts`:

- `(sanctuary)` — Public A-L-L-A-H Sanctuary surfaces (`/`, `/scriptures`, `/codex`, `/mtime`)
- `(console)` — Operations & creator HUD routes (`/mission-control`, `/dock`, `/memory`, `/addons`, `/control`, etc.) and compatibility aliases (`/setup`, `/models/[model]`, `/vpn`, `/syslog`, `/snmp`, `/radius`, `/storage`)
- `[lang]/(dashboard)/(private)` — Locale-prefixed enterprise workspace (`/{en,id,ar}/...`) with server + client protection
- `auth` — Authentication callback (`/auth/callback`) and BFF proxy handlers (`/api/v1/[...path]`, `/api/memory/[...path]`, `/api/health`)

## Domain Features (`src/features/<domain>/`)

- Domain modules under `src/features/` (pilot domains: `command-center`, `memory`) follow a clean barrel boundary: `types/index.ts`, `api/index.ts`, `components/index.ts`, and `index.ts`.
- Cross-feature and route-level imports MUST target `@/features/<domain>` rather than deep internal subpaths (`WEB-GATE-08`).

## Authorization & BFF Trust Boundaries

- **Single Policy Matrix (`src/configs/routePolicy.ts`):** `hasRequiredRole`, `resolveRoutePolicy`, and `evaluateRouteAccess` fail closed for missing, empty, unknown, or prototype-key roles (`viewer`/`creator` < `editor` < `admin`) and unknown paths default to `access: "protected"`.
- **Defense in Depth:**
  - Server layouts and admin pages call `verifyServerRouteAccess()` (`src/@core/auth/serverRouteGuard.ts`) against `/api/v1/auth/me` when session credentials are present.
  - Client layouts (`[lang]/(dashboard)/(private)/layout.tsx`, `(console)/layout.tsx`) wrap views in `<AuthGuard>` with fail-closed `<NotAuthorizedView>` / `<AuthRedirect>`.
  - `src/env.ts`, `next.config.ts`, and `src/lib/session.ts` reject `MW_DEV_AUTH_BYPASS` / `NEXT_PUBLIC_DEV_AUTH_BYPASS` in `NODE_ENV=production`; client-side `NEXT_PUBLIC_DEV_AUTH_BYPASS` is never honored.
  - BFF proxies (`src/app/api/_lib/upstream-proxy.ts`) strip client-spoofable identity headers (`x-role`, `x-actor-*`, `x-user-*`, `x-groups`, `x-mw-*`), and `/api/memory/[...path]` enforces `editor+` authentication on `POST`, `PUT`, `PATCH`, and `DELETE`.

## Key Scripts

```sh
pnpm --filter @moonwitness/web dev                    # Next.js dev server (default port 3000)
pnpm --filter @moonwitness/web build                  # Production Next.js build
pnpm --filter @moonwitness/web start                  # Start production build
pnpm --filter @moonwitness/web lint                   # ESLint
pnpm --filter @moonwitness/web typecheck              # next typegen && tsc --noEmit
pnpm --filter @moonwitness/web test                   # Vitest unit & architecture gates
pnpm --filter @moonwitness/web test:dock              # Playwright dock suite
pnpm --filter @moonwitness/web test:cross-world       # Playwright cross-world DNA suite
pnpm --filter @moonwitness/web test:operations        # Playwright operations suite
pnpm --filter @moonwitness/web test:pact              # Consumer Pact contract check
```

## Ownership & References

- **Owner:** Frontend & Sanctuary Platform (`apps/web`)
- **Governance:** [Documentation Governance Contract](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
- **Design Contracts:** [docs/dna/README.md](../../docs/dna/README.md), [packages/ui/README.md](../../packages/ui/README.md)
