---
title: "ADR-010: Signed Addon Capability Manifests and Pluggable Control Scheduler"
status: "ACCEPTED"
owner: "Repository Standards & Principal Architecture"
last_reviewed: "2026-11-18"
---

# ADR-010: Signed Addon Capability Manifests and Pluggable Control Scheduler

> Implements **P3-2** from [PLATFORM-ENGINEERING-ROADMAP.md](./PLATFORM-ENGINEERING-ROADMAP.md), extending [ADR-004](./adr-004-addon-system.md) and [ADR-006](./adr-006-three-app-topology-and-trust-zones.md).

## Context

All 16 MoonWitness addons previously loaded with unsigned JSON manifests and a single synchronous HTTP proxy path (`apps/api` -> `cp/arsy` at `127.0.0.1:8787`). Distributed worker execution and fail-closed plugin verification require cryptographic manifest integrity checks alongside a pluggable scheduler backend that preserves single-host `cp/arsy` behavior.

## Decision

1. **Signed Addon Capability Manifests (`@moonwitness/addon-base`):**
   - `AddonManifestSchema` (`packages/addons/__base/src/registry.ts`) supports explicit `capabilities` declarations and an optional `signature` block (`algorithm`: `"ed25519"` | `"hmac-sha256"`, `keyId`, `digest`, `signedAt`).
   - `canonicalizeAddonManifestPayload`, `signAddonManifest`, and `verifyAddonManifestSignature` (`packages/addons/__base/src/signing.ts`) sign and verify capability-bearing manifest payloads using timing-safe cryptographic verification.
   - `AddonRuntimeController.syncAll()` accepts `signingPolicy` (`"permissive"` | `"strict"`), failing closed on unsigned or tampered active addons when `"strict"` mode is enabled and recording `capabilities_json`, `signature_status`, and `signature_key_id` in `ir_addons` (synchronized cleanly via `syncModels()`).
2. **Pluggable Control Scheduler Backend (`@moonwitness/addon-control`):**
   - `ControlSchedulerBackend` (`packages/addons/control/src/scheduler.ts`) abstracts `plan`/`apply` control dispatch across:
     - `ArsyHttpSchedulerAdapter` (default single-host `cp/arsy` HTTP adapter forwarding bearer tokens and W3C `traceparent` propagation).
     - `DurableQueueSchedulerAdapter` (enqueues `"control-plane"` jobs into `@moonwitness/addon-base`'s `ops.job` queue alongside `processControlSchedulerJob` workers).
   - `createControlScheduler` selects `"arsy"` or `"queue"` deterministically via explicit config or `CONTROL_SCHEDULER=queue`.

## Consequences

- Existing single-VPS `cp/arsy` deployments continue working without behavioral changes under default `"permissive"` signing and `"arsy"` scheduler mode.
- Strict verification deployments and multi-worker schedulers share one unified ORM (`ir_addons` + `ops_jobs`) contract without breaking `apps/api` boundaries.
