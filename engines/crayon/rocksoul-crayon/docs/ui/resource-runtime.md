# Generic resource runtime

Phase 6B.3 closes the metadata-driven resource experience for the web app. `ResourcePage` is model-independent: Projects, Users, and future resources resolve the same metadata contract and use the same toolbar, table, detail, form, query, and mutation paths.

## Runtime behavior

- List state is reflected in the URL: `page`, `limit`, `search`, `order`, `direction`, and `filter.*` values are shareable and survive refresh.
- Search is debounced by 300ms. Select filters, sorting, refresh, pagination, and clear-filters all re-query the backend through the model client.
- Table rendering is metadata-driven and safely handles nulls, booleans, dates, currencies, tags, and JSON values. It has loading, empty, error, responsive overflow, and row-action states.
- The `Columns` control persists per-resource column visibility and ordering in local storage. It always keeps at least one data column visible and exposes visibility, move-up, and move-down controls with accessible names.
- Visible rows support accessible multi-selection with select-all, live selection count, clear-selection recovery, and CSV export. Export follows the active visible columns and exports selected rows when a selection exists; it is client-side and does not imply an authorized server batch operation. Selection is pruned when the visible result set changes, preventing stale IDs from a prior search or page from remaining selected. Batch mutation controls remain intentionally absent until the API exposes an authorized batch contract.
- Detail and CRUD dialogs reuse metadata fields. Required/email validation runs before submission; server errors remain visible; cancelling dirty forms requires confirmation.
- Edit mutations carry the record's `updatedAt` as an opaque `expectedVersion`. The server compares it atomically and returns a structured `409 CONFLICT` when another writer has changed the record; the form reloads the latest record, keeps the conflict message visible, and requires the user to review and save again.
- Form control names come from the native `Label`/`htmlFor` association and table metadata labels are reused for matching fields, keeping accessible names consistent between create and edit flows. Select controls and row actions use the mobile touch-size baseline.
- Relation fields use metadata-provided options through an accessible searchable input backed by a native `datalist`. When `relationModel` is present, the picker debounces server search and requests a 20-item page using the configured display/value fields; failures remain local to the field. It does not claim full relation pagination until the contract exposes a cursor or page picker.
- Mutations use centralized API error mapping and toast notifications, then refresh the current resource query.
- Concurrent list loads use a monotonically increasing request sequence. If a slower search, filter, sort, refresh, or pagination response arrives after a newer request, its records, totals, and errors are ignored rather than overwriting the current view.

## Verification boundary

Static verification covers TypeScript build and lint for changed surfaces. Authenticated desktop and mobile Playwright journeys now cover organizations create/edit/delete and full navigation; full cross-browser CRUD completion is therefore not claimed. No model-specific UI branch was added.
