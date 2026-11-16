# 10 — Observability

Canonical telemetry model:

```text
logs    = what happened
metrics = how much/how often
traces  = how work moved
alerts  = what needs attention
audit   = who did what
provenance = why a research result exists
```

Use OpenTelemetry/OTLP at the application boundary and centralized collection/storage. Application correctness and epistemic quality must never be inferred from technical health alone.