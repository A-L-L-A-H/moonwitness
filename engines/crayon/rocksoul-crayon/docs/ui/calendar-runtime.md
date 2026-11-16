# Calendar runtime

The calendar route now reads the real `calendar_events` registry model through the existing `modelClient`. The model stores `date`, `time`, and a human-readable `duration`; timestamps are interpreted as local browser dates because the existing contract does not declare a timezone or offset. Events expose `title`, `type`, `location`, and description through the generic metadata form.

The runtime provides month, week, day, and agenda views, deterministic previous/next/today navigation, URL state (`view`, `date`, and `search`), bounded loading of 100 events, selection/detail, create, edit, delete, loading, empty, retryable error, centralized notifications, and an AEP resource watcher that reloads the visible range after calendar resource events. View switches expose `aria-pressed`, loading is announced politely, date headings have full accessible names, and event/action targets meet the mobile touch-size boundary. Event mutations use the generic CRUD API and backend authorization. No recurrence, attendee workflow, drag-resize, booking, or invented timezone conversion is implemented.

The old JSON-backed calendar implementation is no longer the authoritative `/calendar` route. The old components/data remain available for unrelated legacy imports but are not used by the route.
