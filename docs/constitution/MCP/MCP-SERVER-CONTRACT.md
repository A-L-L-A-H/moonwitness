# MCP Server Contract

**Status:** PROPOSED v1  
**Transport target:** Streamable HTTP  
**Endpoint target:** `/api/mcp` (exact SDK route to be verified during implementation)

## Design principle

MCP is a typed, permissioned interface to domain capabilities. It is not direct database access and not a privileged backdoor for agents.

## Initial tool catalogue

### Knowledge — read
- `knowledge.search` — hybrid search with filters and citations.
- `knowledge.get_document` — retrieve a document by stable ID and allowed revision.
- `knowledge.list_sources` — list visible sources and sync state.
- `knowledge.get_citation` — resolve a citation to its source span.

### Work tracker — read
- `tasks.list`
- `tasks.get`
- `tasks.search`
- `projects.list`
- `agents.list`

### Work tracker — write
- `tasks.create`
- `tasks.update`
- `tasks.add_comment`
- `tasks.create_subtasks`
- `tasks.claim`
- `tasks.release_claim`
- `tasks.attach_artifact`
- `tasks.request_review`

### Governance — approval-gated
- `approvals.request`
- `approvals.list_pending`
- `decisions.propose`

### Deferred / high-risk
- Publishing, deleting sources, changing permissions, modifying secrets, production deployment, and bulk mutations are not in the initial tool set.

## Tool specification

Every tool must define:
- stable name and semantic version;
- strict input schema and bounded output;
- required authentication and scopes;
- read/write/approval classification;
- idempotency and retry behavior;
- audit event;
- error codes and safe error messages;
- timeout and pagination limits.

## Authentication and authorization

Initial deployment is owner-only. Use an authenticated session for the web UI and scoped, revocable machine credentials for remote MCP clients. Never put a long-lived secret in a URL or client-side bundle. Store only hashed token material where feasible; show a token once on creation. Support token rotation and revocation.

## Agent safety

- Tool outputs are data, not instructions.
- Agents cannot escalate their own scopes.
- A tool may not claim an action succeeded until persistence confirms it.
- Side-effecting tools require idempotency keys.
- High-impact operations require owner approval outside the agent's own run.
- Tool calls and results are audited with redaction.
- No raw SQL, arbitrary shell, or unrestricted filesystem tool.

## Compatibility

Publish a machine-readable tool manifest and contract version. Additive tools are minor changes; breaking input/output changes require a major version.
