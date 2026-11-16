---
name: rocksoul-data-boundaries
description: Operational guidance for Drizzle ORM, LibSQL/SQLite schemas, package data boundaries, seeds, migrations, registries, and persistence correctness in the Rocksoul monorepo.
metadata:
  scope: packages/orm*, packages/common, data, migrations, and persistence consumers
  version: 1.0.0
  repository_architecture: modular Drizzle workspace packages
---

# Rocksoul Data Boundaries

Load for changes to `packages/orm/**`, `packages/orm-*`, schema registries, migrations, seeds, persistence adapters, or data-facing service contracts.

## Required discipline

- Inspect the owning package, dependent package manifests, schema registry, generated migration state, and relevant domain documentation before editing.
- Keep shared schema primitives in `orm-base`; keep domain tables in their owning package. Do not duplicate tables or move ownership for convenience.
- Preserve package dependency direction and avoid circular imports between domain schema packages.
- Treat schema changes as compatibility changes: identify existing rows, nullability, defaults, indexes, uniqueness, foreign keys, rollback/forward migration behavior, and deployed-version compatibility before coding.
- Never use seed data, in-memory state, or generated artifacts as production source of truth.
- Keep database writes behind canonical service/repository boundaries. Protocol, SDK, UI, and AI packages must not import Drizzle or database drivers directly.
- Do not run push, migration, reset, or destructive seed commands without explicit task scope and a verified target database.

## Verification

For schema changes, verify generated SQL/migration intent, typecheck affected packages, test insert/update/read constraints, and cover existing-data and duplicate/concurrency cases where relevant. For bug fixes, add a regression test. Review diff for accidental generated files, credentials, destructive SQL, and unrelated schema churn.

Report data ownership, migration impact, compatibility risk, verification commands, and whether any database state was changed. Block when the authoritative owner or safe migration path is unknown.
