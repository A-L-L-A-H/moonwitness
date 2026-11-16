# 11 — Performance

Performance budgets are defined per workload class, not as a single global target.

```text
interactive → low latency
analysis    → bounded execution
ingestion   → throughput
research    → asynchronous
batch       → bulk efficiency
AI          → latency + token/cost budget
```

Optimization must preserve security, provenance, correctness, and reproducibility.