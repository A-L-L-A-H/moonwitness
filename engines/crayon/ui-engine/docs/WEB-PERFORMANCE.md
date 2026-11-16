# CRAYON Web Production Performance

Status: active production-hardening work (#133)

Performance work may reduce wasted computation and payload size, but it must never hide semantic uncertainty, consequence, authority requirements, witness history, or explainability merely to hit a metric.

## Current executable bundle budget

After the production Lab build, `npm run performance:web` inspects `dist-lab/assets/` and fails when the current conservative budget is exceeded:

```text
JavaScript raw   <= 650 KB
JavaScript gzip  <= 220 KB
CSS raw          <= 220 KB
CSS gzip         <= 55 KB
asset count      <= 40
```

These are alpha regression ceilings, not promises of final production size. They should be calibrated downward only when representative UI/semantic workload proves that doing so does not reduce meaning or accessibility.

## Why bundle size is not enough

Before #133 closes, the production gate must also measure:

- cold primary representation render;
- scenario switch latency;
- compact / standard / expanded semantic zoom;
- large temporal history/RIR rendering;
- Inspector pane cost isolated from primary representation;
- mobile viewport behavior.

## Invariant

An optimization that makes the UI faster by omitting critical consequence, unknown/conflicted state, authority, or witness information is a semantic regression and must be rejected even if the performance metric improves.
