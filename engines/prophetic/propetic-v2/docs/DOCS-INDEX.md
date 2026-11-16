# Documentation Index — v2.3.2

Status: **FINAL_HANDOFF_READY_V2_3_2**  
Research schema: **2.0**  
API major: **v2**

> Only documents listed here are active v2.3.2 specifications. Historical material is kept under `docs/archive/` or `reports/archive/`.

## Start here

- [User Guide](project/USER-GUIDE.md) — installation, UI, scoring, API, SQLite, handoff
- [Install & Runbook](project/INSTALL-RUNBOOK.md) — setup/run/verify commands
- [Troubleshooting](project/TROUBLESHOOTING.md) — common install/runtime/E2E problems
- [Issues & Known Limitations](project/ISSUES-KNOWN-LIMITATIONS.md) — fixed/open/external/research boundaries
- [Final Handoff](../HANDOFF.md) — return workflow
- [Handoff Checklist](project/HANDOFF-CHECKLIST.md) — acceptance criteria

## Architecture

- [Architecture](architecture/ARCHITECTURE.md)
- [Architecture Diagram](architecture/ARCHITECTURE-DIAGRAM.md)
- [Application Stack v2.3](architecture/APPLICATION-STACK-v2.3.md)
- [Database Architecture](architecture/DATABASE-ARCHITECTURE.md)
- [SQLite Architecture](architecture/SQLITE-ARCHITECTURE.md)
- [SQLite Runtime v2.3](architecture/SQLITE-RUNTIME-v2.3.md)
- [Web/UI Spec](architecture/WEB-UI-SPEC.md)
- [UI Testing v2.3](architecture/UI-TESTING-v2.3.md)
- [Production E2E Handoff](architecture/E2E-HANDOFF.md)

## Architecture Decision Records

- [ADR Index](architecture/adr/README.md)
- [ADR 0001 — Four-Corpus Source Model](architecture/adr/0001-FOUR-CORPUS-SOURCE-MODEL.md)
- [ADR 0002 — Evidence Score Is Not Prophet Worth](architecture/adr/0002-EVIDENCE-SCORE-NOT-PROPHET-WORTH.md)
- [ADR 0003 — Bible as Witness Container](architecture/adr/0003-BIBLE-AS-WITNESS-CONTAINER.md)
- [ADR 0004 — Release vs Schema Versioning](architecture/adr/0004-RELEASE-VS-SCHEMA-VERSIONING.md)
- [ADR 0005 — React/Vite + Node + SQLite](architecture/adr/0005-REACT-VITE-NODE-SQLITE.md)

## Four Corpus / Bible Witness

- [Four-Corpus Model](corpus/FOUR-CORPUS-MODEL.md)
- [Qur’an Corpus](corpus/quran/QURAN-CORPUS.md)
- [Taurat Corpus](corpus/taurat/TAURAT-CORPUS.md)
- [Zabur Corpus](corpus/zabur/ZABUR-CORPUS.md)
- [Injil Corpus](corpus/injil/INJIL-CORPUS.md)
- [Bible Witness Concept](corpus/bible/BIBLE-WITNESS-CONCEPT.md)
- [Scripture Crosswalk](corpus/SCRIPTURE-CROSSWALK.md)
- [Source Versioning](corpus/SOURCE-VERSIONING.md)
- [Source Editions Registry](../src/data/v2/source-editions.v2.0.json)

## Research / Provenance

- [Research Methodology](research/RESEARCH-METHODOLOGY.md)
- [Provenance Spec](research/PROVENANCE-SPEC.md)
- [Provenance Model](research/PROVENANCE-MODEL.md)
- [Evidence Spec](research/EVIDENCE-SPEC.md)
- [Uncertainty](research/UNCERTAINTY.md)
- [Preference Calibration](research/PREFERENCE-CALIBRATION.md)

## Scoring

- [Scoring Architecture](scoring/SCORING-ARCHITECTURE.md)
- [Scoring Math](scoring/SCORING-MATH.md)
- [Context Scoring](scoring/CONTEXT-SCORING.md)
- [World Trait Scoring](scoring/WORLD-TRAIT-SCORING.md)
- [Scoring Audit v2.3](scoring/SCORING-AUDIT-v2.3.md)

## API

- [API v2](api/API-v2.md)
- [Local API v2.3](api/LOCAL-API-v2.3.md)

## Project governance

- [Repository Structure](project/REPOSITORY-STRUCTURE.md)
- [Audit & Hardening v2.3](project/AUDIT-v2.3.md)
- [Dependency Audit v2.3](project/DEPENDENCY-AUDIT-v2.3.md)
- [TODO](project/TODO.md)
- [Roadmap](project/ROADMAP.md)
- [Changelog](project/CHANGELOG.md)
- [Final Status](project/FINAL-STATUS.md)
- [Milestones v1.4–v2.0](project/MILESTONES-v1.4-v2.0.md)

## Governance rule

TODO/Roadmap items are **not evidence** until implemented, tested, and audited. New P0/P1 defects must be fixed or explicitly block a future final release.
