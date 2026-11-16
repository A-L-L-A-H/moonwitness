# Progress Report 06 — Canonical Resource Definitions & Typed API Client

## Objective
Define canonical resource descriptors (`Task`, `Project`, `User`, `Mail`, `Chat`) and a high-performance typed API client connecting the Vite frontend to the Fastify backend.

## Implementation
- Implemented `apps/web/src/lib/api-client.ts` with model CRUD methods, AI execution methods, SSE streaming parser, and authentication.
- Implemented `taskResource`, `projectResource`, `userResource`, `mailResource`, and `chatResource` under `apps/web/src/resources/`.
- Updated `apps/web/src/app/tasks/page.tsx` with live backend syncing, Kanban view, and AI Planner.
- Implemented `apps/web/src/app/projects/page.tsx` displaying live project stats and metadata table.

## Files Changed
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/resources/task.resource.ts`
- `apps/web/src/resources/project.resource.ts`
- `apps/web/src/resources/user.resource.ts`
- `apps/web/src/resources/mail-chat.resource.ts`
- `apps/web/src/resources/index.ts`
- `apps/web/src/app/tasks/page.tsx`
- `apps/web/src/app/projects/page.tsx`

## Dependencies
- `apps/web/src/ui-runtime`

## Verification
- Clean build via `pnpm --filter shadcn-dashboard-vite build`.

## Limitations
- Backend API authentication requires a user JWT or an operator-provisioned scoped API key; no live master-key fallback exists.

## Next
- Implement AI client boundary and workspaces.
