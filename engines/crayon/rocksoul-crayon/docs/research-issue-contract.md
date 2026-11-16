# ROCKSOUL Research Issue Contract v1

> **ISSUE FIRST. SOURCE SECOND. CANON LAST.**

Every scheduled ROCKSOUL research lane uses the same operational envelope before domain-specific research diverges.

## Atomic flow

```text
DISCOVERY
  ↓
OWNER-REPO GITHUB ISSUE
  ↓
STEWARD TRIAGE
  ↓
needs_sources / hold / duplicate
  ↓
SOURCE INSPECTION
  ↓
reviewable domain extraction
  ↓
canonical promotion
  ↓
issue → merged / closed
```

A research issue is not evidence and is not canon. It is the auditable parent of the work.

## Titles

```text
[AUTO-RESEARCH] STORY · ...
[AUTO-RESEARCH] EVENT · ...
[AUTO-RESEARCH] PERSON · ...
[AUTO-RESEARCH] TEXT · ...
[AUTO-RESEARCH] LAW · ...
[AUTO-RESEARCH] PERSPECTIVE · ...

[RESEARCH] DOMAIN · ...   # human/manual lead
```

## Human-readable issue body

Each issue contains, in this order:

1. domain hero image from `rocksoul-assets/main`;
2. Research Card — domain, owner, state, lane, origin, discovery time;
3. Research Question;
4. Why This Matters;
5. Discovery Snapshot;
6. Source Candidates;
7. Domain Lens;
8. Counterevidence & Uncertainty;
9. Coverage Gaps / Missing Voices;
10. Duplicate Check;
11. Cross-Domain Routing;
12. Steward Gate;
13. Suggested Next Action;
14. Machine Metadata.

## Machine metadata

Every automated issue ends with:

```text
ROCKSOUL-RESEARCH-CONTRACT:v1
ROCKSOUL-RESEARCH-DOMAIN:<DOMAIN>
ROCKSOUL-RESEARCH-OWNER:<rocksoul-repo>
ROCKSOUL-RESEARCH-ORIGIN:<origin>
ROCKSOUL-RESEARCH-FP:<fingerprint>
ROCKSOUL-RESEARCH-STATE:<state>
```

Existing domain-specific markers may remain temporarily for backward compatibility, but new automation must emit the generic envelope.

## Domain-specific lenses

The envelope is common; epistemology is not.

- STORY: narrative provenance, variants, transmission, motifs, claim framing.
- EVENT: chronology, place, event evidence, counterevidence, alternative reconstruction.
- PERSON: identity, agency, proximity, authorship/witness/transmission chain.
- TEXT: exact work/expression/edition/passage, witness, variant, attribution, provenance.
- LAW: authority, jurisdiction, legal force, applicability, temporal status, holdings.
- PERSPECTIVE: actor class, geography, language, framing, position, reaction, missing voices.
- RELATIONSHIP: support, counterevidence, alternatives, provenance; event-driven only.

## Visuals

Hero images improve review ergonomics only. They are sourced from `rocksoul-assets/main` and never count as evidence.

## Closure rule

An issue should remain open while research is actionable. After successful promotion:

```text
canonicalized
→ merged
→ issue closed with canonical IDs / refs / commit
```

Rejected/duplicate leads are closed with the reason and any target issue/record link.

## Shared clocks

Shared scheduling never means shared canonical reasoning.

```text
MFTL pass → finish → context reset → LEGEND pass
RGBL pass → finish → context reset → SUPERHERO pass
```

The issue contract is shared; the canonical mind is not.


## Deterministic decision → lifecycle mapping

Machine Stewards may use internal decision names, but issue state must stay inside the shared lifecycle:

```text
stage_candidate → needs_sources
needs_sources   → needs_sources
hold            → triaged
duplicate       → duplicate → CLOSED (not planned)
```

Internal decision labels may remain in legacy domain markers for backward compatibility. The generic `ROCKSOUL-RESEARCH-STATE` marker is the canonical lifecycle state.
