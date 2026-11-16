# Divine Text Verification v5.0 — Local AI Research Architecture

## Goal
A local-first, zero-dependency research system that can automatically plan, run, score, graph, and report scripture/source evidence without fabricating missing data.

## AI modes
1. Deterministic mode (default): no model required.
2. Optional local model mode: Ollama-compatible HTTP at `127.0.0.1:11434`.

## Core pipeline
Question → research plan → local corpus retrieval → evidence graph → scoring gate → report → optional AI synthesis → human review.

## Safety/research invariants
- PENDING is never interpreted as false or zero.
- Revelation claim, text identity, textual preservation, historical evidence, and interpretation remain separate.
- AI is an assistant, not an evidence source.
- Every AI-generated statement must point to retrieved evidence or be labeled inference.
