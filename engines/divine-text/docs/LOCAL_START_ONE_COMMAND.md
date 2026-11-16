# One-command local startup

From the repository root:

```bash
npm run start:all
```

What it does:

1. Checks for the React/Vite UI dependencies and build output.
2. If missing, runs `npm install` inside `ui/` and `npm run build`.
3. If dependency installation/build is unavailable, automatically falls back to the bundled local UI.
4. Starts the Node research API/server.
5. Serves the React build (when available) from the same local origin; otherwise serves the bundled fallback UI.

Open:

`http://localhost:8787/`

No second terminal is required.

For a strict offline start that never attempts npm installation:

```bash
npm run start:all:fallback
```
