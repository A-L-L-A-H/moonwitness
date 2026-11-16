# CRAYON Performance Budgets — alpha

Correctness, explainability, and authority safety outrank raw speed. Performance optimization must not weaken semantic invariants.

## Reference pipeline

The executable benchmark measures a full read-side representation pipeline:

`Situation → Semantic Snapshot → RIR → Inspector`

Synthetic fixtures include entities, relations, knowledge, possibilities, consequences, authority evaluation, physics, and Inspector explanations.

## Initial self-hosted budgets

These are regression ceilings, not product latency promises:

| Situation size | Budget |
| --- | ---: |
| ~25 entities | 100 ms |
| ~125 entities | 500 ms |
| ~500 entities | 2500 ms |

The large/medium latency ratio must also remain within 3.5× the input scaling factor. This is deliberately permissive enough for self-hosted runner noise while still catching accidental quadratic/explosive changes.

## Memory

Alpha target: representation generation should remain bounded by the input Situation plus derived Snapshot/RIR/Inspector structures. No package should retain Situation-specific objects globally after a request except intentional process-local execution capability WeakSets, whose entries are weak references.

A future production benchmark will add heap snapshots and sustained multi-situation workloads; current alpha does not claim a fixed memory SLA.

## Rules

- Benchmark failures block a release until explained or the budget is deliberately revised with evidence.
- Weight/explanation generation cannot be removed just to pass performance budgets.
- Cross-renderer output must not cache or reuse authority/verification claims from another Situation.
- Real production datasets should replace/supplement synthetic fixtures during Visual DNA calibration.

Run locally after package build:

`npm run performance:check`
