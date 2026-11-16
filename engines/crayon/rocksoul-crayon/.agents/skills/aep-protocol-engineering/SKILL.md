---
name: aep-protocol-engineering
description: Operational protocol-engineering guidance for AEP, the Application Communication Runtime, @app/sdk, packages/protocol, gateway, transports, sessions, executions, capabilities, streams, framing, serialization, recovery, and protocol tests. Load before inspecting or changing any related code or documentation.
metadata:
  scope: repository-wide AEP and distributed application runtime work
  authority: repository source and normative protocol specification
  version: 1.0.0
  compatible_protocol: AEP 1.x (verify current specification headers)
  last_reviewed_phase: repository specification / pre-kernel implementation
---

# AEP Protocol Engineering

This is an operational constitution for agents working on the Rocksoul AEP stack. It is not a replacement for the protocol specification and never outranks it. This skill governs agent behavior; protocol documents define what AEP is.

AEP is the application-layer protocol connecting client applications to the gateway and application fabric. The Application Communication Runtime owns negotiation, logical multiplexing, ordering, backpressure, recovery, and transport adaptation. The Application Fabric resolves capabilities and delegates to canonical application services. Transport is the wire adapter, not the application contract.

## Load and authority

Load this skill when a task mentions AEP, Application Communication Runtime/Fabric, `@app/sdk`, `packages/protocol`, framing, binary protocol, serialization, streams, sessions, executions, capabilities, gateway, WebTransport, WebSocket fallback, ACK, resume, idempotency, events, artifacts, recovery, or protocol testing.

Resolve decisions in this order:

1. Current repository source of truth and existing service contracts.
2. Normative protocol specification in `docs/protocol/`.
3. Explicit accepted ADRs.
4. Existing business/domain behavior.
5. This skill.
6. Agent assumptions.

If implementation and specification disagree, stop, report the contradiction, identify migration scope, and do not silently reinterpret the protocol. If behavior is undefined and affects correctness, security, delivery, or recovery, stop and raise the ambiguity.

## Mandatory discovery

Before changing AEP-related code, read `docs/protocol/constitution.md`. Then read only the relevant documents, normally:

- `framing.md`, `serialization.md`, `lifecycle.md`, `execution.md`, `streams.md`, `events.md`
- `capabilities.md`, `delivery.md`, `recovery.md`, `errors.md`, `versioning.md`
- `security.md`, `invariants.md`, `failure-matrix.md`, `decisions.md`, and `testing.md`

Use progressive discovery: inspect the affected package and callers after identifying the governing rules. Determine the active protocol phase from repository documentation and do not implement a later-phase feature merely because it is convenient. If a future-phase prerequisite is unavoidable, document the dependency, implement the minimum prerequisite, test it, and return to the current phase.

## Required operating loop

For every meaningful AEP task:

`INSPECT → IDENTIFY AUTHORITY → MODEL → CHECK INVARIANTS → PLAN → IMPLEMENT → VERIFY → FAULT REVIEW → DOCUMENT → CHECKPOINT`

Protocol changes follow `SPECIFICATION → CONTRACT → IMPLEMENTATION → TEST`. Update the specification or ADR before introducing new normative behavior. Never silently change timeouts, limits, ACK meaning, frame layout, state transitions, or version compatibility.

## Architectural constitution

