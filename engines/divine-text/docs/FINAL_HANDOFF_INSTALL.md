# Final Local Install & E2E Handoff

## One-command validation

From the repository root:

```bash
node scripts/install-and-e2e.mjs
```

This performs:

1. Root test suite
2. `ui/npm install`
3. React/Vite production build
4. Local end-to-end test suite
5. Writes `outputs/handoff/INSTALL_E2E_REPORT.json`

## One-command run

After the validation passes:

```bash
npm run start:all
```

The launcher will build React/Vite if needed and then start the local Node server.

Open:

`http://localhost:8787/`

## What to send back

After running `node scripts/install-and-e2e.mjs`, upload:

`outputs/handoff/INSTALL_E2E_REPORT.json`

If the command fails, also upload the terminal output or a ZIP of `outputs/handoff/`.

## Important

The local research engine is deterministic and can run without an AI provider. OpenAI/Gemini are optional adapters only.

The following data sources remain pending until their raw files are actually ingested:

- Full hadith corpus
- Torah/Pentateuch corpus
- Psalms corpus
- Gospel corpus
