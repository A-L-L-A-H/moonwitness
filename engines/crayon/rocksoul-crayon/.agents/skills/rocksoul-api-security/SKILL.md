---
name: rocksoul-api-security
description: Secure operational guidance for @rocksoul/api, Fastify plugins/routes, authentication, authorization, CORS, Swagger, WebSocket entrypoints, environment configuration, and server error boundaries.
metadata:
  scope: apps/api
  version: 1.0.0
  repository_architecture: Fastify API with workspace services
---

# Rocksoul API and Security

Load for changes under `apps/api/src`, API tests, route plugins, auth, authorization, environment configuration, CORS, Swagger, views that expose server data, or API/WebSocket entrypoints.

## Boundary rules

- Read `docs/security/authorization.md`, the relevant `docs/ai-integration/security.md`, API docs, and the owning route/plugin before changing behavior.
- Keep request parsing, authentication, authorization, service invocation, and response serialization as separate stages. Authentication proves identity; authorization proves permission.
- Validate untrusted params, query, body, headers, cookies, WebSocket messages, and environment values at the boundary with the repository's schema conventions.
- Routes delegate to canonical services/ORM APIs; do not duplicate business rules or issue ad-hoc database queries from transport handlers.
- Preserve safe CORS, cookie, token, origin, rate, and error behavior. Never expose stack traces, secrets, SQL, internal paths, or provider diagnostics.
- Treat WebSocket upgrades and messages as authenticated, authorized, bounded, and observable; a successful upgrade is not authorization for every operation.
- Never hardcode credentials. Do not expose `SEC-DEBT-001` or any server secret to browser code, logs, fixtures, or documentation.

## Verification

For every security-sensitive change, test authorized, unauthenticated, unauthorized, malformed, expired, replayed, and cross-origin cases as applicable. Assert status, sanitized body, side effects, and audit behavior. Run the narrow API test first, then build/typecheck and relevant E2E tests. A security bug requires a regression test.

Report the trust boundary, authority source, threat cases, tests run, and residual risk. Stop when authorization ownership or canonical service behavior is unclear.
