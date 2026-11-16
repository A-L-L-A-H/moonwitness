# Local API v2.2

Base URL in development: `http://127.0.0.1:4310/api/v2`.

Active application routes:

- `GET /health`
- `GET /prophets`
- `GET /prophets/:id`
- `GET /leaderboards`
- `GET /corpus`
- `GET /docs`
- `GET /provenance`
- `GET /timeline`
- `GET /events`
- `GET /genealogy`
- `GET /uncertainty`
- `GET /validation`

The React app accesses these routes through the Vite `/api` development proxy. The API reads SQLite, not browser-visible JSON files.
