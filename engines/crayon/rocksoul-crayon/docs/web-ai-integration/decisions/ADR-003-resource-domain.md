# ADR-003: Canonical Application Resource Ownership and Non-Duplication

## Status
ACCEPTED

## Context
The application domain consists of canonical resources: `User`, `Project`, `Task`, `Chat`, `Mail` backed by Fastify and Drizzle ORM. An anti-pattern in AI application development is creating parallel "shadow" tables or models (such as `AIUser`, `AIProject`, `AITask`, `AIChat`) which fragment business state and lead to synchronisation drift.

## Decision
We established a strict rule of resource ownership:
1. **Single Canonical Domain**: `User`, `Project`, `Task`, `Chat`, `Mail` remain canonical entities residing in the Drizzle SQLite database (`./data/sqlite.db`).
2. **AI as a Capability Layer**: AI agents act upon canonical entities through standard API mutations (e.g. creating tasks, summarizing threads, extracting action items).
3. **Dedicated AI Persistence**: Rocksoul AI Runtime maintains its own isolated database (`./data/ai.db`) strictly for LLM conversation memory, telemetry traces, and tool run state.

## Consequences
- **Positive**: Complete domain integrity; AI actions reflect immediately in the standard project and task dashboards.
- **Positive**: Clean separation of operational business data from AI agent memory.
- **Negative**: AI tools must use API or ORM interfaces rather than writing directly into business tables.
