# CRAYON Public API Deprecation Policy

Status: beta admission candidate for #116 / #118

CRAYON may evolve quickly during alpha, but no release may silently change the meaning of an existing semantic contract. Beta introduces a stronger public API compatibility promise.

## Classification

Public exports are classified in `docs/PUBLIC-API.md` as:

- **freeze candidate / stable candidate** — intended to survive beta without breaking removal;
- **alpha-flexible / experimental** — may change, but semantic meaning still cannot drift silently;
- **internal/private** — not a public compatibility promise.

Repository source paths, Lab internals, and private workspace packages are not public API.

## Deprecation rules after beta admission

1. A stable public API must be marked deprecated before removal.
2. Deprecation documentation must name the replacement or explain why no replacement is valid.
3. Removal requires at least **one full minor beta release line and 30 calendar days**, whichever is longer, unless an actively exploitable security flaw requires faster removal.
4. A deprecated API must remain behaviorally truthful until removal; it may not become an alias whose semantics differ from the old contract.
5. Breaking semantic changes require release notes, migration/rejection behavior, and an explicit reason.
6. Snapshot/RIR semantic meaning is versioned independently from package API names; a renamed API cannot silently reinterpret an old document version.
7. Security emergency removals must be called out as such and must prefer fail-closed behavior over compatibility that weakens authority/truth guarantees.

## Release notes requirement

Every release containing a public deprecation must state:

- affected package/export;
- first deprecated version;
- replacement/migration path;
- semantic impact;
- earliest removal release/date under the policy;
- whether stored Snapshot/RIR data is affected.

## Freeze rejection rule

A freeze candidate is not automatically stable. Before v1, CRAYON may reject a proposed freeze when real integration evidence shows a missing abstraction or an accidental public surface. Rejection must be documented rather than preserving a bad API merely for cosmetic stability.

## Forbidden compatibility shortcuts

- silent alias to a different semantic meaning;
- `unknown` becoming `false`/`success` for compatibility;
- deprecated authority/execution APIs bypassing new safety checks;
- dropping witness/provenance because an older consumer did not expose it;
- renderer-specific compatibility changing core semantics.

The compatibility promise is subordinate to CRAYON's truth and authority invariants, but breaking changes must remain explicit, explainable, and migration-aware.