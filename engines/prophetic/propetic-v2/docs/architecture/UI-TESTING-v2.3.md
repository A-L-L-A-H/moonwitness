# UI Testing v2.3

## Test pyramid

1. **Source contract** — React application contains all six research views, scoped API calls, error/loading states, accessibility wiring, and shadcn component-source structure.
2. **Offline TypeScript check** — verifies local source syntax/types using an explicitly isolated compatibility shim. This is not equivalent to a dependency-resolved React typecheck.
3. **Dependency-resolved typecheck/build** — `npm run web:typecheck` and `npm run web:build`; must run where npm dependencies are installed.
4. **Browser E2E** — Playwright clicks every primary tab, switches prophet profiles, exercises search, verifies API-backed content, and checks error-free navigation.

## Required interactive coverage

- Profile
- Provenance
- Timeline & Relations
- Leaderboards
- Four Corpus
- Architecture & Docs
- prophet selection
- search filter
- API online/offline status
- invalid API route behavior

## Current environment statement

Do not report browser E2E as PASS unless Playwright actually launches a browser against the built/dev React application. v2.3 keeps this distinction explicit.
