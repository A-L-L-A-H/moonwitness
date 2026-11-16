# Genesis 00 — Foundation Execution Specification v1

Status: **FOUNDATION EXECUTION AUTHORIZED / WAVE 0 ACTIVE / CERTIFICATION PENDING**

This document is the Wave 0 execution specification under the frozen architecture. It is not an architectural source of truth. Canonical architecture lives in sections `00`–`16` and the active decision registry. The readiness gate in `17-genesis/GENESIS-READINESS-CHECKLIST.md` is authoritative for whether execution may begin.

The canonical readiness gate currently authorizes Foundation execution. This authorization does not imply that Stage 2 foundation evidence, implementation certification, or production certification are complete.

## Canonical path resolution

Workers MUST resolve blueprint references from the actual repository tree and `DOCUMENT-CATALOG.md` before executing.

Canonical locations currently include:

- Decision registry: `/DECISION-REGISTRY.md`
- Design freeze: `/00-constitution/DESIGN-FREEZE-DECLARATION-V1.md`
- Completion matrix: `/00-constitution/BLUEPRINT-COMPLETION-MATRIX-V1.yaml`
- Readiness gate: `/17-genesis/GENESIS-READINESS-CHECKLIST.md`

The root-level `/GENESIS-READINESS-CHECKLIST.md` is a deprecated compatibility pointer and is not a second gate.

A stale or incorrect path in a worker instruction is a **PROMPT_PATH_ERROR**, not an architecture failure, when the canonical artifact exists elsewhere in the same blueprint. Do not move or duplicate canonical artifacts merely to satisfy a stale path. Resolve the actual canonical location, record the mismatch, and continue pre-flight.

If a required artifact cannot be resolved through `DOCUMENT-CATALOG.md` or direct repository inspection, classify the run as `BLOCKED`.

## Objective

Create or normalize the common foundation for every Gen2 repository while preserving a single architecture, a single canonical network door, and dual deployment portability.

Existing verified repositories and artifacts must be normalized in place. Do not recreate a repository or overwrite verified capability work merely to make the Wave 0 skeleton uniform.

## Non-negotiable rules

1. Read the referenced blueprint/ADR before editing.
2. Inspect the target repository or create a new repository only from the approved repository manifest and only when the readiness gate authorizes provisioning.
3. Do not invent new architecture.
4. Do not add a second network protocol as a canonical entry point.
5. Reuse is delivered through versioned packages and public exports.
6. Domain packages must remain hosting-runtime agnostic.
7. Every HTTP capability must have a canonical portable handler/application boundary.
8. Hosting adapters must be thin.
9. Long-running or heavy work must not depend on one serverless invocation surviving indefinitely.
10. Database schemas remain private implementation details.
11. Do not import another repository's private source paths.
12. Do not duplicate canonical business logic.
13. Any locked-decision change requires a new ADR.
14. Preserve verified post-freeze evidence that conforms to the frozen design.

## Approved toolchain policy

- Track the newest upstream releases continuously.
- Promote the newest release supported by the deployment target only after CI compatibility checks.
- Do not pin an obsolete runtime merely because an older source repository used it.
- Package manager: pnpm, latest stable compatible release.
- Language: TypeScript, latest stable compatible release.
- Module system: ESM.
- Backend: Fastify 5.x where a Fastify transport is required.
- API contract: OpenAPI 3.2.0 + JSON Schema 2020-12.
- Frontend: Next.js 16.3.x + React 19.2.x + Tailwind 4.x + current-compatible shadcn/Base UI strategy, subject to the current approved toolchain manifest.

## Repository wave

Wave 0 creates or normalizes the approved Gen2 boundaries:

- moonwitness-core
- moonwitness-corpus
- moonwitness-cosmic
- moonwitness-crayon
- moonwitness-prophetic
- moonwitness-runtime
- moonwitness-worker
- moonwitness-api
- moonwitness-sdk
- moonwitness-frontend-platform
- moonwitness-wheremythfadetolegend
- moonwitness-commandcenter
- moonwitness-crayon-lab

`moonwitness-web` remains legacy/paused per ADR-025 and must not be reprovisioned as the primary public Web target.

Do not create duplicates under alternate names.

## Standard repository skeleton

Use only what the repository actually needs:

```text
src/
tests/
docs/
schemas/          # when the repo owns schemas/artifacts
scripts/          # only when required
.github/
README.md
SECURITY.md
CONTRIBUTING.md
package.json
package-manager lockfile
TypeScript config
```

Do not create `apps/`, `packages/`, `engine/`, or other organizational layers unless the repository's locked target map explicitly requires them.

## Runtime portability model

Every portable service/application follows:

```text
Domain / Application
       |
Portable handler/application interface
       |
  +----+----------------+
  |                     |
Vercel adapter       Node/Docker adapter
  |                     |
Serverless          Long-running
```

The domain must not import Vercel-specific APIs, container orchestration APIs, or deployment environment code.

### Serverless requirements

