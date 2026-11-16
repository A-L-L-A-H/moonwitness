---
name: rocksoul-ai-runtime
description: Operational guidance for Rocksoul AI runtime work across packages/ai, @rocksoul/ai-base, agents, tools, browser, coding, MCP, memory, workflows, workspace, orchestration, and API AI integration.
metadata:
  scope: packages/ai and apps/api AI integration
  version: 1.0.0
  repository_architecture: Rocksoul monorepo
---

# Rocksoul AI Runtime

Load this skill when changing `packages/ai/**`, AI routes or services in `apps/api`, `apps/web/src/features/ai/**`, browser/coding agents, MCP, memory, workflows, orchestration, or AI observability.

## Boundaries

- Inspect the relevant package manifest and `docs/ai-integration/architecture.md`, `integration.md`, `dependency-map.md`, `security.md`, `storage.md`, `mcp.md`, and `coding.md` before changing behavior.
- Preserve the package direction: `ai-core` contains shared contracts; domain packages build on it; `ai-base` composes the runtime. Do not create circular package dependencies.
- Keep AI providers, tools, browser automation, coding actions, MCP, persistence, and UI concerns behind explicit adapters. Do not place provider-specific behavior in shared contracts.
- Existing application services and persistence remain authoritative. Do not create shadow user, project, task, or execution models for convenience.
- Treat prompts, tool inputs, model output, browser content, files, and MCP responses as untrusted input. Validate schemas and permissions at the boundary.
- Do not expose secrets, raw provider errors, stack traces, filesystem paths, or credentials to the browser or telemetry.

## Execution and reliability

- Long-running AI, browser, coding, workflow, and artifact operations must use the repository's canonical execution/protocol semantics; do not invent a parallel lifecycle.
- Every mutating or retryable action needs an explicit idempotency and cancellation strategy. A retry must not duplicate business effects.
- Define timeout, cancellation, queue, concurrency, token/output, and tool-call limits before implementing a new runtime path.
- Consider provider failure, partial streaming, disconnect, duplicate delivery, tool failure, malformed tool output, model unavailability, and restart recovery.
- Keep observability structured and redact credentials and sensitive prompt/context data.

## Workflow

`INSPECT → READ AUTHORITY DOCS → MAP PACKAGE BOUNDARY → DEFINE FAILURE SEMANTICS → IMPLEMENT MINIMUM ADAPTER → TEST → REVIEW SECURITY → DOCUMENT`

Use unit tests for contracts, integration tests for provider/tool boundaries, and deterministic fault tests for retries, cancellation, streaming, and recovery. A production bug requires a regression test.

Do not upgrade providers, add a dependency, change persistence, or alter authorization semantics without documenting compatibility, security, and migration impact.
