# Core Architecture Principles

**Status:** DECIDED principles; implementation choices remain open  
**Last reviewed:** 2026-11-15

These principles constrain architecture without prematurely choosing a framework, database, hosting provider, or programming language.

## 1. Product autonomy

ROCKSOUL DX and MoonWitness must be independently buildable, testable, deployable, and usable. Cross-product integration is optional.

## 2. Clear ownership

Every data entity and capability has one authoritative owner. Copies and projections must identify their source and refresh policy.

## 3. Local/private boundary

ROCKSOUL DX is a private desktop product. Its architecture must make local/private data boundaries explicit. Cloud features, if any, require a separate threat model and opt-in decision.

## 4. Explicit ports and contracts

External providers, AI models, storage engines, and integrations should sit behind explicit interfaces where practical. Avoid coupling domain logic to one vendor before the trade-off is accepted.

## 5. Simplicity before distribution

Do not split a component into a separate service merely because it can be. Prefer the simplest architecture that satisfies reliability, privacy, and product requirements.

## 6. Validate at boundaries

Validate imported files, API requests, plugin inputs, publishing packages, and AI-generated structured output. Treat external content as untrusted data.

## 7. Provenance travels with content

Content exports and research records should retain source, author, timestamps where known, epistemic labels, and privacy classification.

## 8. Reversible operations

Prefer explicit preview, confirmation, backup, and rollback for destructive or externally visible operations.

## 9. Observability without leakage

Logs and diagnostics should help investigate failures without unnecessarily collecting private content, credentials, or personal data.

## 10. Accessibility and graceful degradation

Core tasks must remain usable with reduced motion, keyboard navigation, reasonable contrast, and unavailable AI/network services.

## 11. Test contracts, not only components

Test data boundaries, privacy rules, authorization, import/export, compatibility, and failure behavior in addition to unit and UI behavior.

## 12. Evidence-based readiness

Build success, test success, preview deployment, production deployment, backup verification, and security readiness are distinct claims and must be reported separately.