- no in-memory durable state;
- no required local filesystem persistence;
- bounded request execution;
- explicit timeout handling;
- idempotency for retryable mutations;
- external durable storage for state;
- async handoff for heavy jobs;
- configuration through environment variables/platform configuration;
- clean initialization per invocation or safe reuse without relying on reuse.

### Docker requirements

- same business behavior and public contract;
- health/readiness endpoints;
- graceful shutdown;
- signal handling;
- bounded concurrency;
- explicit resource configuration;
- container image reproducibility.

## Required Wave 0 files per code repository

At minimum:

```text
README.md
SECURITY.md
CONTRIBUTING.md
package.json
pnpm-lock.yaml
.gitignore
.editorconfig
.github/workflows/ci.yml
```

If a file is genuinely not applicable, document the exception in the worker report rather than silently omitting it.

## CI baseline

Every Gen2 code repository must verify:

1. dependency installation with frozen lockfile;
2. formatting/lint checks where configured;
3. TypeScript typecheck;
4. unit tests;
5. package/build test;
6. architecture dependency checks;
7. secret scan;
8. contract/schema validation when applicable.

Application repositories must additionally include:

9. serverless build/smoke validation;
10. Docker build/smoke validation.

## Package policy

A reusable package must:

- expose a documented public entrypoint;
- avoid deep imports from consumers;
- declare explicit peer/runtime dependencies;
- use semantic versioning;
- avoid leaking private implementation modules;
- pass package portability tests.

## API policy

Only `moonwitness-api` owns the canonical external network surface.

```text
HTTPS + OpenAPI
       |
moonwitness-api
       |
capability interfaces
```

SSE is allowed only as an HTTP streaming mode. gRPC/MCP/WebSocket are adapters requiring explicit justification; tRPC and GraphQL are not ecosystem standards.

## Parallel worker allocation

Safe to run in parallel only after the readiness gate authorizes the phase and each target repository can be uniquely resolved from the frozen repository manifest:

```text
Worker A → moonwitness-corpus
Worker B → moonwitness-cosmic
Worker C → moonwitness-crayon
Worker D → moonwitness-prophetic
Worker E → moonwitness-frontend-platform
Worker F → moonwitness-wheremythfadetolegend
Worker G → moonwitness-commandcenter
Worker H → moonwitness-crayon-lab
```

Keep these serialized when they modify shared contracts or shared foundation templates:

```text
moonwitness-core contract changes
shared package version policy
canonical OpenAPI surface
organization governance
shared CI template decisions
```

## Worker completion report

Every worker must report:

```yaml
status: PASS|PASS_WITH_NOTES|BLOCKED|FAIL
repository: <repo>
branch: <branch>
base_commit: <sha>
head_commit: <sha>
blueprint_refs: []
adrs: []
changed_paths: []
runtime_modes:
  serverless: PASS|FAIL|SKIPPED
  docker: PASS|FAIL|SKIPPED
verification:
  install: PASS|FAIL|SKIPPED
  typecheck: PASS|FAIL|SKIPPED
  unit: PASS|FAIL|SKIPPED
  build: PASS|FAIL|SKIPPED
  contract: PASS|FAIL|SKIPPED
  architecture: PASS|FAIL|SKIPPED
  security: PASS|FAIL|SKIPPED
  serverless_smoke: PASS|FAIL|SKIPPED
  docker_smoke: PASS|FAIL|SKIPPED
compatibility_notes: []
remaining_risks: []
```

## Exit criteria

Wave 0 is complete only when:

- every target repository exists exactly once;
- every repository uses the approved toolchain policy;
- CI is present and green on default branch for foundation changes;
- application/service repositories pass both serverless and Docker smoke tests where required by their runtime contract;
- no repository owns a second canonical network door;
- dependency-direction checks pass;
- no deep cross-repository source imports exist;
- package public exports are documented;
- repository ownership and governance are recorded;
- the readiness checklist is updated with Stage 2 evidence.

## References

- `DOCUMENT-CATALOG.md`
- `DECISION-REGISTRY.md`
- `00-constitution/ARCHITECTURE-TRUTH-V1.md`
- `00-constitution/DESIGN-FREEZE-DECLARATION-V1.md`
- `00-constitution/ADR-021-LATEST-RUNTIME-COMPATIBILITY.md`
- `01-architecture/ADR-025-PRIMARY-PUBLIC-WEB-OWNERSHIP.md`
- `03-contracts/CONTRACT-REGISTRY.yaml`
- `06-api/openapi/openapi.yaml`
- `13-deployment/SERVERLESS-AND-LATEST-RUNTIME-ARCHITECTURE-V1.md`
- `16-repositories/MASTER-REPOSITORY-MAP.yaml`
- `16-repositories/DEPENDENCY-DIRECTION.yaml`
- `17-genesis/IMPLEMENTATION-HANDOFF-CONTRACT-V1.md`
- `17-genesis/GENESIS-READINESS-CHECKLIST.md`
