# Application Stack v2.2

Release **2.2.0** changes the application stack without changing research schema **2.0**.

## Frontend

- React 18
- Vite 6
- TypeScript
- shadcn/ui source-component convention (`apps/web/src/components/ui` + `components.json`)
- Tailwind CSS

The browser never reads research JSON directly. It calls `/api/*` only.

## Backend

- Node.js 22 local HTTP API
- TypeScript
- No external web framework
- CORS limited to the local Vite origin in development

## Database

- SQLite via Node 22 `node:sqlite`
- WAL mode
- `prophets` table for profile lookup
- `documents` table for research registries/reports
- research JSON is used only as deterministic seed material

## Runtime flow

```text
React/Vite/shadcn/Tailwind
          |
          v
   Node Local API
          |
          v
       SQLite
          |
          v
Research schema 2.0 / evidence engine
```

## Version rule

`release_version = 2.2.0` while `schema_version = 2.0`. No evidence formula or research meaning changed in this migration.
