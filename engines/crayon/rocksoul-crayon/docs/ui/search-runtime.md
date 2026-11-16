# Search runtime

The command palette uses independent, bounded provider requests through the canonical API client for projects, users, tasks, and calendar events. Provider failures are isolated with `Promise.allSettled`; only authorized server responses become normalized results.

The global trigger supports `Ctrl+K` and `⌘K`. Opening focuses the command input; closing with Escape restores focus to the trigger, including WebKit/Firefox browser timing. The palette resets its query and result state whenever it closes.

Destinations are resolved through `apps/web/src/lib/destinations.ts`. Calendar events currently resolve to the calendar surface because the calendar UI has no server-backed event-detail route; search does not fabricate an unsupported deep link.
