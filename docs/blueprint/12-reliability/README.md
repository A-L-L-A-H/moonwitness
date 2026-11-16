# 12 — Reliability

Reliability covers timeout, retry, idempotency, backpressure, graceful degradation, recovery, backup/restore, migration safety, and rollback.

Principles:

- retries must be idempotent
- failure must be observable
- partial failure must degrade explicitly
- durable research/audit/provenance data cannot be silently dropped
- production must be rebuildable from controlled artifacts/configuration
