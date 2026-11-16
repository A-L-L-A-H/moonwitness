# Web + AI Integration Changelog

All notable changes to the `/web` frontend application architecture, metadata runtime, API bindings, and AI workspaces are documented in this file.

---

## Phase 01 — Existing `/web` Audit

Status:
COMPLETE

Added:
- Initial audit documenting frontend stack (Vite 7, React 19, Tailwind v4, shadcn/ui, Radix UI).
- Documented backend stack (Fastify, Drizzle ORM, LibSQL SQLite on port 3000).
- Documented pre-existing technical debt and integration risks.

Changed:
- `docs/web-ai-integration/audit.md` created.

Verified:
- TypeScript compilation and dependencies across `/web`.

Known limitations:
- Initial state lacked dynamic API connection to backend model routes.

Next:
- Map existing API endpoints.

---

## Phase 02 — API Discovery & Mapping

Status:
COMPLETE

Added:
- Complete mapping of Fastify generic model routes (`/api/v1/models/:model/*`) for `User`, `Project`, `Task`, `Chat`, `Mail`.
- Mapping of Fastify AI routes (`/api/v1/ai/*`) for agents, chat runs, streaming, and tool approvals.
- Documentation of authentication headers (`x-api-key`, `Authorization: Bearer <jwt>`).

Changed:
- `docs/web-ai-integration/api-map.md` created.

Verified:
- Fastify server live probe on `http://localhost:3000/health` and `/api/v1/models/*`.

Known limitations:
- Search and batch mutations are handled client-side or through specific model filters.

Next:
- Map ShadcnStore UX and resource patterns.

---

## Phase 03 — ShadcnStore Pattern Mapping

Status:
COMPLETE

Added:
- Resource and layout patterns mapped from ShadcnStore reference.
- Mapping of demo data shapes to canonical Drizzle backend entities.
- Composable view strategy (Tables, Kanban boards, Detail cards, Forms, Metrics).

Changed:
- `docs/web-ai-integration/shadcnstore-map.md` created.

Verified:
- Alignment with existing shadcn/ui primitives (`table`, `tabs`, `badge`, `card`, `dialog`, `command`).

Known limitations:
- Demo JSON files are preserved as offline/cached fallbacks; never used as source of truth.

Next:
- Implement typed metadata runtime and resource registries.

---

## Phase 04 — Metadata Core & Typed Contracts

Status:
COMPLETE

Added:
- `apps/web/src/ui-runtime/metadata/contracts.ts`: Strongly typed Zod schemas for `FieldDefinition`, `ViewDefinition`, `ActionDefinition`, `ResourceDefinition`, `NavigationItem`.
- `apps/web/src/ui-runtime/metadata/registry.ts`: Composable `ResourceRegistry` and `RendererRegistry` singletons.
- Type safe validation for UI definitions.

Changed:
- Created `/src/ui-runtime/` subsystem.

Verified:
- Strict TypeScript compile without any circular dependencies.

Known limitations:
- Complex nested field relationships defer validation to parent resource schemas.

Next:
- Implement generic UI renderers.

---

## Phase 05 — Generic UI Renderers

Status:
COMPLETE

Added:
- `FieldRenderer`: Strongly typed dynamic field formatting (text, date, badge, json, select, relation).
- `TableRenderer`: Resource-driven data table with search, sorting, pagination, and AI action trigger points.
- `KanbanRenderer`: Column-based workflow board grouped by custom status/priority with integrated AI quick actions.
- `apps/web/src/ui-runtime/index.ts`: Unified export module.

Changed:
- Integrated with shadcn/ui components.

Verified:
- Renderers compiled and tested against task and project data models.

Known limitations:
- Drag-and-drop column reordering is rendered visually; state mutation hooks into model updates.

Next:
- Define canonical resource descriptors.

---

## Phase 06 — Canonical Resource Definitions & Typed API Client

Status:
COMPLETE

Added:
- `apps/web/src/lib/api-client.ts`: Typed API client handling `/api/v1/models/*` CRUD and `/api/v1/ai/*` agent execution with dual authentication support (`x-api-key` and Bearer JWT).
- `taskResource`: Comprehensive task resource definition with fields, list table view, kanban view, and AI actions (`Analyze`, `Plan`, `Implement`, `Review`, `Summarize`).
- `projectResource`: Multi-tab project workspace definition (Overview, Tasks, AI Copilot, Members).
- `userResource`: User directory and team management resource.
- `mailResource` & `chatResource`: Communication domain resources.
- `apps/web/src/resources/index.ts`: Central registry auto-registration.

Changed:
- Enhanced `apps/web/src/app/tasks/page.tsx` with Table, Kanban, and AI Planner tabs linked directly to `api.models.list('tasks')`.
- Created `apps/web/src/app/projects/page.tsx` with live project metrics and metadata table.

Verified:
- Full build and typecheck with zero errors.

Known limitations:
- Mail and Chat resource views currently share sidebar navigation with existing demo views.

Next:
- Implement AI client boundary and workspaces.

---

## Phase 07 — AI Client Boundary & AI-Native Workspaces

Status:
COMPLETE

Added:
- `apps/web/src/features/ai/types.ts`: Discriminated union message parts (`text`, `code`, `tool_call`, `artifact`, `approval`, `status`).
- `apps/web/src/features/ai/client.ts`: High-level browser AI client isolated from AI runtime backend internals.
- `apps/web/src/features/ai/hooks/useAiChat.ts`: Unified session state hook supporting streaming, optimistic messages, and agent switching.
- `ChatShell`: ChatGPT-like multi-agent chat interface with agent selector, model status, tool call execution logs, and artifact panel.
- `CodingWorkspace`: Codex-like IDE workspace with repository explorer, diff viewer, terminal, and AI agent copilot panel.
- `BrowserWorkspace`: Browser Use workspace with address bar, interactive snapshot viewport, and DOM token inspector.
- New routes `/ai/chat`, `/ai/coding`, `/ai/browser` registered in `apps/web/src/config/routes.tsx`.
- Sidebar navigation updated with `Projects` and `AI Workspaces` links.

Changed:
- `apps/web/src/components/app-sidebar.tsx` updated with AI navigation items.

Verified:
- `pnpm --filter shadcn-dashboard-vite build` passes in 11.5s with zero errors.
- `pnpm --filter shadcn-dashboard-vite lint` passes with 0 errors.
- `pnpm build` across all 25 monorepo packages passes with 0 errors.

Known limitations:
- Browser workspace renders streaming DOM snapshots from backend agents; does not run local headless Chrome.

Next:
- Final documentation, architectural decision records, and acceptance summary.
