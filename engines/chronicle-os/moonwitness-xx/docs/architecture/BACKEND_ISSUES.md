# Backend Issue Index

This is the execution index for the JavaScript monorepo backend. Each issue is independently scoped and contains outcome, allowed scope, design/engineering rules, acceptance checklist, dependencies, out-of-scope boundaries, and required verification evidence.

## Priority and order

### P0 — Workspace and baseline validation
- [#1](https://github.com/isrockfeel/moonwitness/issues/1) Generate deterministic pnpm lockfile.
- [#2](https://github.com/isrockfeel/moonwitness/issues/2) Verify MikroORM migration and metadata against PostgreSQL.
- [#3](https://github.com/isrockfeel/moonwitness/issues/3) Add GitHub Actions quality gate.

### P1 — Core contracts, identity, editorial model, and add-on foundation
- [#4](https://github.com/isrockfeel/moonwitness/issues/4) Centralized runtime configuration.
- [#5](https://github.com/isrockfeel/moonwitness/issues/5) Central API envelopes and response schemas.
- [#6](https://github.com/isrockfeel/moonwitness/issues/6) Repository and unit-of-work boundaries.
- [#7](https://github.com/isrockfeel/moonwitness/issues/7) User credentials and password verification.
- [#8](https://github.com/isrockfeel/moonwitness/issues/8) Secure browser sessions and logout.
- [#9](https://github.com/isrockfeel/moonwitness/issues/9) Permission scopes and RBAC.
- [#10](https://github.com/isrockfeel/moonwitness/issues/10) Append-only audit event writer.
- [#11](https://github.com/isrockfeel/moonwitness/issues/11) Story blocks and block-level provenance.
- [#12](https://github.com/isrockfeel/moonwitness/issues/12) Source references linked to story blocks.
- [#13](https://github.com/isrockfeel/moonwitness/issues/13) Editorial state machine.
- [#14](https://github.com/isrockfeel/moonwitness/issues/14) Transactional outbox persistence.
- [#15](https://github.com/isrockfeel/moonwitness/issues/15) Central BullMQ queue registry and typed producers.
- [#16](https://github.com/isrockfeel/moonwitness/issues/16) Outbox-to-BullMQ dispatcher.
- [#17](https://github.com/isrockfeel/moonwitness/issues/17) Persistent add-on lifecycle.
- [#18](https://github.com/isrockfeel/moonwitness/issues/18) Add-on capability grants.
- [#24](https://github.com/isrockfeel/moonwitness/issues/24) Compensating rollback for add-on activation.
- [#25](https://github.com/isrockfeel/moonwitness/issues/25) OpenAPI generated from central contracts.
- [#26](https://github.com/isrockfeel/moonwitness/issues/26) Structured logs, metrics, and health instrumentation.
- [#28](https://github.com/isrockfeel/moonwitness/issues/28) Story authoring and public reader API use cases.
- [#28](https://github.com/isrockfeel/moonwitness/issues/28) Story authoring and public reader API.

### P2 — Research, creative universe, integrations, and operations
- [#19](https://github.com/isrockfeel/moonwitness/issues/19) Provider-neutral messaging integration port.
- [#20](https://github.com/isrockfeel/moonwitness/issues/20) Encrypted Baileys credentials and Signal-key storage.
- [#21](https://github.com/isrockfeel/moonwitness/issues/21) WhatsApp outbound pipeline.
- [#22](https://github.com/isrockfeel/moonwitness/issues/22) WhatsApp inbound normalization and retention.
- [#23](https://github.com/isrockfeel/moonwitness/issues/23) Media asset persistence and storage provider port.
- [#27](https://github.com/isrockfeel/moonwitness/issues/27) Story archive and search services.
- [#29](https://github.com/isrockfeel/moonwitness/issues/29) Research dossier, claims, evidence, and uncertainty.
- [#30](https://github.com/isrockfeel/moonwitness/issues/30) Creative universe catalog for all ten identities.
- [#31](https://github.com/isrockfeel/moonwitness/issues/31) Immutable story revisions and correction history.
- [#32](https://github.com/isrockfeel/moonwitness/issues/32) Protected add-on discovery and lifecycle API.
- [#33](https://github.com/isrockfeel/moonwitness/issues/33) Media processing worker jobs.
- [#34](https://github.com/isrockfeel/moonwitness/issues/34) Production containers for API and worker.
- [#35](https://github.com/isrockfeel/moonwitness/issues/35) PostgreSQL backup and restore verification.
- [#36](https://github.com/isrockfeel/moonwitness/issues/36) Isolated API/worker integration tests.
- [#29](https://github.com/isrockfeel/moonwitness/issues/29) Research dossier, claims, evidence, and uncertainty.
- [#30](https://github.com/isrockfeel/moonwitness/issues/30) Creative universe catalog for all ten identities.
- [#31](https://github.com/isrockfeel/moonwitness/issues/31) Immutable story revisions and correction history.
- [#32](https://github.com/isrockfeel/moonwitness/issues/32) Protected add-on discovery and lifecycle API.
- [#33](https://github.com/isrockfeel/moonwitness/issues/33) Media processing worker jobs.
- [#34](https://github.com/isrockfeel/moonwitness/issues/34) Production containers for API and worker.
- [#35](https://github.com/isrockfeel/moonwitness/issues/35) PostgreSQL backup and restore verification.
- [#36](https://github.com/isrockfeel/moonwitness/issues/36) Isolated API/worker integration tests.

## Parallel execution lanes

Parallelize only when issue dependencies are satisfied and file ownership does not conflict.

1. **Platform lane:** #1, #3, #4, #5, #25, #26.
2. **Persistence lane:** #2, #6, #10, #14, #29, #31, #35.
3. **Identity/security lane:** #7, #8, #9, #18, #20.
4. **Editorial lane:** #11, #12, #13, #28, #29, #30, #31, #27.
5. **Async/add-on lane:** #15, #16, #17, #24, #32, #33.
6. **Integration lane:** #19, #20, #21, #22, #23.
7. **Release lane:** #3, #34, #35, #36.

## Rules for local AI agents

- Read the issue and its dependencies before editing.
- Claim one issue and state the exact files it owns.
- Do not duplicate another open issue's acceptance criteria.
- Do not change the stack or global contracts without a dedicated issue.
- Keep changes small; one issue should produce one reviewable PR.
- Every PR must link the issue and show tests/build/migration evidence.
- Never mark an issue complete because files exist; acceptance criteria require executable evidence.
- If a dependency or design rule is unclear, add a focused issue or comment rather than guessing.
- Do not run high-conflict parallel agents on the same package or migration files.
