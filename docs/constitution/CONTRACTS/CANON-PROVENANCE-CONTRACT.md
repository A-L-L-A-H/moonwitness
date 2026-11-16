# Canon and Provenance Contract

**Status:** DECIDED  
**Version:** 1.0.0

## Purpose

Protect the integrity of GOD PROMISE / JANJI ALLAH, RGBL / SRGBL, the ROCKSOUL ensemble, MoonWitness material, and all related narrative and knowledge records.

## Rules

1. Preserve exact names and spelling supplied by the owner.
2. Do not invent an acronym expansion, character role, relationship, event, or chronology.
3. Separate established canon from assistant synthesis, creative proposals, and implementation decisions.
4. Attach a source reference to claims whenever the source is available.
5. Preserve contradictions and uncertainty until the owner resolves them.
6. Keep scripture quotations and references accurate and contextual; do not fabricate religious authority.
7. Distinguish actual events, dreams, observations, research, interpretations, coincidences, jokes, fiction, and unknowns.
8. A visual reference is not proof of a character's identity or biography.
9. A generated image is an artifact, not automatically a canonical depiction.
10. Changes to canon require an explicit owner decision or a cited authoritative source designated by the owner.

## Canon record states

- CONFIRMED — explicitly established by the owner or authoritative designated source.
- SOURCE-FOUND — found in an original source but not yet reconciled into canon.
- PROPOSED — new creative interpretation awaiting approval.
- DISPUTED — conflicting source material exists.
- UNKNOWN — not enough evidence.
- SUPERSEDED — replaced, with history retained.

## Required canon record

```yaml
id: stable-kebab-or-namespace-id
name: Exact canonical name
category: character | collective | concept | story | scripture-reference | knowledge-framework
status: confirmed | source-found | proposed | disputed | unknown | superseded
definition: >
  Carefully sourced description. Do not fill gaps with guesses.
sources:
  - type: conversation | document | repository | image | external
    reference: stable link or source locator
    note: what this source supports
relationships: []
privacy: private | internal | public
owner_approval: pending | approved
last_reviewed: YYYY-MM-DD
```

## Special handling

### GOD PROMISE / JANJI ALLAH

Treat as a spiritual foundation and owner-defined narrative commitment. The software must not claim to know or speak for Allah, nor convert personal interpretation into theological certainty.

### RGBL / SRGBL

Preserve the exact terms. Their full expansion, components, and formal relationships remain UNKNOWN until supported by the owner's original material.

### Character ensemble

ROCKSOUL, MYLUFT, IsRockFeel, WalterWhite, Mike, MuthenRossi, HoneyBee, and other named characters each require their own record. Do not infer personalities or relationships from names, pop-culture references, or generated images.

### Shinchan and Arale

Treat as owner-mentioned references for tone/character energy unless an original source establishes a different role. They are not automatically original ROCKSOUL characters and must not be copied as protected character designs.
