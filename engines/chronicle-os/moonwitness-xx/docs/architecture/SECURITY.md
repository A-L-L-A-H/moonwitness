# Security Baseline

## Identity and access

- Authentication and authorization are server-owned.
- Prefer secure, HttpOnly, SameSite cookies for browser sessions.
- Enforce authorization in use cases, not only by hiding UI controls.
- Permissions are stable scopes and fail closed.
- Never trust actor, tenant, role, or permission supplied in request bodies.

## API

- Validate all input with centralized schemas.
- Use response schemas to avoid accidental field leakage.
- Apply request size limits, CORS allowlists, rate limits, security headers, and request IDs.
- Trust proxy headers only behind a configured trusted proxy chain.
- Redact authorization, cookies, passwords, tokens, QR, session, and message data from logs.
- Never return stack traces or raw provider errors.

## Database

- Use a restricted application DB role.
- Production schema changes only through reviewed migrations.
- Use transactions and a transactional outbox for external side effects.
- Audit security-sensitive changes; audit records are append-only at application level.
- Encrypt integration credentials at rest.

## Jobs and add-ons

- Validate job payloads against versioned contracts.
- Treat jobs as at-least-once and make processors idempotent.
- Do not put secrets or full message bodies into Redis payloads.
- Workers use bounded concurrency and graceful shutdown.
- Add-ons receive explicit capabilities.
- Lifecycle changes are audited and dependency-aware.

## Secrets

- Local .env files are gitignored.
- Production secrets come from deployment secret managers.
- Secret rotation must not require a code change.
- Never commit WhatsApp session files or cryptographic key material.
