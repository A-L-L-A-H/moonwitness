# Web/UI Specification v2.3

## Active stack

React + Vite + TypeScript + shadcn/ui component-source conventions + Tailwind.

## Goal

The UI must make provenance and uncertainty understandable before emphasizing score values.

## Required views

1. **Profile** — identity/RID/status/mission/context.
2. **Provenance** — scoped claim evidence and confidence.
3. **Timeline & Relations** — relative era, events, genealogy/relations.
4. **Leaderboards** — separate metric families, including explicit uncalibrated/disabled states.
5. **Four Corpus** — source priority and witness policy.
6. **Architecture & Docs** — documentation registry and system boundaries.

## Interaction rules

- selector covers all 25 profiles;
- search filters by display name, Qur'anic name, or RID root;
- active tab uses accessible tab semantics;
- request changes abort superseded calls and clear stale data;
- every API-backed view has loading and error states;
- context leaderboard reads `context_score` while other normalized leaderboards read `score`;
- Human Preference/Composite show uncalibrated/disabled status rather than disappearing;
- unknown data renders as unknown/empty-state, never inferred certainty.

## Runtime modes

### Development
Vite on `127.0.0.1:5173` proxies `/api` to Node on `127.0.0.1:4310`.

### Built/local production
Node serves `apps/web/dist` and `/api/v2/*` on the same origin.

## Verification boundary

A source-contract or offline TypeScript check is not browser E2E. Browser PASS requires Playwright to launch against the actual React application.
