# UI ownership and consumer migration

## Authority

| Concern | Authority |
| --- | --- |
| Visual source, tokens, and canonical assets | `rocksoul-assets` |
| Shared React UI and asset resolution | `@rocksoul/ui` |
| Routes, feature composition, and application state | `rocksoul-crayon` |
| Browser network boundary | `@rocksoul/sdk` |
| Authorization and execution | Main API / AEP |

The decision rule is: shared visual belongs in UI; canonical visual asset belongs in assets; application feature belongs in Crayon; network operation belongs in SDK; business execution belongs in AEP.

## Current migration state

Crayon consumes the immutable `@rocksoul/ui` release at `d4d7f21`. `apps/web/src/main.tsx` imports its stylesheet once, the router is wrapped in its navigation, asset, and action providers, and `BaseLayout` is now a Crayon adapter over `ApplicationShell`. The adapter maps SDK-backed metadata navigation, authenticated user data, and persisted notifications to the public UI contracts while preserving API authorization as the source of truth.

The former shadcn sidebar/header components remain available only for the appearance customizer's compatibility controls; they are no longer the application shell. Feature-local primitives remain Crayon-owned until they are promoted to a shared UI requirement.

## Required upstream release gate

Before adding the production dependency, release a package artifact containing the built `dist/` output (or publish a stable registry release) and pin its immutable commit/release in `apps/web/package.json`. Then perform this replacement-first sequence:

1. Keep the UI dependency pinned to a verified immutable commit.
2. Promote shared primitives to `@rocksoul/ui` only through its release flow.
3. Remove remaining legacy sidebar compatibility controls when the appearance customizer moves to the shared shell configuration contract.

The release gate avoids a long-lived dual shell and prevents Crayon from becoming an asset or design-system owner.

## Boundary checks

`pnpm audit:ui-boundary` rejects mutable `rocksoul-assets/main` runtime URLs and deep `@rocksoul/ui/src/*` imports. It is intentionally narrow and deterministic; feature code may continue to use the SDK/application client as its existing network boundary.

## Upstream contribution flow

Shared UI requirement: Crayon issue → `rocksoul-ui` change → UI CI/release → immutable Crayon pin.

Missing visual asset: Crayon requirement → `rocksoul-assets` → UI asset sync/release → immutable Crayon pin.
