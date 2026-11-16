# Branch reconciliation (2026-09-09)

The remotes were fetched and compared with `origin/main`. Branches that are
already merged (or only behind main) require no merge. The remaining branches
contain overlapping experimental commits, so merging all of them would
re-introduce duplicate contract and adapter changes.

## Decision

- Keep `origin/main` as the integration line.
- Do not merge `origin/dev`, the two `ecosystem/research-adapters-final*`
  branches, or the two `feat/ecosystem-research-*` branches wholesale; they
  are stale/duplicated and materially behind main.
- Keep the steward topology branches (`feat/steward-topology-v1*`) for a
  separate reviewed change set; they are not required by the current UI/API
  release and are not safe to merge blindly.
- Merged/behind fix and certification branches are treated as reconciled.

No remote branch was deleted. Deletion is intentionally a separate cleanup
operation after owners confirm the retention policy.
