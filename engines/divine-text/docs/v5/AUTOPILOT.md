# Deterministic Local Autopilot

The autopilot is a local-first task runner. It works without an AI provider.

## Flow

QUESTION -> PARSE -> ENTITY RESOLUTION -> LOCAL CORPUS RETRIEVAL -> EVIDENCE GRAPH -> SCORING -> REVIEW GATE -> REPORT

## Safety / research rules

- Missing evidence is `PENDING`, never score 0.
- Unresolved scripture identity remains `REVIEW_REQUIRED`.
- The autopilot never invents manuscripts or corpus records.
- Each task is checkpointed to `data/autopilot/state.json`.
- The run can resume after interruption.

## Run

```bash
node src/autopilot/engine.mjs --question "Apakah Matthew dapat diidentifikasi sebagai Injil yang diberikan kepada Isa?"
```

Output: `outputs/AUTOPILOT_REPORT.json`

This is local automation, not a background service controlled by ChatGPT.
