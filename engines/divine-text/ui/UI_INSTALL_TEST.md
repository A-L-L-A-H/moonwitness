# UI installation/test status

The UI is implemented as React + Vite + TypeScript.

The local runtime test in the current sandbox cannot complete `npm install` because outbound package-registry access is unavailable. The repository therefore includes a one-command launcher with an automatic bundled-UI fallback.

On a normal machine with npm registry access:

```bash
npm run start:all
```

The launcher will install UI dependencies, build the React app, and then serve both API and UI from `http://localhost:8787/`.
