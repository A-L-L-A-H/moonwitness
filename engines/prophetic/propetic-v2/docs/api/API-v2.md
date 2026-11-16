# API v2 — Active Local Contract (v2.3)

Build/start from repository root:

```bash
npm run api:build
npm run api:start
```

Default base URL: `http://127.0.0.1:4310/api/v2`

## Core endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | release, SQLite/read-model health and fingerprints |
| GET | `/prophets` | compact list of 25 profiles |
| GET | `/prophets/:id` | one research profile |
| GET | `/leaderboards` | separated research leaderboard families |
| GET | `/corpus` | four-corpus registry |
| GET | `/docs` | documentation registry |
| GET | `/validation` | generated validation report |
| GET | `/scoring-audit` | score/matcher diagnostics |
| GET | `/source-editions` | source-edition/version registry |
| GET | `/conflicts` | claim-specific conflict cases |
| GET | `/preference/status` | uncalibrated/calibrated Human Preference report |
| GET | `/relation-scores` | relation-score report |
| GET | `/profile-data-scores` | profile data-confidence report |

## Global graph documents

- `GET /provenance`
- `GET /timeline`
- `GET /events`
- `GET /genealogy`
- `GET /uncertainty`

## Prophet-scoped query endpoints

- `GET /prophets/:id/provenance`
- `GET /prophets/:id/events`
- `GET /prophets/:id/relations`
- `GET /prophets/:id/timeline`

These scoped routes are preferred by the React UI to avoid downloading unrelated global graph documents.

## Health example

```json
{
  "ok": true,
  "version": "2.3.2",
  "database": "sqlite",
  "prophetCount": 25,
  "dbSchemaVersion": "2.3",
  "dataSchemaVersion": "2.0",
  "seedFingerprint": "<sha256>",
  "schemaFingerprint": "<sha256>"
}
```

## HTTP behavior

- local API supports `GET` and `OPTIONS`;
- unsupported methods return `405` JSON;
- unknown API paths/profile IDs return `404` JSON;
- development CORS accepts Vite on `127.0.0.1:5173` and `localhost:5173`;
- built production UI is served same-origin by the Node server.

## Guardrails

Responses expose research data, not theological verdicts. Source labels and uncertainty are retained. Leaderboard families must remain separate unless a future composite policy is explicitly versioned and calibrated.
