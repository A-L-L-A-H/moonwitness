# AI workspace runtime

The AI chat surface uses the canonical web SDK client and the authenticated `/api/v1/ai` routes. Agent discovery is read from `GET /agents`; prompts are submitted through `POST /chat`; the returned execution is rendered with safe text and tool-call summaries.

The UI supports loading, server error, retry, cancellation, persistent owner-scoped thread history, tool-call timeline states, and streaming execution lifecycle updates. AI chat and browser workspace status changes are announced to assistive technology; browser fetch exposes an explicit loading state, labelled result status, and mobile-sized controls. Coding file reads and browser fetch are available through authenticated bounded APIs; repository mutation and browser-agent navigation remain explicit unavailable boundaries because no authoritative mutation contract exists.
