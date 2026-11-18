<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> [!IMPORTANT]
> **Absorbed Legacy App Notice (`2026-11-18`):** Standalone `allah-com/apps/headquarter` has been consolidated into active `apps/web` per [ADR-006](../../../../../docs/architecture/adr-006-three-app-topology-and-trust-zones.md). Obey root [AGENTS.md](../../../../../AGENTS.md) and [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../../../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md).

# Headquarter Agent Guidance

Follow the repository-wide [AGENTS.md](../../AGENTS.md) and [documentation contract](../../DOCUMENTATION_CONTRACT.md). This file adds Next.js-specific guidance.

Shared shadcn/ui components live in `packages/ui` (`@moonwitness/ui`). Prefer those over one-off components.