- AEP is an application-layer, client-to-gateway protocol. The kernel has exactly `HELLO`, `OPEN`, `RUN`, `DATA`, `SIGNAL`, `ACK`, and `CLOSE`.
- Do not add domain primitives such as `AI_FRAME`, `BROWSER_FRAME`, `CODING_FRAME`, `PROJECT_FRAME`, `TASK_FRAME`, or `MAIL_FRAME`. Express domain behavior through capability + execution + event + payload.
- Treat AEP as adaptive integration. Existing Fastify services, Drizzle/SQLite persistence, authentication, domain services, and Mastra remain canonical; adapt at a clean boundary rather than rewriting them.
- `packages/protocol` stays pure and browser/Node neutral. It must not import React, DOM globals, Fastify/HTTP, Drizzle/SQLite, Mastra, business services, or concrete transports.
- `@app/sdk` is the sole application-communication gate. Browser `/web` feature code must not directly use `fetch`, Axios, XHR, WebSocket, WebTransport, or EventSource, and must not create feature-specific clients.
- Gateway flow is `AEP → capability resolver → application service`, never direct ORM access or duplicated business logic.
- Capability metadata must cover identity/version, input/output schemas, permissions, streaming, cancellation, idempotency, and priority. Use registry/resolver/executor design, not a giant switch.
- Preserve both capability modes: known capabilities may use compile-time TypeScript contracts; dynamic capabilities must use runtime schema validation. Do not sacrifice type safety merely to support extensibility.
- Availability, support, authorization, and executability are distinct. Advertisement is not permission; the server is authoritative.
- Transport is an implementation detail. AEP logical streams are not WebTransport stream IDs or WebSocket connections. Feature code must not branch on transport.
- Current transport posture is WebTransport preferred, WebSocket fallback, and limited HTTP compatibility. WebRTC/P2P is not the core architecture; treat it only as an explicitly specified capability.

## Identity, lifecycle, and delivery

Keep `sessionId`, `connectionId`, `requestId`, `executionId`, `streamId`, `eventId`, `idempotencyKey`, and `causationId` distinct. A request is not an execution, and an execution is not an idempotency record.

Represent application work with the canonical Execution lifecycle: `CREATED`, `ACCEPTED`, `RUNNING`, `WAITING`, `PAUSED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`. Terminal states are immutable; illegal transitions are rejected. Do not create parallel lifecycle abstractions.

Keep these concepts separate:

- Connection: transport lifetime.
- Session: authenticated application continuity.
- Execution: logical work.
- Stream: logical communication path.

Connection loss does not automatically cancel a session or execution. Distinguish reconnect, resume, replay, and authoritative state sync. Preserve existing executions and use durable state when replay buffers are gone, subject to the specification.

Never claim transport “exactly once.” Use at-least-once/replay-capable transport, idempotent application effects, and authoritative durable business state. Duplicate mutation prevention must survive process restart; an in-memory cache is only an optimization. Do not retry a mutation without an idempotency strategy.

ACK has one normative meaning. Do not conflate received, queued, processed, and persisted unless the specification explicitly does so. Events are immutable notifications; reliable-stream ordering does not imply global ordering. Use `causationId` and `parentExecutionId` for cross-stream causality.

## Framing, parsing, and runtime safety

Respect the specified byte layout, endian rules, version rules, reserved flags, and bounds. Validate framing before allocation and deserialization, then schema-validate decoded data; decoded objects are not trusted. Safely reject or handle integer overflow, truncation, invalid/oversized lengths, malformed serializer data, recursion/depth abuse, unknown versions, and parser desynchronization. Never allocate from an unvalidated untrusted length.

The production serializer follows the specification (currently MessagePack where specified), not business logic. Keep protocol contracts free of accidental `Buffer`, `process`, `window`, or `document` dependencies unless an adapter owns them.

Every queue, pending execution collection, stream buffer, and replay buffer has explicit byte/frame bounds and an explicit overflow policy. Review backpressure, pending frames, priority, and fairness. Priority bands are `CRITICAL`, `HIGH`, `NORMAL`, `LOW`, and `EPHEMERAL`; telemetry, presence, and typing must not starve execution state or cancellation.

Structured errors must distinguish protocol, transport, execution, domain, and authorization failures. Sanitize production responses: never expose stack traces, paths, queries, credentials, or internal diagnostics.

## Failure-first and testing rules

Before significant runtime behavior, reason through connection loss, duplicate RUN/DATA, delayed or invalid ACK, late DATA, restart, completed execution replay, capability removal, queue overflow, node loss, cancellation races, and expired authentication. Find the normative rule or stop; do not invent defaults.

Every bug follows `REPRODUCE → ROOT CAUSE → FIX → REGRESSION TEST → VERIFY`. Never disable a test to hide a failure. Prioritize unit, property, fuzz, adversarial, integration, E2E, and fault-injection coverage as appropriate. Protocol work is incomplete without parser/security tests. Prefer deterministic, reproducible randomized tests for encode/decode, canonical encoding, sequence monotonicity, ACK behavior, state transitions, idempotency, and malformed input safety.

