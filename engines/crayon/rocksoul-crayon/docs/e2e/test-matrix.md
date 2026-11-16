# End-to-End Regression Test Matrix

The original `TC-01`–`TC-40` rows remain `Pending` until their stated API, persistence, protocol, or unit boundary has a dedicated passing test. Browser verification coverage is recorded separately below; `Verified` means the named Playwright test passed against the current checkout and its required API.

| ID | Level | Area | Test Case | Target / Endpoint | Expected Behavior | Status |
|----|-------|------|-----------|-------------------|-------------------|--------|
| TC-01 | L2 | Metadata | Zod Schema Validation | `ResourceDefinitionSchema` | Valid resource passes validation | Pending |
| TC-02 | L2 | Metadata | Malicious Metadata Injection | Zod Parser | Rejects raw JS/JSX injection & eval | Pending |
| TC-03 | L2 | Registry | Resource Registration | `ResourceRegistry` | Register and retrieve resources | Pending |
| TC-04 | L2 | Registry | Renderer Resolution | `RendererRegistry` | Resolve table, kanban, field renderers | Pending |
| TC-05 | L4 | Auth | User Registration | `POST /api/v1/auth/register` | User created with hashed password in DB | Pending |
| TC-06 | L4 | Auth | Duplicate Email Check | `POST /api/v1/auth/register` | Rejects with 400 Bad Request | Pending |
| TC-07 | L4 | Auth | User Login & Token | `POST /api/v1/auth/login` | Returns 7-day session token | Pending |
| TC-08 | L4 | Auth | Authenticated Profile | `GET /api/v1/auth/me` | Returns user info, hides passwordHash | Pending |
| TC-09 | L4 | Auth | Unauthenticated Rejection | `GET /api/v1/ai/agents` | Rejects unauthenticated request with 401 | Pending |
| TC-10 | L4 | Auth | API Key Management | `POST /api/v1/auth/api-keys` | Creates hashed key, grants access | Pending |
| TC-11 | L4 | Project | Create Project API | `POST /api/v1/models/projects` | Row inserted in SQLite `projects` table | Pending |
| TC-12 | L4 | Project | Read Project Detail | `GET /api/v1/models/projects/:id` | Returns exact inserted project row | Pending |
| TC-13 | L4 | Project | Update Project | `PUT /api/v1/models/projects/:id` | Updates status in DB to `active` | Pending |
| TC-14 | L4 | Task | Create Linked Task | `POST /api/v1/models/tasks` | Inserts task with `project_id` foreign key | Pending |
| TC-15 | L4 | Task | Change Task Status | `PUT /api/v1/models/tasks/:id` | Status changes to `in progress` in DB | Pending |
| TC-16 | L4 | Task | List Tasks with Filter | `GET /api/v1/models/tasks` | Returns matching tasks with pagination | Pending |
| TC-17 | L4 | Chat | Create Conversation | `POST /api/v1/models/chat_conversations` | Row in SQLite `chat_conversations` | Pending |
| TC-18 | L4 | Chat | Add Message | `POST /api/v1/models/chat_messages` | Message saved in DB with sender FK | Pending |
| TC-19 | L4 | Mail | Compose & Save Mail | `POST /api/v1/models/mails` | Mail stored in `inbox` folder in DB | Pending |
| TC-20 | L4 | Mail | Move Mail Folder | `PUT /api/v1/models/mails/:id` | Folder updated from `inbox` to `archive` | Pending |
| TC-21 | L3 | UI | TableRenderer Contract | `TableRenderer.tsx` | Formats columns, badges, dates | Pending |
| TC-22 | L3 | UI | KanbanRenderer Contract | `KanbanRenderer.tsx` | Groups cards by status/priority field | Pending |
| TC-23 | L3 | UI | FieldRenderer Formats | `FieldRenderer.tsx` | Formats currency, date, json, tags | Pending |
| TC-24 | L6 | AI | Agent Discovery | `GET /api/v1/ai/agents` | Returns 5 registered agents | Pending |
| TC-25 | L6 | AI | Assistant Chat Execution | `POST /api/v1/ai/chat` | Returns structured response with steps | Pending |
| TC-26 | L6 | AI | Multi-Turn Memory Persistence | LibSQL Memory Provider | Messages recalled across turns in DB | Pending |
| TC-27 | L6 | AI | Safe Tool Execution | `system_info` / `time_now` | Tool called and returns system facts | Pending |
| TC-28 | L6 | AI | Tool Security Policy: ALLOW | Tool Registry | Safe tools pass without approval prompt | Pending |
| TC-29 | L6 | AI | Tool Security Policy: DENY | Tool Registry | Blocked tool execution halted immediately | Pending |
| TC-30 | L6 | AI | Tool Security Policy: ASK_USER | Tool Registry | Generates approval required state | Pending |
| TC-31 | L6 | AI | Coding Workspace Isolation | `@rocksoul/ai-workspace` | Blocks `../` directory traversal attacks | Pending |
| TC-32 | L6 | AI | Coding Diff Generation | `@rocksoul/ai-coding` | Generates valid unified diff patch | Pending |
| TC-33 | L6 | AI | Browser Snapshot Navigation | `@rocksoul/ai-browser` | Session lifecycle and snapshot extract | Pending |
| TC-34 | L6 | AI | Run Cancellation | `POST /api/v1/ai/runs/:id/cancel` | Active run cancelled and status updated | Pending |
| TC-35 | L7 | Security | Cross-Tenant Isolation | Fastify Auth & Scopes | User A denied access to User B records | Pending |
| TC-36 | L7 | Security | SQL Injection Prevention | Drizzle Model Queries | Escapes malicious query parameter strings | Pending |
| TC-37 | L7 | Resilience | Invalid JSON Request | Fastify Sensible Plugin | Returns structured 400 validation error | Pending |
| TC-38 | L7 | Resilience | Database Connection Recovery | LibSQL Client | Re-establishes connection on retry | Pending |
| TC-39 | L7 | Performance | Database Query Latency | SQLite Query Benchmark | Simple SELECT query < 15ms | Pending |
| TC-40 | L7 | Performance | Fastify In-Process Overhead | Fastify Route Benchmark | Health check response < 10ms | Pending |
| TC-41 | L3 | UI / Accessibility | Critical axe gate | `apps/web/tests/e2e/accessibility-smoke.spec.ts` | All listed product routes have no critical violations | Verified (desktop) |
| TC-42 | L3 | UI / Accessibility | Serious + critical axe gate | `apps/web/tests/e2e/accessibility-smoke.spec.ts` | Passing route subset has no serious or critical violations; known contrast-debt routes stay critical-only | Verified (desktop) |
| TC-43 | L3 | UI / Keyboard | Command palette focus restoration | `apps/web/tests/e2e/command-palette-focus.spec.ts` | Escape restores focus to the palette trigger | Verified (desktop) |
| TC-44 | L3 | UI / Keyboard / Mobile | Application sidebar Escape recovery | `apps/web/tests/e2e/verification-hardening.spec.ts` | Mobile sidebar closes with Escape and restores trigger focus | Verified (mobile) |
| TC-45 | L3 | UI / Keyboard / Mobile | Chat drawer Escape recovery | `apps/web/tests/e2e/verification-hardening.spec.ts` | Mobile conversation drawer is announced as a dialog, closes with Escape, and restores trigger focus | Verified (mobile) |
| TC-46 | L3 | UI / Keyboard | Mail compose focus restoration | `apps/web/tests/e2e/verification-hardening.spec.ts` | Dismissing inline compose restores focus to Compose | Verified (desktop) |
| TC-47 | L3 | UI / Resilience | Mail initial-load failure and retry | `apps/web/tests/e2e/verification-hardening.spec.ts` | Service failure is announced and Retry recovers the empty state | Verified (desktop) |
| TC-48 | L3 | UI / Resilience | Chat initial-load failure | `apps/web/tests/e2e/verification-hardening.spec.ts` | Service failure renders a Chat unavailable alert with actionable messaging | Verified (desktop) |
| TC-49 | L4/L7 | Operational ORM | Resource/case/review/publication workflow | `tests/e2e/05-operational-orm.test.ts` | Rejects unauthenticated calls, duplicate canonical refs, invalid transitions, and unapproved publication; persists approved publication request | Verified (in-process SQLite) |
