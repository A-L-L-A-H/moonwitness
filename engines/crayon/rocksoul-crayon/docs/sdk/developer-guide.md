# Rocksoul Application SDK developer guide

Use the application facade as the feature boundary:

```ts
import { createAppClient } from '@rocksoul/sdk';

const app = createAppClient({ models: compatibilityModels, runtime });
const page = await app.projects.list({ search: 'rocksoul' });
const execution = await app.ai.chat({ prompt: 'Summarize this project' });
const answer = await execution.result();
```

The facade keeps resource state, capabilities, executions, events, and
transport policy separate. A compatibility model adapter may remain during
migration, but feature code should not construct URLs, inspect frames, or
branch on WebSocket/WebTransport.

Mutations receive an idempotency key automatically. Supply one explicitly only
when a business operation needs deterministic deduplication. Use `batch` for
independent operations and `graph` for a small explicit dependency graph;
neither provides transactional rollback.

Resource updates may pass `{ expectedVersion }`. The value is an opaque server
version token (currently the record's `updatedAt`); stale writes fail with a
structured `CONFLICT` instead of overwriting a newer record. Reads remain
backward-compatible for callers that do not provide the token.

## Migration order

1. Put the app client in one shared module.
2. Migrate reads first through typed resources.
3. Migrate mutations after server capability authorization and idempotency
   tests exist.
4. Add watches only when the resource has authoritative server events and a
   snapshot path for cursor gaps.
5. Keep REST/HTTP as the compatibility adapter until the native path is
   verified for that resource.

The server remains the authorization and event authority. Client capability
discovery is informational and never grants access.
