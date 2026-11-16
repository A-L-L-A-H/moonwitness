# AI Providers — v5.1

Ollama is removed from the supported provider path.

The engine supports:
- `deterministic` (default, no network)
- `openai` via the Responses API
- `gemini` via the Gemini API

Environment variables:

```text
DTV_AI_PROVIDER=deterministic|openai|gemini
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.7-flash
```

For Gemini, `GOOGLE_API_KEY` is also accepted as a fallback authentication variable.

Keys are server-side only. Never put them in browser JavaScript.

The research engine remains evidence-first: an AI provider synthesizes retrieved evidence, but is not itself treated as evidence.
