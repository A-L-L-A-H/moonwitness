---
name: rocksoul-web-runtime
description: Operational guidance for the Rocksoul Vite/React web application, UI runtime, metadata runtime, resources, workflow runtime, themes, and client SDK boundary.
metadata:
  scope: apps/web
  version: 1.0.0
  repository_architecture: Vite React application using @rocksoul/sdk
---

# Rocksoul Web Runtime

Load this skill for changes under `apps/web/src`, especially `ui-runtime`, `metadata-runtime`, `workflow-runtime`, resources, AI screens, routing, themes, API clients, or SDK integration.

## Application boundaries

- Inspect the relevant document in `docs/ui/`, `docs/web-ai-integration/`, and the owning resource/contract before changing a runtime behavior.
- Keep network communication behind `@rocksoul/sdk` and its approved runtime boundary. Do not add feature-specific WebSocket, WebTransport, fetch, Axios, XHR, EventSource, or REST wrappers in components or hooks.
- Keep UI rendering separate from transport, persistence, authorization, and domain mutation. Components consume typed contracts and state; they do not reimplement server rules.
- Preserve metadata-driven rendering and resource contracts. Do not duplicate user/task/project/mail schemas in unrelated components.
- Keep loading, empty, error, reconnect, and permission states explicit. Do not treat optimistic UI state as authoritative server state.
- Preserve keyboard accessibility, responsive behavior, theme compatibility, and existing shadcn/Radix conventions when editing UI.

## Safe change loop

`INSPECT ROUTE/CONTRACT → TRACE DATA SOURCE → CHECK SDK BOUNDARY → IMPLEMENT → TYPECHECK/LINT → VERIFY UI STATES → DOCUMENT`

When changing a resource or metadata contract, inspect all consumers and update the corresponding docs/decision record if semantics change. Avoid broad rewrites of generated or shared UI primitives for a feature-local issue.

For runtime changes, test the smallest affected surface first, then run the web build/typecheck and relevant E2E coverage. A bug fix requires a deterministic regression test where practical.

Never place credentials or server-only configuration in the browser bundle. Never bypass authorization because a UI control is hidden; the server remains authoritative.
