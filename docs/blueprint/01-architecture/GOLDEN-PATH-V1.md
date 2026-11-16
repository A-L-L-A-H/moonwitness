# MoonWitness Golden Path v1

Status: LOCKED

The Golden Path is the canonical end-to-end user/system journey used to validate architecture boundaries.

```text
User
  ↓
Application (Web / CommandCenter / approved client)
  ↓
HTTPS
  ↓
moonwitness-api
  ↓
Research Run
  ↓
moonwitness-runtime
  ↓
moonwitness-worker
  ├── moonwitness-corpus
  ├── moonwitness-cosmic
  ├── moonwitness-crayon
  └── moonwitness-prophetic (when applicable)
  ↓
Evidence / Provenance / Result
  ↓
Durable persistence + artifact storage
  ↓
SSE progress / final result over same HTTP API
  ↓
Application UI
```

## Invariants

1. UI never accesses domain databases directly.
2. Applications do not reimplement domain logic.
3. Only `moonwitness-api` owns the canonical external network surface.
4. Long-running work is represented as durable state/jobs.
5. Every externally observable result is traceable to evidence/provenance.
6. All stages propagate correlation/trace context.
7. Failure is represented by canonical Problem Details and stable error codes.
8. The same application semantics run in serverless and Docker modes.

## Acceptance checkpoints

- request authenticated/authorized
- research run accepted and idempotent
- job created and correlated
- knowledge source/release resolved
- analysis execution traceable
- evidence/provenance produced
- result persisted
- SSE events ordered and resumable where supported
- UI renders loading/success/error states
