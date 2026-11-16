# ADR-002: AI Client Boundary and Legacy Runtime Isolation

> Historical decision record. The active implementation uses the Rocksoul AI Runtime; legacy provider/framework names below describe the state at decision time.

## Status
ACCEPTED

## Context
The AI subsystem is powered by Mastra agents (`assistant`, `coder`, `researcher`, `browser`, `supervisor`) operating on the Fastify backend and SQLite database. Direct browser imports of `@mastra/core`, `@mastra/memory`, or `@mastra/server` are strictly prohibited to prevent bundle bloat, Node.js API runtime crashes in the browser, and security vulnerabilities.

## Decision
We established a strict frontend AI boundary in `apps/web/src/features/ai/`:
1. **No Mastra Imports**: The browser never imports any `@mastra/*` packages.
2. **AI Client API Boundary**: A lightweight HTTP and SSE client (`apps/web/src/features/ai/client.ts`) communicates exclusively with Fastify endpoints (`/api/v1/ai/*`).
3. **Discriminated Union Parts**: Messages in the frontend represent rich structures (`text`, `code`, `tool_call`, `artifact`, `approval`, `status`) without coupling to backend agent internal types.
4. **Agent Surfaces**: Dedicated workspace components (`ChatShell`, `CodingWorkspace`, `BrowserWorkspace`) interact through standard React hooks (`useAiChat`).

## Consequences
- **Positive**: Zero leaking of backend keys, internal agent state, or heavy server dependencies into the client bundle.
- **Positive**: Frontend remains a pure static Single Page Application that can be deployed anywhere and hot-reloaded with Vite in milliseconds.
- **Negative**: Streaming events from backend agents must follow the SSE protocol defined on the Fastify route.
