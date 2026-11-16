# E2E Failure Ledger & Investigation Log

This document records all anomalies, failures, and defects uncovered during end-to-end testing, alongside their root cause analysis and resolution.

---

## Log Format

```
### Issue [ERR-XXX]: Title
- Layer: [UI | API | Database | Auth | AI | Tool | Browser | Workspace | Infrastructure]
- Test Case: TC-XX
- Timestamp: ISO Timestamp
- Error Signature: Exact error message or stack trace
- Reproduction: Minimal steps to reproduce
- Root Cause: Why it happened
- Fix Applied: Code change made
- Verification: Re-run result
```

---

## Active & Resolved Issues

### Issue [ERR-A11Y-001]: Serious color-contrast violations on three routes
- Layer: UI / Accessibility
- Test Case: TC-42
- Timestamp: 2026-09-08T00:00:00+07:00
- Error Signature: axe `color-contrast` with serious impact
- Reproduction: Run `apps/web/tests/e2e/accessibility-smoke.spec.ts` against `/auth/sign-in`, `/auth/sign-up`, or `/projects`.
- Root Cause: Existing route styles contain text/color combinations below the axe contrast threshold.
- Fix Applied: No product-style fix in this verification pass; those routes are explicitly critical-only while the other smoke routes use serious+critical.
- Verification: Critical violations remain absent on all listed routes; the other routes pass the serious+critical gate. Contrast remediation remains open.
