# End-to-End System Architecture Under Test

## 1. System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│ FRONTEND RUNTIME (apps/web)                                            │
│                                                                        │
│   Vite 7 + React 19 + Tailwind CSS 4 + shadcn/ui                       │
│   │                                                                    │
│   ├── Resource Registry ──> Resource Definitions (Task, Project, User) │
│   ├── Renderer Registry ──> TableRenderer, KanbanRenderer, FieldRenderer│
│   └── AI Feature Module ──> ChatShell, CodingWorkspace, BrowserWorkspace│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Typed API Client (api-client.ts)
                                     │ Dual-Auth: Bearer JWT / x-api-key
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BACKEND API (apps/api - Fastify 5)                                     │
│                                                                        │
│   Plugins: sensible, cors, swagger, auth, logger-db, db (Drizzle)      │
│   │                                                                    │
│   ├── /api/v1/auth   ──> Register, Login, Me, API Key management       │
│   ├── /api/v1/models ──> Dynamic CRUD on 22 registered Drizzle models  │
│   └── /api/v1/ai     ──> Agents, Chat, Runs, Cancel, Tool approvals    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Drizzle ORM Queries            │ ExecutionContext
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│ CANONICAL DATABASE                   │ │ MODULAR AI ENGINE             │
│ (LibSQL SQLite: ./data/sqlite.db)    │ │ (@rocksoul/ai-base)           │
│                                      │ │                               │
│ - users, orgs, user_sessions         │ │ - Orchestrator (Intent Router)│
│ - projects, project_tasks            │ │ - Agents (Assistant, Coder..) │
│ - tasks                              │ │ - Tools (Safe tools + Guard)  │
│ - chat_conversations, messages       │ │ - Isolated Storage (ai.db)   │
│ - mails                              │ │ - Sandboxed Workspace & Patch │
│ - calendars, faqs, landing, pricing  │ │ - Browser Automation Facade   │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Request & Mutation Lifecycle

### Domain Resource Mutation Flow
1. **User Action**: User updates a task status on the UI (e.g. from `todo` to `in progress`).
2. **API Client**: `api.models.update('tasks', taskId, { status: 'in progress' })` executes HTTP `PUT /api/v1/models/tasks/:id`.
3. **Authentication**: Fastify `authenticate` hook validates the Bearer token or `x-api-key`.
4. **Service & Drizzle**: Fastify maps to `ModelCrud.update()` in `@rocksoul/orm`, issuing SQL update to SQLite table `tasks`.
5. **DB Persistence**: LibSQL transaction commits change to disk.
6. **API Response**: Fastify returns `{ success: true, data: { ...updatedTask } }`.
7. **UI Synchronization**: React state updates without page reload.

### AI Execution Flow
1. **User Prompt**: User triggers task planning or code generation in `ChatShell`.
2. **AI Client**: `api.ai.chat({ prompt, projectId, agentId: 'coder' })` executes HTTP `POST /api/v1/ai/chat`.
3. **Context Injection**: Fastify populates `ExecutionContext` with `userId`, `orgId`, `projectId`, and permissions.
4. **AI Agent**: Rocksoul orchestrator routes request to `CoderAgent` or `AssistantAgent`.
5. **Tool Execution**: If safe tool (`system_info`), executed immediately. If dangerous, policy evaluates `ALLOW`/`DENY`/`ASK_USER`.
6. **Thread Storage**: Message exchanges persisted in isolated `./data/ai.db`.
7. **Response & Events**: Structured run result returned to frontend.
