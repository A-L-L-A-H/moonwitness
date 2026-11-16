# v5 Runbook

## Start
`node src/server-v5.mjs`

Open `http://localhost:8787/`.

## API
- GET `/api/health`
- GET `/api/report`
- GET `/api/claims`
- GET `/api/graph`
- GET `/api/research/plan?topic=isa`
- GET `/api/research/run?topic=isa`
- POST `/api/scoring`
- POST `/api/ai/ask`

## Optional local AI
Set `DTV_AI_MODEL` and run an Ollama-compatible server on `127.0.0.1:11434`. If unavailable, deterministic research remains fully functional.
