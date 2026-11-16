# Product Shell

Phase 6B.1 establishes one shared shell through `BaseLayout`: the responsive shadcn sidebar, a shared topbar, content region, and status footer. Pages do not create independent chrome.

## Navigation and authority

Resource groups are still normalized from backend AutoMenu in `MetadataRuntimeProvider`. The sidebar renders that navigation directly; specialized routes remain explicit implementation navigation. The shell does not contain a frontend permission policy.

## Identity and states

`useCurrentUser` reads the authorized `/api/v1/auth/me` response through the shared API client. The sidebar shows loading, signed-out, or current-user states and logout clears the local bearer token after attempting server logout. No credentials or security-sensitive fields are rendered.

## Responsive and accessibility baseline

The sidebar uses the repository's responsive sheet behavior and compact desktop mode. The topbar supplies a semantic sidebar toggle, labelled breadcrumbs, search trigger, status indicator, theme control, and a live labelled notifications control. Shared Button `sm` controls use a 40px mobile touch target and return to 32px at the `sm` breakpoint; icon buttons remain 40px on mobile. Existing shadcn dialogs, menus, focus handling, and keyboard navigation remain the shared primitives.

## Deferred subphases

Dashboard/global command improvements, resource metadata CRUD, Kanban, Calendar, Chat, and AI workspace surfaces are implemented outside the shell layer and verified through the current web E2E suites. Remaining product gaps are contract-dependent features such as Google authentication, password reset, external connections, attachments, and repository/browser-agent mutation.
