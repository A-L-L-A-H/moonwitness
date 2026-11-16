# BIBLE DOCUMENT ARCHITECTURE v1.0

## A. Canonical hierarchy (Christian Bible)
Bible
├── Old Testament
│   ├── Torah / Pentateuch
│   │   ├── Genesis
│   │   ├── Exodus
│   │   ├── Leviticus
│   │   ├── Numbers
│   │   └── Deuteronomy
│   ├── Historical / Narrative books
│   ├── Wisdom / Poetry
│   │   └── Psalms
│   └── Prophets
└── New Testament
    ├── Gospels
    │   ├── Matthew
    │   ├── Mark
    │   ├── Luke
    │   └── John
    ├── Acts
    ├── Pauline letters
    ├── General letters
    └── Revelation

## B. Research warning
This canonical tree describes Christian Bible structure. It does NOT assert:
- Old Testament = Quranic Taurat
- Psalms = Quranic Zabur in every textual detail
- New Testament = Quranic Injil
- Matthew/Mark/Luke/John = original Injil given to Isa

## C. Textual witness layer
For each biblical book, store witnesses separately:
- Hebrew/Aramaic witnesses
- Greek witnesses
- translations (e.g. Septuagint)
- Dead Sea Scroll witnesses where applicable
- Samaritan Pentateuch where applicable
- Masoretic tradition
- later printed editions

## D. Canon vs text
Canon = which books a community recognizes.
Textual transmission = how the wording of those books is preserved/transmitted.
These are separate research dimensions.

## E. v7.0.0 Evaluation (CRAYON)
Biblical texts are evaluated using the CRAYON framework. Because most modern biblical texts are translations of translations (e.g., Aramaic ➔ Greek ➔ English), the **Interpretation Gap** dimension is scrutinized heavily. Researchers should use the **G (Konteks)** field to note underlying Hebrew/Greek manuscript variants when scoring a passage.