## Security and existing-system protection

Treat the known development credential `rock_live_master_key_12345` as security debt `SEC-DEBT-001`: never place it in the SDK, browser bundle, or production credentials; keep the finding visible until resolved. Never log passwords, bearer tokens, or API keys.

Before touching ORM, AI, domain services, or business rules, prove protocol integration cannot be done at a cleaner adapter/gateway boundary. Avoid shadow models, shadow state, duplicated routing, hidden mutable state, circular dependencies, transport leakage, direct frontend networking, and protocol/business coupling. New dependencies require an explicit reason, maintenance/security/browser/Node/bundle impact assessment, and compatibility check.

## Documentation, review, and checkpoints

Synchronize `docs/protocol/` whenever semantics change. Update an ADR when an architectural decision changes. Inspect the final diff for unrelated edits, accidental APIs, generated junk, secrets, debug code, dead code, unnecessary dependencies, and duplicate implementations.

After each atomic verified phase/task, create the repository-appropriate logical checkpoint/commit when the repository workflow authorizes it. The message must identify phase, scope, and verification status. Do not commit unrelated work.

Use these report headings for meaningful AEP work: `CURRENT PHASE`, `OBJECTIVE`, `AUTHORITY DOCUMENTS`, `FILES AFFECTED`, `INVARIANTS AFFECTED`, `RISKS`, `IMPLEMENTATION`, `VERIFICATION`, `TEST RESULTS`, `DOCUMENTATION CHANGES`, `CHECKPOINT`, and `NEXT ALLOWED PHASE`. Use status vocabulary `FOUNDATION`, `IMPLEMENTED`, `INTEGRATED`, `VERIFIED`, `PRODUCTION-READY`, or `BLOCKED`; do not say only “DONE”.

## Mandatory stop conditions

Block rather than guess when specification ambiguity affects behavior; binary layout or delivery semantics contradict; a state transition is undefined; a security invariant is violated; duplicate mutation cannot be prevented; source of truth is unclear; transport semantics leak into application code; tests cannot prove correctness; or implementation requires an unapproved protocol assumption.

## Phase and scope fence

This skill does not authorize advancing the repository into Phase 2 or any future implementation phase. During a skill-authoring or specification-phase task, stop after the skill and its audits are complete. Do not implement `packages/protocol`, frame codecs, `@app/sdk`, gateway, Application Fabric, WebSocket/WebTransport, frontend/backend communication, ORM/database changes, AI/Mastra changes, migrations, business logic, or protocol test implementations. Record future work as roadmap, not current scope.

## New-agent self-check

Before using this skill, an agent must be able to answer from this file and the cited repository documents: what AEP and the runtime/fabric are; which authority wins; what must be read; the active phase; the seven primitives; the Execution model; identity and retry semantics; resume/recovery semantics; transport boundaries; frontend and protocol package boundaries; what may be modified; and when to stop. If any answer is only implied, inspect the governing document before coding.

## Required completion report

For skill-authoring or AEP work, report: `SKILL STATUS`, `SKILL LOCATION`, `SKILL NAME`, `SKILL VERSION`, `TRIGGER CONDITIONS`, `AUTHORITY SOURCES`, `PROTOCOL VERSION COMPATIBILITY`, `FILES CREATED`, `FILES MODIFIED`, `CONTRADICTIONS FOUND`, `CONTRADICTIONS FIXED`, `RULE CATEGORIES COVERED`, `SELF-CHECK RESULT`, `CONTRADICTION AUDIT RESULT`, `IMPLEMENTATION CHANGED`, and `FINAL STATUS`. For this skill-authoring task, `IMPLEMENTATION CHANGED` must be `NO`.

## Final quality gate

Before declaring an AEP task complete, verify the applicable authority documents, phase, package boundaries, execution/identity semantics, transport abstraction, parser/resource bounds, failure matrix, security rules, regression tests, documentation synchronization, and diff. Run a contradiction audit against `constitution.md`, `invariants.md`, `failure-matrix.md`, and `decisions.md`. Report contradictions found and fixed separately, including specification version mismatches; do not fix them silently.

This skill is compatible with the repository's AEP 1.x documents as currently found; the document headers must be rechecked whenever the protocol major or phase changes.
