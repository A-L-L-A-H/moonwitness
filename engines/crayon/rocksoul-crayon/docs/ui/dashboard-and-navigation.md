# Dashboard and Global Navigation

Phase 6B.2 replaces the dashboard's template fixtures with parallel, authorized API reads for Projects and Tasks. Counts and recent records are labelled as live session-visible data; failure is rendered as unavailable with retry rather than as synthetic metrics.

The command palette consumes the normalized, server-filtered metadata navigation plus a small set of specialized workspace destinations. It does not implement a client-side permission policy.

`ApiError` retains HTTP status at the shared API boundary. The shared error mapper gives product-safe states for 401, 403, 404, 400/422, and unavailable/5xx conditions. The app root hosts one Sonner toaster; generic resource mutations report success and server-safe failures through it.
