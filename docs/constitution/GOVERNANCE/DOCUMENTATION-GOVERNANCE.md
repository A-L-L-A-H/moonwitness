# Documentation Governance

**Status:** DECIDED policy  
**Scope:** Shared foundations and product contracts in A-L-L-A-H/master-docs.

## 1. Document authority
- Master vision and accepted ADRs govern cross-product direction.
- Product masters govern product promise, audience, scope, and non-goals.
- Core ontology and canon records govern terminology and narrative/knowledge identity.
- Contracts govern interfaces, data exchange, permissions, lifecycle, and compatibility.
- Roadmaps sequence work but do not override accepted decisions.
- Implementation code must conform to accepted contracts; code does not silently rewrite them.

## 2. Required metadata
Every core/contract document should identify title and stable path, status, owner or approving authority, scope/non-goals, dependencies, last-reviewed date, and material change history. Do not invent owners or approval dates; use TBD if unknown.

## 3. Evidence discipline
Distinguish explicitly:
- **Owner statement:** explicitly supplied by the product owner.
- **Source fact:** supported by a suitable primary source.
- **Observation:** directly observed or recorded.
- **Interpretation:** attributed explanation.
- **Proposal:** recommendation awaiting decision.
- **Unknown:** not established.

Do not present dreams, coincidences, hypotheses, interpretations, or generated summaries as independently verified facts.

## 4. Canon and corrections
- Preserve exact owner-provided names and wording.
- Keep one stable canon entry per meaningful entity or term.
- Record source references and provenance.
- Keep contradictions visible until resolved.
- Corrections supersede prior entries; do not silently erase meaningful history.
- AI-generated definitions remain proposals until approved.

## 5. Change workflow
1. Identify affected documents and their authority.
2. Read dependencies and accepted ADRs before editing.
3. State reason and expected impact.
4. Update dependent documents in the same change set where possible.
5. Check terminology, links, status, and consistency.
6. Run Markdown lint and review the diff.
7. Record an ADR when direction, privacy, security, or architecture changes.

## 6. Avoid duplication
Maintain one authoritative home per concept. Link to it instead of copying long definitions. Mark unavoidable copies as summaries. Maintain a document index and dependency map.

## 7. AI agent rules
Agents must read source docs, distinguish decisions from proposals, never infer new canon, never broaden private data access, produce traceable change summaries, surface conflicts instead of guessing, and require evidence before marking work complete.

## 8. Review gates
Review vision, product masters, ontology, contracts, privacy boundaries, terminology, provenance, status, dependencies, feasibility, and testable acceptance criteria as one connected system.