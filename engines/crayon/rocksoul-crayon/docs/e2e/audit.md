# Comprehensive E2E System & Test Audit

## 1. Executive Overview

This audit establishes the baseline for the entire full-stack application under test:
- **Frontend**: Vite 7.3.6 + React 19.2 + Tailwind CSS v4 + shadcn/ui (`apps/web`).
- **UI Runtime**: Zod-based Metadata Engine (`apps/web/src/ui-runtime/`).
- **API Client**: Typed REST + SSE Client (`apps/web/src/lib/api-client.ts`).
- **Backend API**: Fastify 5.2.1 (`apps/api`) with plugins (CORS, Sensible, Swagger, Auth, DB Logger).
- **ORM & Database**: Drizzle ORM 0.45.2 + LibSQL SQLite on 22 modular tables (`packages/orm*`).
- **AI Subsystem**: Rocksoul AI Runtime with isolated LibSQL memory (`packages/ai/*`).

---

## 2. Component Audits

### 2.1 Frontend (`apps/web`)
- **Status**: Production build verified (`tsc -b && vite build` in ~11s, 0 errors).
- **Linting**: ESLint flat config passing (0 errors, 50 warnings).
- **Routes**:
  - Existing: `/`, `/dashboard`, `/tasks`, `/users`, `/chat`, `/mail`, `/calendar`, `/pricing`, `/faqs`.
  - Added / Integrated: `/projects`, `/ai/chat`, `/ai/coding`, `/ai/browser`.
- **UI Runtime Integration**:
  - `TaskPage`: Uses `DataTable` (Table tab), `KanbanRenderer` (Kanban tab), and `ChatShell` (AI Task Planner tab). Fetches live data from `api.models.list('tasks')`.
  - `ProjectsPage`: Uses `TableRenderer` bound to `projectResource`. Fetches live data from `api.models.list('projects')`.

### 2.2 Backend (`apps/api`)
- **Status**: Running in Docker container `rocksoul_fastify_api` on port 3000.
- **Health Check**: `GET /health` responding with 200 OK.
- **Model Endpoints** (`/api/v1/models`):
  - Model registry introspection: `GET /`
  - Auto menu hierarchy: `GET /menu`
  - Model metadata: `GET /:model/metadata`
  - Dynamic CRUD: `GET /:model`, `GET /:model/:id`, `POST /:model`, `PUT /:model/:id`, `DELETE /:model/:id`.
- **Authentication Endpoints** (`/api/v1/auth`):
  - `POST /register`, `POST /login`, `GET /me`, `POST /api-keys`, `GET /api-keys`, `DELETE /api-keys/:id`.
  - Token formats: Bearer Session Token (7-day TTL) and `x-api-key`.
- **AI Endpoints** (`/api/v1/ai`):
  - `GET /agents`: Lists all 5 agents (`assistant`, `coder`, `researcher`, `browser`, `supervisor`).
  - `POST /chat`: Context-aware agent chat execution.
  - `POST /runs`, `GET /runs/:id`, `POST /runs/:id/cancel`.

### 2.3 Database & ORM
- **Canonical Database**: `./data/sqlite.db` (LibSQL).
- **Schema Separation**: 22 tables defined across 10 modular ORM packages:
  - `orm-base`: `organizations`, `users`, `app_settings`, `api_keys`, `user_sessions`, `system_logs`.
  - `orm-project`: `projects`, `project_tasks`.
  - `orm-task`: `tasks`.
  - `orm-chat`: `chat_conversations`, `chat_participants`, `chat_messages`.
  - `orm-mail`: `mails`.
  - `orm-calendar`: `calendars`, `calendar_events`.
  - `orm-faq`: `faq_categories`, `faqs`.
  - `orm-landing`: `landing_testimonials`, `landing_leads`, `landing_features`.
  - `orm-services`: `pricing_plans`, `pricing_features`.
- **Test Database Isolation**:
  - Production/Dev database: `./data/sqlite.db`.
  - Isolated test database: `./data/test.db`.
  - Isolated AI memory: `./data/test_ai.db`.

### 2.4 AI Engine (`packages/ai/*`)
  - **Isolation**: AI providers never imported in browser bundle.
- **Memory**: Isolated SQLite storage via `@rocksoul/ai-memory`.
- **Workspace**: Sandboxed filesystem in `@rocksoul/ai-workspace` prevents path traversal.
- **Policies**: Safe tools (`system_info`, `time_now`, `calculator`) set to `ALLOW`; destructive operations require `ASK_USER` or `DENY`.

---

## 3. Existing Test Infrastructure & Gaps

### What Exists:
- Unit test verification in `apps/api/src/test-ai.ts` testing in-process Fastify injection with basic AI chat.
- TypeScript compiler build scripts across all 25 packages.
- ESLint configuration in `apps/web`.

### Missing Coverage (Addressed in this E2E Suite):
1. **L2 Contract Tests**: Validation of Zod metadata contracts and rejection of malicious executable code in metadata.
2. **L3/L4 Domain API E2E**: Physical SQLite table verification following API mutations (User, Project, Task, Chat, Mail).
3. **L5 UI Runtime**: Metadata rendering and UI integration verification.
4. **L6 AI E2E**: Multi-turn conversation memory persistence, agent routing, tool guardrails, and cancellation.
5. **L7 Full System**: Cross-tenant authorization boundaries, error recovery, and performance latency baselines.

### 3.1 Browser verification status (2026-09-08)

- `apps/web/tests/e2e/accessibility-smoke.spec.ts` applies a critical axe gate to every listed product route. It applies the stricter serious+critical gate to every route currently passing that gate.
- `/auth/sign-in`, `/auth/sign-up`, and `/projects` currently remain critical-only because axe reports serious `color-contrast` violations there. The exclusions are explicit in the test and tracked in `docs/e2e/failures.md`.
- `apps/web/tests/e2e/verification-hardening.spec.ts` covers mail compose focus restoration, mobile application-sidebar Escape recovery, mobile chat-drawer Escape recovery, and mail/chat initial-load failure states.
- The browser project matrix still includes desktop, mobile, Firefox, and WebKit. This verification pass ran the new hardening tests on desktop/mobile and the axe gate on desktop; Firefox/WebKit evidence remains outstanding.

---

## 4. Risk Areas & Mitigation Strategy
- **Risk 1: Database Pollution**: Running tests on `./data/sqlite.db` could alter demo records.
  - *Mitigation*: Environment-isolated `DATABASE_URL=file:./data/test.db` and teardown hooks.
- **Risk 2: AI Nondeterminism**: LLMs can return variable natural language.
  - *Mitigation*: Assert structured schemas, tool invocation names, and semantic markers rather than exact string equality.
- **Risk 3: Fastify Port Collisions**:
  - *Mitigation*: Test runner uses in-process `app.inject()` and ephemeral testing ports.
# Historical pre-migration audit

Legacy terminology below is retained as audit evidence; it is not an active runtime authority.
