# Master Hub Security and Privacy Model

**Status:** PROPOSED baseline; must be reviewed before production.

## Assets

- Master documentation and unpublished decisions.
- Knowledge sources, extracted chunks, embeddings, and attachments.
- Tasks, agent plans, execution artifacts, and comments.
- Machine credentials, user sessions, model/provider credentials.
- Approval records and audit history.

## Trust boundaries

1. Browser/client to web/API.
2. Remote MCP client to MCP endpoint.
3. AI model/provider to domain services.
4. Ingestion pipeline to source content.
5. Vercel runtime to database/object storage.
6. Repository provider webhooks to sync jobs.

## Principal threats

- Unauthorized disclosure of private knowledge.
- Prompt injection embedded in retrieved documents.
- Agent overreach or self-approval.
- Cross-workspace/object authorization failure.
- Stolen/replayed machine tokens.
- Malicious or oversized uploads.
- Duplicate task execution due to retries.
- Supply-chain compromise in build/deploy.
- Audit logs accidentally containing private content or secrets.

## Minimum controls

- Owner-only initial access; no public registration.
- Server-side authorization and deny-by-default scopes.
- Short-lived web sessions; revocable scoped machine tokens.
- Secrets only in server environment, never `NEXT_PUBLIC_*`.
- RLS or equivalent database enforcement for all user-facing tables.
- Private object storage and signed, short-lived access URLs.
- Source allowlist, file limits, malware scanning strategy, parser isolation.
- Prompt-injection defense: retrieved content never becomes system/developer instruction.
- Human approval for publishing, deletion, permission changes, external side effects, and production releases.
- Redacted structured logs, audit trail, rate limits, backup and restore tests.
- Dependency and action pinning; least-privilege CI permissions.

## Production gate

Do not claim production readiness until auth, authorization tests, RLS/policies, backup restore, rate limits, audit coverage, secret handling, dependency review, and incident recovery have been verified.
