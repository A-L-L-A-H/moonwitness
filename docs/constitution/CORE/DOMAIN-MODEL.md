# Shared Domain Vocabulary

**Status:** PROPOSED vocabulary baseline; individual canon entries require source verification  
**Last reviewed:** 2026-11-15

This document defines broad categories, not an assertion that every category is already implemented in software.

## Core entities

| Entity | Meaning | Notes |
|---|---|---|
| Person | A real human participant or author | Keep identity and consent boundaries |
| Character | A fictional or narrative entity | Must have a canon record and provenance |
| Collective | A group identity, team, or creative collective | Not interchangeable with an individual character |
| World | A narrative or conceptual setting | May contain places, timelines, and stories |
| Story | An authored narrative unit | May be fiction, memoir, retelling, or mixed form; label clearly |
| Episode | A bounded installment within a story or series | Has ordering and continuity metadata |
| Event | Something asserted to have occurred | Record source and verification status |
| Observation | A directly noticed or recorded detail | Separate from explanation |
| Source | Material supporting a statement | URL, document, conversation reference, image, or other provenance |
| Interpretation | A proposed meaning or explanation | Attribute to its author; do not upgrade silently to fact |
| Research item | A question, method, source set, and findings | Findings and hypotheses remain distinct |
| Work | A created artifact | Text, image, audio, video, software, or other output |
| Publication | A reviewed release of selected material | Requires explicit approval and publication metadata |
| Memory record | A retained item of personal or project context | Has privacy classification and lifecycle |

## Knowledge classification

Every meaningful record should be classifiable using one or more of these labels:

- FACT / VERIFIED — supported by suitable evidence for the claim.
- REPORTED — stated by a person or source; not independently verified.
- OBSERVATION — directly observed or captured.
- DREAM — remembered dream content.
- RESEARCH — a research process or result with references.
- INTERPRETATION — an attributed explanation or meaning.
- HYPOTHESIS — a proposition awaiting testing.
- COINCIDENCE — a perceived correspondence without established causation.
- FICTION — intentionally invented narrative content.
- JOKE / PLAY — humor or playful material.
- UNKNOWN — insufficient information.

These labels describe epistemic status, not the worth or importance of an experience.

## Canon and identity vocabulary

The following names are known terms in the wider creative context. Their full definitions must be maintained in dedicated canon records and must not be inferred from names alone:

- GOD PROMISE / JANJI ALLAH
- RGBL / SRGBL
- ROCKSOUL
- MYLUFT / MA'LŪF
- Human Pen
- BASS-HUNTER — Blessings, Answers, Signs & Science
- MoonWitness
- IsRockFeel
- WalterWhite
- Mike
- MuthenRossi
- HoneyBee
- The Batteries
- NPD Team
- Riot Creative
- Angel With Shotgun
- Where Myth Fades To Legend

## Relationships

Relationships between people, characters, collectives, stories, and works must be explicit records, not guessed from co-occurrence. A relationship may be confirmed, proposed, disputed, or unknown.

## Minimum provenance fields

Where applicable, a canon or knowledge record should include:
- stable identifier;
- display name;
- category;
- definition or description;
- source references;
- author / speaker;
- status (confirmed, proposed, disputed, unknown, superseded);
- privacy classification;
- created and updated dates;
- change history.

## Important limitation

This vocabulary is a foundation for future schemas. It does not prescribe a database, ORM, API, or storage engine.


## Vocabulary layers

Do not collapse every meaningful phrase into a database entity or UI module. Keep four layers distinct:

1. **Narrative and canon vocabulary** — owner-defined names, characters, stories, spiritual references, and creative concepts. Governed by `CANON/` and the canon/provenance contract.
2. **Product experience language** — labels, metaphors, workspace names, and interaction concepts visible in ROCKSOUL DX or MoonWitness. Governed by product experience contracts.
3. **Domain vocabulary** — stable concepts such as Person, Character, Source, Story, Work, Publication, Memory Record, and relationships. Governed here.
4. **Technical schema vocabulary** — database tables, API fields, event names, and code identifiers. Must be derived from an approved domain model and contracts; it must not redefine canon.

A term may appear in more than one layer, but its meaning and owner must be explicit. Similar wording does not prove identical semantics.

## Relationship semantics — baseline

Relationships are first-class, attributed assertions. At minimum, a relationship record should identify subject, predicate, object, source/provenance, status, author, valid time where known, recorded time, privacy classification, and change history.

A relationship can be CONFIRMED, PROPOSED, DISPUTED, UNKNOWN, or SUPERSEDED. Co-occurrence, shared artwork, or a generated summary is not sufficient evidence to assert a relationship. This is a conceptual requirement, not a finalized database schema.
