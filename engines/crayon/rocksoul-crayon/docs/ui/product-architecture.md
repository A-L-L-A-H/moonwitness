# Product surface architecture

The web application is a Vite/React client using the canonical API client and SDK model transport. Authentication is established by the auth routes and bearer session; the browser does not ship an API key. Authorization, resource visibility, and mutation authority remain server-owned.

Implemented product surfaces in this batch include live dashboard summaries, metadata-driven projects/tasks/users/organizations views where authorized, Kanban and calendar runtimes, API-key management, authoritative profile/account settings, appearance preferences, live global search providers, live AI chat execution with retry, AEP-backed notifications, logout-all-devices, organization context switching, and server-backed mail compose/send with draft recovery.

Unsupported capabilities are intentionally explicit: billing, external connections, password reset/password change, Google authentication, browser-agent navigation, coding repository mutation, mail attachments/thread reply-forward, and chat attachments/edit-delete-reactions have no verified end-to-end application contract. Those routes do not fabricate records, mutations, credentials, or success messages.

All resource and search destinations use the shared resolver in `apps/web/src/lib/destinations.ts`. Feature network access remains behind `apps/web/src/lib/api-client.ts` and `apps/web/src/lib/model-client.ts`; React components do not create parallel transport clients.
