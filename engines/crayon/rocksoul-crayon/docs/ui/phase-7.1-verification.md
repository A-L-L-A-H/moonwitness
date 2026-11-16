# Phase 7.1 verification note

## Evidence

- Frontend production build: passed when run from the existing `apps/web` dependency binaries after the latest UI changes.
- Frontend lint and TypeScript checks: passed for changed surfaces using the existing local binaries. The root `pnpm` wrapper currently attempts a workspace install and is blocked by the WhatsApp exotic-subdependency policy.
- API authorization suite: 10/10 passed.
- AI integration: authentication rejection, five-agent discovery, chat execution, isolated memory, and run retrieval passed.
- SDK tests: 50/50 passed.
- Protocol tests: 18/18 passed.
- The configured Playwright matrix is green: all 16 tests (AEP Mail/Chat, authenticated journey, and performance journey across desktop Chromium, mobile Chromium, Firefox, and WebKit) passed serially. The authenticated journey also passed independently across desktop, mobile, Firefox, and WebKit: 4/4. This is strong targeted evidence for the covered product journeys; it is not a claim that every route has a full browser matrix.
- Automated axe smoke verification passes on 21 public, primary, resource, settings, auth, and error-recovery routes (including `/projects`, `/tasks`, `/auth/*`, and `/errors/*`) with zero critical violations across desktop Chromium, mobile Chromium, Firefox, and WebKit. This is broad automated route evidence, not a complete manual WCAG audit.
- Notification preference smoke verification passes across desktop Chromium, mobile Chromium, Firefox, and WebKit: a seeded activity notification can be filtered and the selected severity persists after reload. Header unread updates deduplicate equivalent AEP event fingerprints (`kind`, `title`, and `message`).
- Mail draft recovery smoke verification passes across desktop Chromium, mobile Chromium, Firefox, and WebKit: recipient, subject, and message values survive a compose-page reload.

## Explicit limits

Password reset, Google authentication, billing, external connections, chat attachments, repository editing, and browser-agent navigation remain unavailable where no authoritative API contract exists. The product surfaces expose those limits instead of fabricating success. Mail draft recovery/autosave, optimistic send transition with rollback, chat send with durable retry queue and reconnect retry, organization switching, persisted/AEP-streamed notifications with severity styling, accessible security/form confirmation dialogs, CSV resource export, searchable metadata relations, AEP resource adapters, live calendar refresh, and agenda calendar view are implemented. The current automated accessibility smoke covers 21 routes across desktop Chromium, mobile Chromium, Firefox, and WebKit; broader route coverage and a manual WCAG audit remain follow-up verification.

The API/view files and deployment-related work already present in the worktree were intentionally excluded from product commits. The authenticated journey and the full configured 16-test matrix are green across the four configured browser projects; broader route coverage and non-critical automated accessibility findings remain follow-up verification.
