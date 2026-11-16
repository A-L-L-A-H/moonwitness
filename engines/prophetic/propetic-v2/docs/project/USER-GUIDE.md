# User Guide — Prophet Research Engine v2.3.2

This guide is for researchers, reviewers, and local testers using the packaged application.

## 1. What this application is

Prophet Research Engine is an auditable research explorer for the conventional 25-name prophetic dataset. It separates:

- identity / RID modeling;
- ASMA / Divine-attribute relations;
- mission, events, timeline, and genealogy;
- Qur’an-first provenance with Taurat, Zabur, and Injil as labeled supplementary witnesses;
- religion / region / language context;
- conflict and uncertainty;
- research scoring and separated leaderboards.

It does **not** rank prophetic worth, convert research indices into theological verdicts, or treat modern geography as ancient nationality.

## 2. Easiest installation

### Windows

1. Install Node.js 22.16+ or a newer verified LTS.
2. Extract the release ZIP to a writable folder.
3. Double-click `INSTALL-WINDOWS.cmd`.
4. Double-click `RUN-WINDOWS.cmd`.
5. Open `http://127.0.0.1:4310` if the browser does not open automatically.
6. After testing, double-click `VERIFY-WINDOWS.cmd`.

### macOS / Linux

```bash
./INSTALL.sh
./RUN.sh
# another terminal
./VERIFY.sh
```

### npm equivalents

```bash
npm run setup:e2e
npm start
npm run verify
```

A lighter non-browser verification is:

```bash
npm run verify:handoff
```

## 3. Main UI views

### Profile
Select any of the 25 profiles. Review RID, identity layers, mission slots, status, and context.

### Provenance
Shows claim-level evidence for the selected profile. Source, passage, confidence, and uncertainty remain visible.

### Timeline & Relations
Shows event nodes, relative chronology, genealogy, and related profiles. Chronology is intentionally conservative where exact dates are not established.

### Leaderboards
Leaderboard families are separate by design:

- Trait Evidence;
- Data Confidence;
- Context Evidence;
- World Trait Salience;
- Human Preference status;
- Composite status.

Never read these as a ranking of prophetic worth.

### Four Corpus
Explains the source policy:

`QUR’AN → TAURAT → ZABUR → INJIL`

Qur’an is core / muhaimin. The other three are supplementary textual witnesses and retain source labels.

### Architecture & Docs
Shows the active documentation registry and system boundaries.

## 4. How to read a score

A score is a research index, not a probability of divine truth.

- `Trait Evidence` measures textual/lexical support for a trait relation.
- `Data Confidence` measures profile-data completeness and evidence quality.
- `Context Evidence` measures provenance quality for religion/region/language context.
- `World Trait Salience` is a research index based on mapped external character-strength literature.
- `Human Preference` remains uncalibrated until real observations exist.
- `Composite` remains disabled while required empirical components are uncalibrated.

When scores tie, the UI should preserve the tie rather than invent a decimal tie-breaker.

## 5. How to read source labels

- `Q5/Q4/Q3/Q2/Q1` are Qur’an-centered evidence/model classes.
- `S3/S2/S1` are supplementary Taurat/Zabur/Injil witness classes.
- `T1` is tafsir/traditional identification.
- `E0` is unknown / insufficient evidence.

Supplementary evidence is never relabeled as Qur’anic evidence.

## 6. API use

Base URL:

`http://127.0.0.1:4310/api/v2`

Useful endpoints:

```text
GET /health
GET /prophets
GET /prophets/:id
GET /prophets/:id/provenance
GET /prophets/:id/events
GET /prophets/:id/relations
GET /prophets/:id/timeline
GET /leaderboards
GET /corpus
GET /docs
GET /scoring-audit
GET /validation
```

The active API is read-only (`GET`/`OPTIONS`).

## 7. SQLite

SQLite is a **derived local read-model**. Canonical research JSON remains source-of-truth.

Database path:

`data/sqlite/prophet-research-v2.3.sqlite`

To rebuild it:

```bash
npm run db:reset
```

Seed and schema fingerprints protect against stale derived data.

## 8. Verification and handoff back

Run:

```bash
npm run verify
```

Then return:

`handoff/HANDOFF-RESULT.json`

If browser E2E fails, also return:

- `playwright-report/`;
- terminal output or screenshot;
- modified repository ZIP if you changed code/data.

## 9. Safe interpretation rules

Always preserve these distinctions:

- ASMA relation ≠ identity with Allah;
- name-root source language ≠ proven spoken language;
- modern geography crosswalk ≠ ancient nationality;
- traditional identification ≠ direct Qur’anic wording;
- score ≠ prophetic rank;
- uncalibrated index ≠ probability.
