---
name: rocksoul-e2e-verification
description: Verify Rocksoul end-to-end behavior across API, web UI, SDK, protocol, WebSocket/WebTransport, authorization, metadata, AI, and failure paths using the repository test harness.
metadata:
  scope: tests, Playwright, apps/api tests, package protocol/sdk tests
  version: 1.0.0
  repository_architecture: pnpm monorepo
---

# Rocksoul E2E Verification

Load this skill when debugging, adding, reviewing, or validating behavior across more than one package or process, including API/UI flows, protocol transport, AI integration, authorization, metadata, and recovery.

## First inspect

Read `playwright.config.ts`, the relevant test setup, `docs/e2e/architecture.md`, `test-matrix.md`, `audit.md`, and `failures.md`. For protocol/transport work also read `docs/protocol/testing.md`, `webtransport-e2e.md`, and the applicable normative documents.

Identify the actual path under test:

`browser/UI → SDK → transport/protocol → API/gateway → service/storage → response/event`

Do not declare success from a unit test when the defect is at another boundary.

## Verification rules

- Reproduce the failure before changing code and record the smallest deterministic fixture.
- Assert user-visible behavior, authorization outcome, persisted effect, protocol event, or error semantics—not implementation details alone.
- Test both success and failure paths: invalid auth, missing capability, malformed input, duplicate request, disconnect, delayed ACK, stream interruption, server restart, and partial AI/tool failure where relevant.
- Keep tests isolated, deterministic, cleanup-safe, and independent of developer-local credentials or hidden services.
- Do not weaken assertions, skip a failing test, increase timeouts blindly, or replace a real boundary test with a mock without documenting why.
- For browser tests, check console/page errors and verify the intended UI state. For transport tests, verify framing, ordering, reconnect/resume, bounds, and duplicate effects.

## Commands and reporting

Use the narrowest repository command first (`pnpm --filter <package> test`, API security tests, or the configured Playwright command), then broaden to build/typecheck and the relevant E2E matrix. Inspect changed files and `git diff` before reporting.

Report `STATUS`, `SCOPE`, `TESTS RUN`, `RESULTS`, `FAILURES/CONTRADICTIONS`, `REGRESSION COVERAGE`, and `REMAINING RISK`. A result is `VERIFIED` only when evidence covers the changed boundary; otherwise use `BLOCKED` or `IMPLEMENTED` with the missing proof stated.
