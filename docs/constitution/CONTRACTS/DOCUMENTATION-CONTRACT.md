# Documentation Contract

**Status:** DECIDED  
**Version:** 1.0.0

## Purpose

Keep this repository understandable, auditable, and safe to evolve. It is the documentation source of truth for ecosystem decisions, not a duplicate of every source file in the application repositories.

## Required document metadata

Every normative specification should include:
- Title
- Status: DRAFT, PROPOSED, DECIDED, IMPLEMENTED, PARTIAL, UNVERIFIED, DEFERRED, or SUPERSEDED
- Owner
- Version where it defines a contract
- Last reviewed date
- Source references where claims depend on external material or repository state

## Normative language

- **MUST / MUST NOT**: mandatory requirement.
- **SHOULD / SHOULD NOT**: strong recommendation; deviations require a reason.
- **MAY**: optional behavior.
- **UNKNOWN**: evidence is insufficient.
- **TBD**: a decision or value is still required.

## Decision classes

1. Product-owner decision.
2. Canon / narrative source.
3. Engineering recommendation.
4. Repository-verified implementation fact.
5. Open question.

Do not present classes 2–5 as class 1.

## Source of truth

- Product direction and cross-product contracts: this repository.
- Application implementation: each product's own repository.
- Character and story canon: canon records here, linked to original source material where available.
- Current implementation status: verified repository evidence, with the branch and commit recorded.

If sources conflict, record the conflict and ask for resolution. Do not silently overwrite history.

## Document structure

Prefer short, focused documents with stable links. Use:
- `MASTER/` for ecosystem-wide direction.
- `CORE/` for shared concepts and invariants.
- `CONTRACTS/` for normative agreements.
- Product folders for product-specific requirements.
- `CANON/` for narrative and knowledge records.
- `GOVERNANCE/` for process and decisions.

## Change workflow

1. Identify the owning product or shared concern.
2. Update the relevant specification.
3. Update the decision log if a decision changes.
4. Update contracts and version numbers when required.
5. Record implementation status separately from specification status.
6. Link the implementation PR/commit when verified.

## Quality gate

A change is not ready if it:
- confuses proposal with approved canon;
- exposes private data by default;
- blurs the product boundary;
- invents character or spiritual definitions;
- lacks acceptance criteria for a normative requirement;
- claims implementation without repository evidence.
