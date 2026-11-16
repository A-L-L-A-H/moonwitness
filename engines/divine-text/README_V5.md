# Divine Text Verification Engine v5.0

Local-first, zero-dependency JS research engine with deterministic evidence auditing and optional local AI (Ollama-compatible).

## Quick start
`node src/server-v5.mjs`

Open: `http://localhost:8787/v5.html`

## Default AI behavior
Deterministic research is always available. Local AI is optional and never treated as evidence.

## AI providers (v5.1)

Ollama is not required. The local app can optionally call general cloud AI providers from the server:
- OpenAI Responses API
- Gemini API

The deterministic mode remains the default. API keys stay server-side in environment variables.
