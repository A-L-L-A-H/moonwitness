# AEP application fabric boundary

AEP's seven wire primitives remain unchanged:

`HELLO`, `OPEN`, `RUN`, `DATA`, `SIGNAL`, `ACK`, and `CLOSE`.

Application semantics are carried in typed payloads and exposed through the
SDK as resources, capabilities, executions, events, subscriptions, cursors,
batches, and graphs. This keeps transport concerns inside the runtime while
preserving HTTP compatibility for clients and resources that have not yet been
migrated.

The authoritative path is:

```text
application facade → capability resolver → authorization → executor
→ execution lifecycle → event/cursor model → transport adapter
```

Resource CRUD is not a second authorization system. Native resource
capabilities use the same server policy boundary as other operations. A cursor
gap must produce a replay attempt and then an explicit snapshot request; an
event must never be silently discarded. Bounded queues and fail-closed
validation apply at every layer.

The current implementation is an integrated migration slice: projects and
tasks have native CRUD/watch capabilities, while the compatibility model
adapter remains available for the rest of the UI.
