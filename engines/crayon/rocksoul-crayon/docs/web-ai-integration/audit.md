# Frontend Reconnaissance & System Audit

**Project**: Rocksoul Frontend (`apps/web`)  
**Audit Date**: September 2026  
**Auditor**: Principal Frontend Architect & Integration Engineer  
**Status**: AUDITED & COMPLETED

---

## 1. Frontend Technology Stack

- **Framework**: React `19.2.3` with Vite `7.3.0`
- **Routing**: React Router DOM `7.11.0` (`react-router-dom`)
- **Styling & Design System**:
  - Tailwind CSS `v4.1.18` via `@tailwindcss/vite`
  - Radix UI Primitives (Accordion, Avatar, Dialog, Dropdown, Tabs, Popover, Tooltip, etc.)
  - Lucide React `0.562.0`
  - Theme: `next-themes` (Dark / Light mode support)
- **Data Tables & Components**:
  - TanStack Table `8.21.3` (`@tanstack/react-table`)
  - Form validation: `react-hook-form` `7.69.0` with `@hookform/resolvers` & `zod` `4.3.2`
  - Charts: `recharts` `3.6.0`
  - Command Palette: `cmdk` `1.1.1`
  - Drag and Drop: `@dnd-kit/core`, `@dnd-kit/sortable`
- **State Management**: Zustand `5.0.9` (currently used minimally for sidebar state)
- **Module Format**: ESM with path alias `@/* -> ./src/*`

---

## 2. Backend & Subsystem Integration Landscape

- **Backend Framework**: Fastify `5.2.1` (`apps/api`) running on port `3000`
- **Database & ORM**: LibSQL / SQLite (`./data/sqlite.db`) via Drizzle ORM
- **AI Subsystem**: Rocksoul AI Runtime (`@rocksoul/ai-base`) initialized as a library singleton with storage in `./data/ai.db`
- **Available API Surfaces**:
  - `/health` — Healthcheck
  - `/api/v1/auth/*` — User authentication, sessions, API Keys
  - `/api/v1/models/*` — Odoo-style model reflection, dynamic CRUD (`findMany`, `findById`, `create`, `update`, `delete`), AutoTable & AutoCRUD metadata, AutoMenu tree
  - `/api/v1/ai/*` — AI Agents (`/agents`), Chat (`/chat`), Runs (`/runs`, `/runs/:id`, `/runs/:id/cancel`)

---

## 3. Existing Frontend Routes & Pages

> Historical baseline: this inventory records the pre-runtime-integration state. For current implementation status, use `docs/ui/` (especially `calendar-runtime.md`, `resource-runtime.md`, and `phase-7.1-verification.md`).

| Route | Component | Current State / Data Source |
| :--- | :--- | :--- |
| `/` | Redirects to `/dashboard` | Functional redirect |
| `/dashboard`, `/dashboard-2` | Dashboard pages | Static metric widgets & Recharts |
| `/tasks` | Tasks Issue Tracker | Local static JSON (`./data/tasks.json`) + TanStack Table |
| `/mail` | Mail Client | Local mock data + Radix resizable panels |
| `/chat` | Chat Interface | Local mock messages |
| `/calendar` | Calendar | Static full calendar view |
| `/users` | Users list | Static user rows |
| `/faqs`, `/pricing`, `/landing` | Content pages | Static components |
| `/auth/*` | Auth pages | UI forms (not yet wired to `/api/v1/auth`) |
| `/settings/*` | User/Account/Billing settings | UI forms (not yet wired to `/api/v1/models/app_settings`) |

---

## 4. Existing Technical Debt & Breaking Issues

1. **Pre-existing TypeScript Build Errors in `apps/web`**:
   - `src/app/tasks/components/data-table-row-actions.tsx(25,9)`: Unused `task` identifier failing with `noUnusedLocals: true`.
   - `src/app/tasks/components/data-table-toolbar.tsx(134,31)`: Missing `icon` property typing.
   - `src/components/ui/chart.tsx`: Breaking typing changes in Recharts 3.6.0 where payload properties are typed as `{}` instead of arrays.
2. **Missing Live API Client**:
   - `apps/web` currently does not have an HTTP API client configured to communicate with `http://localhost:3000/api/v1`.
3. **Hardcoded Mock Data**:
   - Tasks, Mail, Chat, and Users read from local JSON files rather than the live Drizzle models or dynamic model endpoints.
4. **Hardcoded Navigation**:
   - `app-sidebar.tsx` contains a static hardcoded array rather than metadata-driven dynamic navigation.

---

## 5. Integration Target & Architectural Scope

1. **Fix Pre-existing Build Failures**: Correct strict TypeScript errors in `tasks` and `chart.tsx` so `apps/web` builds cleanly.
2. **Implement Typed API Client (`/src/lib/api-client.ts`)**: Handling JWT Bearer tokens and `x-api-key`, connecting to `apps/api`.
3. **Establish Metadata-Driven UI Runtime (`/src/ui-runtime/`)**:
   - `Metadata Contracts` (Zod schemas for Resources, Fields, Views, Actions)
   - `ResourceRegistry` & `RendererRegistry`
   - Generic Renderers: `FieldRenderer`, `FormRenderer`, `TableRenderer`, `DetailRenderer`, `KanbanRenderer`
4. **Connect Canonical Resources**:
   - `User`, `Project`, `Task`, `Chat`, `Mail` bound to live Fastify endpoints (`/api/v1/models/*`).
5. **Implement Frontend AI Client & Workspaces (`/src/features/ai/`)**:
   - `AiClient` streaming and executing against `/api/v1/ai/*`
   - ChatGPT-like Chat UI with rich message parts, tool calls, and approval dialogs
   - Codex-like Coding Workspace
   - Browser Workspace
   - Task AI and Mail AI contextual actions
