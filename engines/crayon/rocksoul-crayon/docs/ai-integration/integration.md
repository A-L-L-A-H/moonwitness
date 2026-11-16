# Fastify Backend & Auth Integration

**Status**: INTEGRATED & VERIFIED  
**Endpoint Prefix**: `/api/v1/ai`

---

## 1. Fastify Lifecycle Binding

The AI routes are registered inside `apps/api/src/app.ts` using the existing Fastify plugin pattern:

```typescript
// apps/api/src/app.ts
import { aiRoutes } from './routes/v1/ai.js';

// ... plugins registered ...
await app.register(healthRoutes);
await app.register(authRoutes, { prefix: '/api/v1/auth' });
await app.register(modelRoutes, { prefix: '/api/v1/models' });
await app.register(aiRoutes, { prefix: '/api/v1/ai' });
```

No new server, port, or process is started. AI requests run inside the standard Fastify event loop. AEP `ai.chat` carries the canonical `executionId`, cancellation signal, and idempotency key into the AI runtime.

---

## 2. Authentication & ExecutionContext Mapping

All AI endpoints enforce the existing dual-mode authentication via `app.addHook('preHandler', app.authenticate)`.

When an incoming request is authenticated (via `x-api-key` header or `Authorization: Bearer <token>`), Fastify decorates `request.user` and `request.apiKey`. The AI route handler maps this directly into `ExecutionContext`:

```typescript
const context: ExecutionContext = {
  requestId: request.id,
  userId: request.user?.id || null,
  organizationId: request.user?.orgId || null,
  projectId: body.projectId || null,
  repositoryId: body.repositoryId || null,
  workspaceId: body.workspaceId || null,
  permissions: request.apiKey?.scopes ? JSON.parse(request.apiKey.scopes) : [],
  metadata: {
    source: 'fastify-api',
    userRole: request.user?.role,
    apiKeyId: request.apiKey?.id,
    ...body.metadata,
  },
};
```

---

## 3. Endpoints Implemented

| Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/agents` | Lists available agents and their readiness status | Yes (`x-api-key` or Bearer) |
| `POST` | `/api/v1/ai/chat` | Executes conversational or task prompt | Yes |
| `POST` | `/api/v1/ai/runs` | Initiates an asynchronous or tracked AI run | Yes |
| `GET` | `/api/v1/ai/runs/:id` | Returns run details and step trace | Yes |
| `POST` | `/api/v1/ai/runs/:id/cancel`| Cancels an active or pending run | Yes |
