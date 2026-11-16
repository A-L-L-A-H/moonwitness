# Application Stack v2.3

Active stack:

`React + Vite + TypeScript + shadcn/ui component-source conventions + Tailwind → Node.js local API → SQLite`

Research schema remains **2.0**.

## Development

Vite proxies `/api` to the Node API on `127.0.0.1:4310`.

## Production/local packaged run

The Node API serves the built React SPA from `apps/web/dist`, so the browser and `/api/v2/*` endpoints share one local origin.

## TypeScript truthfulness

- normal frontend typecheck requires actual React/Vite dependencies;
- the offline shim is isolated under `apps/web/types/` and invoked only by `web:typecheck:offline`;
- a source-only offline PASS must not be described as a full React/Vite build PASS.
