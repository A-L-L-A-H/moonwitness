# Architecture Guardrails

`packages/kernel` MUST remain platform-agnostic and domain-agnostic.

## Forbidden concepts in kernel source

UI/platform concepts:
- React
- CSS
- browser
- screen
- button
- card
- modal
- hover
- click
- pixel
- color

Domain-specific concepts must also stay outside the kernel, including examples such as:
- banking / bank
- invoice
- email
- ERP
- server

The kernel may model universal semantics such as entity, relation, observation, knowledge, possibility, consequence, transition, authority, reconciliation, and witness.

## Dependency direction

`kernel <- physics <- RIR <- renderer`

A later renderer may depend on the kernel. The kernel must never depend on physics, RIR, renderer packages, or UI frameworks.

## Executable architecture guard

`tests/architecture-guard.test.mjs` scans every TypeScript file under `packages/kernel/src` and fails when forbidden UI/platform/domain terms or forbidden dependency directions appear.

The test also contains an intentionally prohibited in-memory fixture to prove the guard itself detects violations.

## Exception process

Do not bypass the guard with renamed aliases or obfuscation.

If a future universal semantic concept happens to collide with a forbidden word:

1. open an architectural decision record explaining why the concept is universal rather than platform/domain-specific;
2. demonstrate the same semantic need in at least three unrelated falsification domains;
3. document why moving the concept to an adapter/layer above kernel is insufficient;
4. update this document and the guard in the same reviewed change;
5. keep any allowlist entry exact and path-scoped rather than disabling a rule globally.

There are currently no architecture-guard exceptions.
