# RGBL v0.9 — Empirical Protocol & Annotation Design

## Purpose
v0.9 makes RGBL *study-ready*. It does not claim that an empirical study has already been performed.

## Primary research questions
1. **Classification reliability:** can independent analysts assign claims to R1/G2/B3/L4 consistently?
2. **Traceability:** does RGBL increase explicit source/dependency linkage?
3. **Unknown honesty:** does RGBL reduce unsupported completion when evidence is missing or conflicting?
4. **Calibration:** do confidence judgments track later observable outcomes where outcomes exist?
5. **Decision quality:** are L4 actions more proportionate to evidence, risk, and reversibility?

## Unit of study
A study case has a stable `id`, domain, question, split, SHA-256 content hash, synthetic/empirical marker, and governance metadata. An annotation record belongs to a case, analyst, and run and preserves each analyst's original labels.

## Splits
- `development`: visible during method/tool development.
- `validation`: used for tuning rubric/application rules after development.
- `holdout`: blinded until protocol and scoring are frozen.
- `adversarial`: cases intentionally constructed to stress known failure modes.

Holdout cases may not share identical content hashes with development or validation cases. Paraphrase leakage must also be reviewed manually; hash checks catch exact duplication only.

## Annotation procedure
1. Analysts receive the case without another analyst's labels.
2. Record R/G/B/L labels before adjudication.
3. Record claim type, source/provenance, confidence, UNKNOWN reason, and transition support when applicable.
4. Do not edit original annotations after disagreement is discovered; adjudication is a separate record.
5. For HUMAN/JUSTICE cases, separate observed behavior from inferred intention.
6. For ALLAH/theology cases, preserve observable signs, philosophical inference, and revelation-based theological claims as distinct source classes.

## Human-subject boundary
Personal or sensitive real-world cases require appropriate consent/governance, minimization, and de-identification. This repository ships schemas and synthetic fixtures only; it is not an ethics approval.

## Empirical gate
v0.9 is complete when the protocol, schemas, and validators exist. Scientific evidence begins only when independently collected annotations/outcomes are analyzed and reported.
