# Phase 8 result — AEP Application Fabric

**Status:** `INTEGRATED / PARTIALLY VERIFIED`

The seven AEP wire primitives remain unchanged. The application layer uses
typed payloads over the existing execution/event model.

| Area | Result | Evidence boundary |
|---|---|---|
| A. Application SDK | Implemented | `createAppClient`, semantic resources, capabilities, executions |
| B. Resource API | Verified for projects/tasks/mail/chat/calendar | CRUD and metadata UI paths use the facade |
| C. Capability fabric | Integrated | server resolver, schema validation, authorization metadata |
| D. Execution | Verified for native browser flows | HELLO/WELCOME, RUN, ACK, DATA, terminal result |
| E. Execution graph | Verified locally | deterministic dependency waves and partial failure |
| F. Streaming | Integrated | `watch()` and async `stream()` contracts; broad AI stream E2E remains open |
| G. Events | Integrated for durable log and resource watch | server-authoritative hub hydrates bounded durable event log; dispatcher/replay hardening remains open |
| H. Subscriptions | Integrated | resource watch, principal-bound replay, cleanup, and bounded durable dispatch; full restart convergence remains open |
| I. Cursors | Verified locally | opaque application cursor and gap detection |
| J. Resume | Integrated | authenticated session/token resume foundation with durable event hydration; cross-process subscription convergence remains open |
| K. Batch | Verified locally | parallel/sequential addressable partial results |
| L. Schema evolution | Verified locally | compatible minor evolution and fail-closed mismatch handling |
| M. Transport policy | Integrated | transport abstraction and fallback contracts |
| N. WebTransport | Verified in Chromium container topology | production and cross-browser qualification remain open |
| O. WebSocket | Verified | authenticated browser dispatch and resume tests |
| P. HTTP compatibility | Integrated | existing ModelClient remains behind application facade |
| Q. Idempotency | Verified | automatic mutation keys and durable duplicate protection |
| R. Retry | Verified locally | bounded exponential policy and non-retryable auth failures |
| S. Cancellation | Verified | runtime cancellation and cancellation race coverage |
| T. Error model | Integrated | normalized runtime/application error classes |
| U. State convergence | Partial | authoritative event/snapshot path exists; reactive cache adapter remains open |
| V. Observability | Integrated | bounded runtime metrics and redacted inspection |
| W. Inspector | Partial | SDK `runtime.inspect()` exists; visual inspector remains open |
| X. Benchmarks | Partial | deterministic DX harness exists; REST/WS/WT network comparison remains open |
| Y. DX benchmark | Verified locally | `pnpm --dir packages/sdk benchmark:dx` |
| Z. Security | Verified for covered paths | authz, principal binding, principal-aware event replay, cursor/session boundaries; broader matrix remains open |
| AA. Tests | Integrated | protocol, SDK, API, security, and browser reference tests |
| AB. Documentation | Integrated | application fabric, SDK guide, API, and phase report |
| AC. Legacy migration | In progress | compatibility adapter is preserved behind facade |
| AD. Frontend integration | Verified for reference domains | dashboard, resources, mail, chat, calendar use facade; special modules remain |

## Verified commands

```text
pnpm --dir packages/sdk test                         # 50 passed
pnpm --dir apps/api exec node --test tests/aep-capabilities.test.js
pnpm --dir apps/web exec tsc -b
pnpm --dir apps/web exec playwright test tests/e2e/aep-application-fabric.spec.ts --project=desktop
pnpm --dir apps/web exec playwright test tests/e2e/aep-chat-send.spec.ts --project=desktop
```

The two browser tests prove authenticated Mail and Chat reference flows from
UI through AEP WebSocket execution to visible application state. They do not
prove every resource, browser engine, or production deployment topology.

## Remaining limitations

1. Durable event log, transactional outbox, bounded dispatcher, and
   principal-aware replay are active; multi-instance lease/claim semantics and
   restart convergence still require production topology tests.
2. Remaining special UI modules need native capability contracts before direct
   REST calls can be removed safely.
3. Network performance superiority is not claimed until equivalent REST,
   WebSocket, and WebTransport benchmarks exist.
4. WebTransport evidence remains scoped to the verified Chromium/container
   topology.

## Checkpoint eligibility

**YES — implementation checkpoint only.** This is not a production-readiness
claim. The next change should be driven by measured performance, real usage,
or a concrete failure case.

## Explicit blocked items

1. **Network transport comparison — BLOCKED WITH EVIDENCE.** A semantic-
   equivalent REST/WebSocket/WebTransport benchmark requires a controlled
   deployment topology, authenticated workload, and stable network controls;
   the current deterministic SDK benchmark is intentionally insufficient for
   this claim.
2. **Production topology qualification — BLOCKED WITH EVIDENCE.** Current
   evidence covers local LibSQL, local API, and Chromium browser execution;
   it does not cover the deployment's load balancer, multi-region behavior,
   UDP/HTTP-3 path, or all browser engines.
