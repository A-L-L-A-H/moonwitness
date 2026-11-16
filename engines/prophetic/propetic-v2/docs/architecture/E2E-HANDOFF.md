# Production E2E Handoff Architecture

The browser gate tests the production-local topology, not only the Vite dev server:

```text
Playwright Chromium
        |
        v
http://127.0.0.1:4310
        |
        +--> React/Vite built SPA
        |
        +--> /api/v2/*
                |
                v
             SQLite
                |
                v
       Research Engine Data
```

`playwright.config.ts` starts `npm start` and waits for `/api/v2/health`.

The E2E contract verifies:

- app shell visible;
- API status online;
- six primary research views clickable;
- async loading completes;
- prophet search and selection works;
- selected profile updates;
- empty search state works;
- API health reports release `2.3.2` and 25 profiles;
- no page errors or console errors;
- missing static asset returns 404 instead of SPA HTML.
