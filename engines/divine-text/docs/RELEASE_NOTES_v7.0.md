# Release Notes - v7.0.0 (The Epistemic Engine Update)

**Release Date:** August 2026

Version 7.0.0 represents a massive architectural leap for the Divine Text Verification Engine. We have transitioned from a passive corpus analyzer to a fully interactive, bottom-up epistemic research workbench. 

## Key Features & Major Changes

### 1. CRAYON Epistemic Framework Integration
The core ontology now explicitly supports the **CRAYON Framework v1.9** (R-G-B-L layer analysis) directly at the verse/passage level. 
- Researchers can annotate verses with:
  - **R (Information / Fakta)**: Textual and historical facts.
  - **G (Knowledge / Konteks)**: Surrounding historical, linguistic, and textual context.
  - **B (Understanding / Makna)**: Exegetical and semantic meaning.
  - **L (Wisdom / Hikmah)**: Actionable guidance and holistic wisdom.
- **Caution/Guardrail (`salah_tafsir`)**: Dedicated tracking for known corruptions, misinterpretations, or contextual errors.

### 2. Bottom-Up 5-Dimension Evidentiary Scoring
The `BLUEPRINT.md` 5-dimension scoring model (Source Quality, Transmission, Proximity, Corroboration, Interpretation Gap) is now fully interactive and hierarchical.
- **Verse-Level Input**: Researchers assign scores (Max 100) per verse.
- **Mathematical Aggregation**: A new backend service (`src/scoring-aggregator.mjs`) automatically calculates rolling averages to determine the score of the parent Chapter (Surah) and Book.
- **Hierarchical Tree View**: The global "Scoring" tab has been redesigned to display a transparent, expandable tree showing exactly how the engine derived a corpus's global score.

### 3. Dashboard UI Overhaul (Light Theme)
The frontend (`ui/src/main.tsx`) has been completely redesigned with premium modern aesthetics:
- Transitioned to a clean, highly legible **Light Theme** for sustained reading comfort.
- **Dynamic Metric Cards**: The Dashboard now displays beautiful gradient cards tracking *Global Score*, *Books Annotated*, *Grounded Claims*, and *Active Evidence Nodes*.
- **Integrated Scripture Search**: The Qur'an Arabic Search is now embedded directly in the Reader, allowing researchers to search and instantly jump to the contextual Surah with a single click (`➦`).

### 4. Backend Refactoring & Stability
- Re-architected `corpus-manager.mjs` to function as a native ES Module export rather than relying on sequential child process spawning (`exec/exit`). This drastically reduced `ECONNREFUSED` proxy drops, cleared terminal log spam, and stabilized the Vite-to-Backend API proxy.
- Dropped hardcoded dropdown menus in the Reader (e.g., hardcoded Hadith books) in favor of dynamic mapping powered directly by `registry.json`.

## Migration Notes
- All `v6.x` local research data remains fully compatible.
- Any annotations saved prior to v7.0.0 without the 5-dimension score object will be gracefully handled and computed as 0 until manually re-evaluated by the researcher.
