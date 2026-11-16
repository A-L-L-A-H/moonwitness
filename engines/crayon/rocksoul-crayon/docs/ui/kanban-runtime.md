# Kanban workflow runtime

Tasks is the first real workflow resource. Its metadata defines `status` options (`todo`, `in progress`, `completed`, `pending`, and `canceled`) and `title`; `projectId` and `assigneeId` are existing relations. The server authorization policy allows authenticated users to read/create/update tasks and admins to manage them.

The workflow adapter identifies the model, title field, and status field. The Kanban engine owns only card/column presentation and drag mechanics. Columns come from metadata options, cards use backend IDs, and card clicks resolve to the existing generic detail route. Drag start, keyboard movement, cancellation, same-column drops, and successful moves are announced through a polite screen-reader status region.

Dragging performs an optimistic local move, then persists only the status through the existing generic model update endpoint. The server response is reconciled into local state. API/network/403 failure restores the exact prior columns and shows the centralized toast error. Search and filters are backend-driven and disable moves while active because the resource has no safe ordering semantics for hidden records.

Tasks has no `order`/`position` field, so intra-column ordering is intentionally not persisted. The board uses horizontal scrolling on small screens, dnd-kit pointer and keyboard sensors, visible focus styles, loading skeletons, empty columns, and retryable error state. The current board request is bounded to 100 records; larger workflow resources need a server-side board/query contract before adopting this adapter unchanged.
