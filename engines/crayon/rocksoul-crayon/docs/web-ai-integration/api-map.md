# Canonical API Surface & Resource Map

**Status**: MAPPED & VALIDATED  
**Backend Host**: `http://localhost:3000`  
**API Version**: `/api/v1`

---

## 1. Authentication & Session Endpoints

| Method | Route | Description | Request Body | Auth Type |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue session token | `{ email, password }` | Public |
| `POST` | `/api/v1/auth/register` | Register new user account | `{ email, password, name, orgId? }` | Public |
| `POST` | `/api/v1/auth/logout` | Revoke active session token | None | Bearer |
| `GET` | `/api/v1/auth/me` | Fetch active user profile & permissions | None | Dual (Bearer / `x-api-key`) |
| `POST` | `/api/v1/auth/keys` | Generate new developer API Key | `{ name, scopes?, expiresAt? }` | Bearer (Admin) |
| `GET` | `/api/v1/auth/keys` | List API Keys | None | Bearer (Admin) |
| `DELETE` | `/api/v1/auth/keys/:id` | Revoke an API Key | None | Bearer (Admin) |

---

## 2. Canonical Business Resources (Dynamic Model CRUD)

The Fastify backend provides generic model reflection and CRUD under `/api/v1/models/:model`:

### A. Core Endpoints
- **List / Search**: `GET /api/v1/models/:model?page=1&limit=20&search=...&order=...&direction=asc|desc`
- **Read by ID**: `GET /api/v1/models/:model/:id`
- **Create**: `POST /api/v1/models/:model`
- **Update**: `PUT /api/v1/models/:model/:id` or `PATCH /api/v1/models/:model/:id`
- **Delete**: `DELETE /api/v1/models/:model/:id`
- **Metadata**: `GET /api/v1/models/:model/metadata`
- **Navigation Menu**: `GET /api/v1/models/menu`

### B. Canonical Resource Models

| Domain Resource | Backend Model Key | Underlying Drizzle Table | Key Fields |
| :--- | :--- | :--- | :--- |
| **User** | `users` | `users` | `id`, `name`, `email`, `role`, `status`, `plan`, `orgId`, `avatar` |
| **Project** | `projects` | `projects` | `id`, `name`, `code`, `description`, `status`, `priority`, `ownerId`, `orgId` |
| **Task** | `tasks` | `tasks` | `id`, `title`, `description`, `status`, `priority`, `projectId`, `assigneeId`, `dueDate` |
| **Chat** | `chat_messages` | `chat_messages` | `id`, `conversationId`, `senderId`, `senderName`, `content`, `createdAt` |
| **Chat Threads** | `chat_conversations` | `chat_conversations` | `id`, `title`, `type`, `projectId`, `lastMessage` |
| **Mail** | `mailbox_messages` | `mailbox_messages` | `id`, `threadId`, `senderEmail`, `recipientEmails`, `subject`, `bodyText`, `isRead` |

---

## 3. AI Capability Endpoints

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/agents` | List registered AI agents and readiness status | Yes |
| `POST` | `/api/v1/ai/chat` | Send prompt to AI engine (Assistant/Orchestrator) | Yes |
| `POST` | `/api/v1/ai/runs` | Initiate asynchronous AI execution run | Yes |
| `GET` | `/api/v1/ai/runs/:id` | Get details and step trace of run | Yes |
| `POST` | `/api/v1/ai/runs/:id/cancel` | Cancel an active run | Yes |

---

## 4. Query, Filter, & Pagination Standards

All list requests to `/api/v1/models/:model` conform to:
```typescript
interface ListQuery {
  page?: number;        // 1-indexed (default: 1)
  limit?: number;       // page size (default: 20)
  search?: string;      // search against searchableFields
  order?: string;       // column name to sort by
  direction?: 'asc' | 'desc';
  [filterField: string]: unknown; // exact match filter
}
```

Response format from `@rocksoul/common`:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}
```
