# DIVINE TEXT VERIFICATION — BLUEPRINT v1.0

## 1. Mission
Membangun sistem penelitian yang membedakan:
- divine/revelation claim
- text identity
- manuscript/transmission evidence
- prophetic report
- historical evidence
- interpretation

Tujuan: verifikasi berbasis bukti, bukan penentuan pemenang agama.

## 2. Core ontology
ALLAH -> DIN -> PROPHET/MESSENGER -> REVELATION/RISALAH -> SCRIPTURE/SHUHUF -> SURVIVING TEXT -> TRANSMISSION -> INTERPRETATION

Important: din, revelation, scripture, surviving text, hadith, tafsir, and historical sources are different entity types.

## 3. Research objects
- Person: prophet/messenger, historical figure
- Revelation: named revelation (e.g. Taurat, Zabur, Injil, Quran)
- Canonical collection: Bible, Old Testament, New Testament
- Book: Matthew, Mark, Genesis, Psalms, etc.
- Manuscript witness
- Variant
- Reading tradition (qira'at)
- Claim
- Evidence item
- Interpretation
- Scholarly source

## 4. Classification levels
L0 UNKNOWN
L1 CLAIM
L2 HISTORICAL
L3 TRANSMITTED_TEXT
L4 PROPHETIC_REPORT
L5 REVELATION_CLAIM
L6 REVELATION_EXPLICIT
L7 TEXTUALLY_STRONG

Level is an evidentiary/source classification, not a ranking of religions.

## 5. Scoring model (Hierarchical Bottom-Up)
The engine utilizes a bottom-up hierarchical scoring system. Evidence is first scored at the lowest textual level (Verse/Passage), which is then mathematically aggregated (averaged) to determine the Chapter score, and finally the Book/Corpus score.

Each piece of evidence is evaluated across five dimensions, each scored 0..max:
- source_quality: 20
- transmission: 25
- proximity: 20
- corroboration: 20
- interpretation_gap: 15 (points awarded for a LOW interpretation gap; higher is better)
Total = 100

If required evidence is missing, score is `pending`, never artificially zero.

## 6. CRAYON Epistemic Framework
Annotations at the verse level follow the CRAYON v1.9 methodology to separate distinct layers of interpretation:
- **R (Information/Fakta)**: Objective textual and historical facts.
- **G (Knowledge/Konteks)**: Surrounding context and linguistic environment.
- **B (Understanding/Makna)**: Exegetical derivation and deeper meaning.
- **L (Wisdom/Hikmah)**: Actionable guidance.
- **Caution (Salah Tafsir)**: Guardrails against known textual or historical corruptions.

## 7. Confidence labels
90-100 VERY_STRONG
80-89 STRONG
70-79 GOOD
60-69 MODERATE
50-59 MIXED
40-49 WEAK
20-39 VERY_WEAK
0-19 UNVERIFIED

## 7. Critical anti-bias rules
1. Do not equate Quranic Injil with Matthew/Mark/Luke/John automatically.
2. Do not equate Quranic Taurat with the whole Old Testament automatically.
3. Do not equate Bible with a single book.
4. Do not equate hadith with revelation.
5. Do not treat tafsir as Quranic text.
6. Do not treat manuscript age as proof of divine origin.
7. Apply identical audit criteria across traditions.
8. Record contrary evidence, not only confirming evidence.
9. Preserve uncertainty and provenance.
10. Separate metaphysical claims from historical/textual claims.

## 8. Research phases
P0 Protocol freeze
P1 Quranic 25-prophet map
P2 Muhammad case study: Quran/Hadith/Sunnah/Sirah/Tafsir
P3 Musa/Taurat -> Torah/Pentateuch -> DSS/MT/LXX/SP
P4 Dawud/Zabur -> Psalms textual history
P5 Isa/Injil -> Gospels + textual history
P6 Bible canon architecture
P7 Cross-scripture thematic comparison
P8 Scoring + contradiction/uncertainty audit
P9 Research paper + reproducible data release

## 9. Final outputs
- master knowledge graph
- evidence database
- source registry
- claim cards
- scorecards
- timeline
- research paper
- reproducible code and tests
