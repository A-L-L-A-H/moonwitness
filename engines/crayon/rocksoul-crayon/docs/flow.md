# Rocksoul Flow

`@rocksoul/flow` owns user-authored automation definitions in `flow.db`. It does not own application execution state: API `execution_records` remains the canonical lifecycle ledger for every `flow.*` AEP operation.

The browser reaches Flow only through `@rocksoul/sdk` and the API AEP gateway. API calls the internal Flow Fastify service with `FLOW_INTERNAL_API_KEY`; Flow is not a browser administration endpoint.

## Definition and lifecycle

Draft graph data is stored on `flows`. Publishing validates the graph and creates an immutable `flow_versions` snapshot. Execution links and node traces are observability projections, not a second status machine.

Supported node types are manual, schedule, webhook, HTTP, condition, transform, Rocksoul capability, AI agent, and WhatsApp. Graphs must be acyclic and bounded. Transform values use JSON templates with `{{$.path}}` substitutions; code execution, shell access, dynamic modules, loops, and durable waits are prohibited.

HTTP nodes reject localhost/IP targets and non-HTTPS targets unless explicitly allowlisted through `FLOW_HTTP_ALLOWED_HOSTS`. Responses, timeouts, graph size, and trace payloads are bounded.

## Adding a node

Add metadata in `packages/flow/src/registry.ts`, validate its declarative configuration, and implement it in `runtime.ts`. Never place secrets in node data or import provider internals into Flow. External effects must use a stable `${executionId}:${nodeId}` idempotency identity through an authorized API adapter.

`apps/web/src/workflow-runtime` remains the resource/Kanban UI runtime; `@rocksoul/ai-workflows` remains the AI-specific deterministic workflow runtime.
