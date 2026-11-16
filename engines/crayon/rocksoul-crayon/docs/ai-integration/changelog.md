# AI Integration Changelog

## Phase AI-01 to AI-15 (September 2026)

### Added
- **Phase A**: Completed repository reconnaissance and generated `docs/ai-integration/audit.md`.
- **Phase B**: Established monorepo dependency hierarchy and DAG in `docs/ai-integration/dependency-map.md`.
- **Phase C**: Scaffolded 12 modular AI packages under `packages/ai/`:
  - `ai-core`: Shared types, contracts, execution context, security policies.
  - `ai-observability`: Telemetry collector, Pino logger adapter.
  - `ai-memory`: LibSQL isolated storage driver (`mastra.db`), thread manager.
  - `ai-workspace`: Sandboxed workspace filesystem provider.
  - `ai-coding`: Line diffing, unified diff formatter, coding service.
  - `ai-browser`: Replaceable browser automation provider abstraction.
  - `ai-mcp`: Model Context Protocol server configuration and tool wrapper.
  - `ai-tools`: Security-enforcing tool registry (`ALLOW`, `DENY`, `ASK_USER`) and built-in safe tools.
  - `ai-agents`: Autonomous `assistant` agent with memory and tools; foundation skeletons for `coder`, `researcher`, `browser`, `supervisor`.
  - `ai-workflows`: Multi-step deterministic AI execution pipelines.
  - `ai-orchestrator`: Intent routing, agent delegation, and run state management.
  - `ai-base`: Composition root exposing the centralized `ai` singleton instance.
- **Phase H & I**: Added Fastify route plugin `apps/api/src/routes/v1/ai.ts` mounted at `/api/v1/ai` (`/agents`, `/chat`, `/runs`, `/runs/:id`, `/runs/:id/cancel`) protected by `app.authenticate`.
- **Phase K**: Sandboxed workspace path traversal safeguards.
- **Phase Verification**: End-to-end verification script in `apps/api/src/test-ai.ts` validating singleton lifecycle, database isolation, auth protection, tool execution, and Fastify routes.

### Preserved
- Fastify 5 core backend and all existing plugins (`cors`, `sensible`, `swagger`, `db`, `logger-db`, `auth`).
- Application business database (`./data/sqlite.db`) containing 22 Drizzle tables untouched.
- Single runtime process — no second server or extra port created.
