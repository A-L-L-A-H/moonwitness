# Dependency Audit v2.3

Audit date: 2026-08-23.

## Active manifest

- React 18.3.1
- Vite 6.1.0
- Tailwind CSS 3.4.17
- TypeScript 5.9.2
- Playwright 1.62.0 (root dev dependency/spec; not installed in this container)
- Node engine minimum 22.13; audit runtime Node 22.16

## Current upstream references checked

- React docs list React 19.2 as latest major/minor line: https://react.dev/versions
- Vite announced 8.1 in June 2026: https://vite.dev/blog/announcing-vite8-1
- Tailwind CSS announced 4.3 in May 2026 and recommends `@tailwindcss/vite` for Vite: https://tailwindcss.com/blog/tailwindcss-v4-3
- Current shadcn Vite guide uses the Vite React plugin, Tailwind Vite plugin, and `@/*` alias: https://ui.shadcn.com/docs/installation/vite
- Node 24.15+ documents `node:sqlite` at stability 1.2 / release candidate: https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- Playwright release notes include 1.62: https://playwright.dev/docs/release-notes

## Decision

Do **not** combine major dependency upgrades with scoring/research changes. v2.3 hardens the current stack first. A React 19 / Vite 8 / Tailwind 4 / current shadcn CLI migration should be one isolated, dependency-enabled release with real browser E2E.

## Reproducibility limitation

The release pins versions in package manifests, but this environment cannot reach the npm registry and therefore cannot produce/refresh a trustworthy dependency lockfile. Generating and committing the package lock remains required in networked CI.
