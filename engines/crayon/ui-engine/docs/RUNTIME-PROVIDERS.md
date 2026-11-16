# CRAYON Runtime Clock & Identity Providers

Status: experimental v0.9 determinism work (#80)

CRAYON semantic operations should not accidentally depend on ambient wall-clock time or random identity generation. Callers may use explicit providers where reproducibility matters, while production applications may use system defaults at the outer runtime boundary.

## Contracts

```ts
interface Clock {
  now(): string;
}

interface IdentityProvider {
  next(scope: string): string;
}
```

`RuntimeProviders` combines both. The semantic Kernel does not import the experimental runtime package and renderers must not choose semantic timestamps or IDs.

## Deterministic tests/replay

Use `createFixedClock()` and `createSequenceIdentityProvider()` to reproduce records byte-for-byte. This is intended for fixtures, crash-recovery tests, migration tests, and deterministic examples.

## Production defaults

`systemClock` uses the host clock. `systemIdentityProvider` requires `globalThis.crypto.randomUUID()`. Applications running in environments without that capability must inject their own identity provider rather than falling back to weak randomness.

## Existing callers

Existing APIs that already require caller-supplied IDs/timestamps remain valid. Provider helpers are an outer-runtime convenience, not a migration that silently rewrites existing semantic identity.

## Renderer boundary

`tests/runtime-provider-boundary.test.mjs` scans RIR/Web/Agent/Voice renderer source and rejects ambient `Date.now`, `new Date`, `randomUUID`, system providers, or runtime-stamp generation. A renderer may display semantic time/identity but may not invent it.

## Current implementation status

Implemented on `dev` in private `allah-crayon-runtime`:

- Clock and IdentityProvider contracts;
- fixed deterministic clock;
- deterministic sequence identity provider;
- production system providers at the outer runtime boundary;
- byte-for-byte reproducibility test;
- renderer architecture guard against semantic ID/time creation.

Main verification and integration into durable/execution helpers remain pending before #80 is release-proven.
