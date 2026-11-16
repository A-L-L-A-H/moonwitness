# Implementation Handoff Contract v1

Status: PRE-IMPLEMENTATION
Purpose: standard contract for AI workers implementing Gen2 changes from this blueprint.

## Worker input

Every task must identify:

- blueprint reference
- ADR(s)
- repository
- branch
- capability/package
- source legacy repository/path if migration work
- migration action
- explicit allowed paths
- explicit forbidden paths
- acceptance criteria
- verification commands
- compatibility obligations

## Worker rules

1. Read the referenced blueprint and ADR before editing.
2. Inspect the target repository before changing it.
3. Preserve working behavior unless the task explicitly changes behavior.
4. Do not invent architecture when a locked decision already exists.
5. Do not add a protocol, database, package, or framework without an approved reason.
6. Do not create cross-repository deep imports.
7. Do not duplicate canonical business logic.
8. Do not change public contracts without contract/versioning review.
9. Run focused tests first, then required repository certification.
10. Produce a machine-readable report at the end.

## Required worker report

```yaml
status: PASS|PASS_WITH_NOTES|BLOCKED|FAIL
repository: <repo>
branch: <branch>
base_commit: <sha>
head_commit: <sha>
blueprint_refs: []
adrs: []
changed_paths: []
migration_actions:
  preserve: []
  extract: []
  adapt: []
  rewrite: []
  deprecate: []
  archive: []
verification:
  typecheck: PASS|FAIL|SKIPPED
  unit: PASS|FAIL|SKIPPED
  integration: PASS|FAIL|SKIPPED
  contract: PASS|FAIL|SKIPPED
  e2e: PASS|FAIL|SKIPPED
  architecture: PASS|FAIL|SKIPPED
compatibility_notes: []
remaining_risks: []
```

## Completion gate

A task is not complete merely because code compiles. The worker must demonstrate that the requested capability remains inside its canonical ownership and dependency boundary.
