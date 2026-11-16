# ADR-024 — Private NPM Package Distribution via GitHub Packages

Status: LOCKED
Date: 2026-08-30

## Context

Wave 1 successfully implemented and merged `moonwitness-core`, but independent Gen2 repositories could not consume `@arsybelovedlabs/moonwitness-core` while preserving isolated CI and the frozen public-package boundary.

The ecosystem needs one internal package distribution mechanism that:

- works with independent GitHub repositories;
- works in isolated GitHub Actions workflows;
- preserves package-first reuse;
- does not require a custom package server;
- does not require Git submodules;
- keeps private packages private;
- supports versioned package releases;
- remains compatible with local development and later deployment environments.

## Decision

Use **GitHub Packages npm registry** as the canonical private package distribution mechanism for internal `@arsybelovedlabs/*` packages.

Canonical registry:

`https://npm.pkg.github.com`

Canonical package scope:

`@arsybelovedlabs/*`

## Publishing

Package-owning repositories publish versioned packages to GitHub Packages through GitHub Actions.

Publication is triggered by the repository release/versioning policy and uses the repository-scoped `GITHUB_TOKEN` where supported.

No long-lived credential is committed to source.

## Consumption

Consumer repositories configure the `@arsybelovedlabs` scope to resolve from GitHub Packages.

GitHub Actions must use the minimum package read permission necessary. Where package access is not automatically available to the consumer repository, package access must explicitly be granted to that repository.

Local developer authentication uses a developer-managed credential outside the repository. Tokens are never committed.

## Versioning

Packages use semantic versioning.

Consumers must use explicit version ranges compatible with the package compatibility policy and lock resolved versions through the repository lockfile.

No consumer may depend on a package through:

- `file:` paths;
- workspace-only paths across repositories;
- Git URLs as a substitute for package distribution;
- Git submodules;
- deep imports into another repository's source tree.

## Public/private boundary

Package source remains private to its owning repository.

The published package contains only the approved public build artifacts defined by the package's `files` and `exports` configuration.

## CI isolation

Every consumer must be capable of installing its dependencies from a clean checkout without relying on another repository being present locally.

This is a hard requirement for independent-repository architecture.

## Security

Packages must not contain secrets, credentials, local environment files, or internal source not intended for distribution.

Package publication and installation must use least-privilege permissions.

## Alternatives rejected

### Git submodules
Rejected because repository composition is not the canonical dependency mechanism.

### `workspace:` cross-repository dependencies
Rejected because they do not provide isolated repository builds.

### `file:` dependencies
Rejected because they break clean CI and deployment portability.

### Self-hosted package registry
Rejected for the current phase because it introduces an additional infrastructure/control plane without a current requirement.

### npm public registry for private packages
Rejected because the ecosystem requires private internal packages.

## Consequences

Positive:

- independent repositories can consume versioned packages;
- GitHub remains the single source-control and CI platform;
- CI remains reproducible from clean checkouts;
- no custom package infrastructure is required;
- package boundaries remain explicit.

Negative:

- package publication becomes part of release engineering;
- private package access must be configured per consuming repository/package;
- developers need local registry authentication for private package installation.

## Migration

`moonwitness-core` is the first package to use this mechanism.

Subsequent reusable Gen2 packages must follow the same registry policy unless a new ADR explicitly changes the decision.
