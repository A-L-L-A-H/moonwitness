# Repository Audit & Reconnaissance

**Project**: Rocksoul Monorepo  
**Audit Date**: September 2026  
**Auditor**: Senior Software Architect & Integration Engineer  
**Status**: COMPLETED

---

## 1. Repository Structure

The repository is a monorepo managed with `pnpm` workspaces:

```text
rocksoul/
├── apps/
│   └── api/                  # Fastify v5 REST backend
├── data/
│   └── sqlite.db             # Application SQLite database
├── packages/
│   ├── common/               # Shared API response helpers, error wrappers
│   ├── orm-base/             # Base schema (users, auth, sessions, api_keys, logs, configs)
│   ├── orm-project/          # Project schema & models
│   ├── orm-task/             # Tasks & subtasks schema
│   ├── orm-calendar/         # Calendar events & schedules
│   ├── orm-chat/             # Chat channels, messages, threads
│   ├── orm-faq/              # FAQs & categories
│   ├── orm-landing/          # Landing sections, features, CTAs
│   ├── orm-mail/             # Mail messages & folders
│   ├── orm-services/         # Service tiers, pricing, features
│   ├── orm/                  # Aggregation & Drizzle Client (LibSQL / SQLite)
│   └── tsconfig/             # Shared TypeScript configuration
├── package.json              # Root scripts & devDependencies
├── pnpm-workspace.yaml       # Workspace configuration (apps/*, packages/*)
├── docker-compose.yml        # Multi-stage production container setup
└── Dockerfile                # Production Alpine Dockerfile
```

---

## 2. Package Manager & Runtime

- **Node Version**: `v26.5.0`
- **Package Manager**: `pnpm@11.17.0`
- **TypeScript**: `^5.8.2` (Target ES2022, NodeNext resolution, strict mode enabled)
- **Module Format**: Pure ESM (`"type": "module"` across all packages)

---

## 3. Backend Architecture

- **Framework**: Fastify `v5.2.1` (`apps/api`)
- **Plugin Architecture**: Modular `fastify-plugin` registrations:
  - `@fastify/sensible` (HTTP utilities)
  - `@fastify/cors` (Cross-origin handling)
  - `@fastify/swagger` & `@fastify/swagger-ui` (OpenAPI documentation at `/documentation`)
  - `registerDb` (decorates `app.db` with Drizzle LibSQL client)
  - `registerDbLogger` (interceptor writing API execution logs to `app_logs` table)
  - `registerAuth` (decorates `app.authenticate` with dual-mode API Key & Bearer session token verification)
- **Routing Structure**: Prefix-based routes under `/api/v1/*`:
  - `/health` -> Service health check
  - `/api/v1/auth/*` -> Login, registration, session management, API Key generation
  - `/api/v1/models/*` -> Dynamic ORM schema reflection and autotable / autocrud / automenu
- **Server Lifecycle**: Centralized builder in `apps/api/src/app.ts` (`buildApp()`), started via `apps/api/src/index.ts`.

---

## 4. Database & ORM

- **Engine**: SQLite / LibSQL (`@libsql/client@^0.14.0`)
- **Storage Location**: `./data/sqlite.db`
- **ORM**: Drizzle ORM (`drizzle-orm@^0.40.0`, `drizzle-kit@^0.30.5`)
- **Schema Separation**: Decentralized schema modules (`orm-base`, `orm-project`, `orm-task`, etc.) aggregated into `@rocksoul/orm`.
- **Database Ownership**: Application database owns all business entities (22 tables including `users`, `user_sessions`, `api_keys`, `projects`, `tasks`, etc.).
- **Rule**: Application database must NOT be polluted with internal AI/Mastra tables. Mastra storage is strictly isolated to `./data/mastra.db`.

---

## 5. Authentication & Context

- **Current State**: Dual-mode authentication implemented in `apps/api/src/plugins/auth.ts`:
  1. Header `x-api-key`: Looked up against `api_keys` table with SHA-256 hash.
  2. Header `Authorization: Bearer <token>`: Looked up against `user_sessions` table with SHA-256 hash.
- **Request Context Decoration**:
  - `request.user`: Full user record (`id`, `email`, `role`, `organizationId`, `permissions`, `isActive`).
  - `request.apiKey`: Active API key metadata (`id`, `keyHash`, `userId`, `scopes`, `rateLimit`).
  - `request.session`: Active session metadata (`id`, `userId`, `expiresAt`).
- **AI Integration Bridge**: Request context will be cleanly converted to `ExecutionContext` for all AI agent runs:
  ```typescript
  {
    requestId: request.id,
    userId: request.user?.id,
    organizationId: request.user?.organizationId,
    permissions: request.user?.permissions,
    metadata: { source: 'fastify-api', role: request.user?.role }
  }
  ```

---

## 6. Configuration Management

- **Config File**: `apps/api/src/config/env.ts` validated using `zod` (`^3.24.2`).
- **Environment Source**: Dotenv loading `.env`.
- **Planned AI Variables**:
  - `OPENAI_API_KEY` (optional)
  - `ANTHROPIC_API_KEY` (optional)
  - `GEMINI_API_KEY` (optional)
  - `MASTRA_STORAGE_PATH` (default: `./data/mastra.db`)

---

## 7. Logging & Observability

- **API Logger**: Fastify default Pino logger with console pretty-printing in development.
- **Persistent Logger**: `apps/api/src/plugins/logger-db.ts` captures API request/response logs and asynchronously writes to `app_logs` table.
- **AI Observability Plan**: Pino adapter in `@rocksoul/ai-observability` streaming agent lifecycle events, tool executions, and LLM completions.

---

## 8. Testing & Build System

- **Compiler**: `tsc` emitting declarations and ES2022 JavaScript into `dist/`.
- **Dev Runner**: `tsx watch` for hot-reloading.
- **Docker**: Multi-stage build leveraging Alpine Linux and `pnpm deploy --prod`.

---

## 9. Existing AI-Related Packages

- Currently **none**. The AI subsystem will be introduced cleanly into `packages/ai/*` as a set of 12 modular packages.

---

## 10. Integration Points

1. **Workspace**: `pnpm-workspace.yaml` updated to include `'packages/ai/*'`.
2. **Composition Root**: `@rocksoul/ai-base` holds the singleton Mastra instance.
3. **HTTP API**: `apps/api/src/routes/v1/ai.ts` mounted under `/api/v1/ai` in `apps/api/src/app.ts`.
4. **Auth Decorator**: Pre-handler `app.authenticate` protects AI endpoints and supplies `ExecutionContext`.
5. **Storage**: Separate `./data/mastra.db` initialized through `@rocksoul/ai-memory`.

---

## 11. Risks & Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Node 26 native addon compilation** | High (e.g. `better-sqlite3` build failures) | Use pure JS/LibSQL or Mastra LibSQL/sqlite adapter without native C++ compilation. |
| **Database table collision** | High (schema pollution) | Enforce separate storage files: `./data/sqlite.db` (app) vs `./data/mastra.db` (Mastra). |
| **Circular dependencies between AI packages** | Medium | Establish strict DAG: `ai-core` has zero internal deps; `ai-base` is the leaf aggregator. |
| **Missing LLM API keys in local development** | Low | Implement a robust mock/fallback provider in `assistantAgent` so endpoints always return valid responses. |
| **Workspace filesystem escaping** | High (security risk) | Restrict `@rocksoul/ai-workspace` to authorized project root paths only with policy guardrails. |
# Historical pre-migration audit

The Mastra references in this document describe the pre-migration state only. The active architecture is documented in `architecture.md` and `adr-rocksoul-ai-runtime.md`.
