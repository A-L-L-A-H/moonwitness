# PHASE 2 — MUHAMMAD ﷺ CASE STUDY

## Objective
Audit source layers connected to Muhammad ﷺ without collapsing revelation, prophetic reports, biography, and interpretation into one category.

## Source layers
1. Qur'an — revelation text / revelation claim.
2. Hadith — reports attributed to the Prophet; audit isnad and matn separately.
3. Sunnah — practice/tradition attributed to the Prophet; trace to reports and practice evidence.
4. Sirah — historical biography; record source date/provenance.
5. Tafsir — interpretation; do not store as Qur'anic text.

## Hadith audit protocol
For each hadith claim:
- capture exact collection + book/chapter/hadith identifier;
- preserve matn separately from isnad;
- normalize the chain into ordered narrator nodes;
- audit narrator reliability using the relevant rijal/jarh wa-ta'dil evidence;
- audit chain continuity and contemporaneity;
- compare parallel routes and wording variants;
- assess matn against chronology, Qur'an, stronger reports, and known textual history;
- record classical classification separately from modern historical assessment;
- never translate a classical label (sahih/hasan/da'if) into an automatic metaphysical certainty score.

## Evidence principle
A hadith can be strongly supported as a transmitted report without becoming revelation. A Qur'anic verse can be explicit revelation within the Islamic source tradition without a manuscript study proving metaphysical divine authorship.

## Output
Each claim becomes an Evidence Card with:
claim_id, source_type, source_level, reference, evidence_items, contrary_evidence, textual_assessment, historical_assessment, score_status, score, confidence, notes.
