# AEP Application API

The application facade is the preferred UI boundary for semantic operations.
Feature code uses resources and capabilities; it does not construct URLs,
HTTP methods, frames, stream IDs, or transport-specific clients.

```ts
const app = createAppClient({
  runtime,
  models: compatibilityModelClient,
  nativeResources: {
    projects: createAepResourceAdapter(runtime, 'projects'),
  },
});

const projects = await app.projects.list({ search: 'rocksoul' });
const project = await app.projects.get(projectId);
await app.projects.update(projectId, { name: 'Rocksoul' });

const execution = await app.execute('ai.chat', {
  prompt: 'Analyze this project',
});
execution.watch(event => renderEvent(event));
const answer = await execution.result();
```

## Adapter policy

`nativeResources` is preferred per resource. If a resource has no native AEP
adapter, the same facade can use the compatibility `models` adapter. This is
a migration mechanism, not a second application API. The server remains the
authorization authority in both modes.

Current native resource capabilities:

```text
projects.list/get/create/update/delete
tasks.list/get/create/update/delete
```

The SDK also provides `app.batch(...)`, dependency-aware `app.graph(...)`,
automatic idempotency keys for mutations, bounded retry policies, application
cursors, and a redacted `runtime.inspect()` view for diagnostics. These are
client-side ergonomics over the existing AEP primitives; they do not add new
wire frame types.

## DX benchmark

Run the deterministic facade-overhead benchmark with:

```text
pnpm --dir packages/sdk benchmark:dx
```

The benchmark compares a direct model adapter call with the same call through
the application resource facade and a two-operation batch. Each case reports
total elapsed time plus p50, p95, and p99 per-operation samples. It measures
local SDK overhead only; it is not a latency or throughput claim for
WebSocket, WebTransport, the gateway, or a database. Results are machine- and
load-dependent, so use the command output as the authoritative run record.

The capability gateway validates the resource action independently. For the
current policy, regular users may read, create, and update projects/tasks;
delete remains administrator-only.

## Execution rule

Long-running and streaming work uses `execute()`. A successful execution is
observed through normalized SDK execution events and completed through
`execution.result()`. Cancellation uses `execution.cancel()`. Feature code
must not inspect AEP frames or transport state.

## Migration rule

Migrate one domain at a time. Keep the compatibility adapter behind
`createAppClient` until the corresponding native capability has server-side
authorization, persistence, duplicate-mutation, failure, and restart tests.
