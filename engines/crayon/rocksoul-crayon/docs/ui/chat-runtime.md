# Chat runtime

The Chat surface reads authorized conversation/message resources and sends text through the canonical AEP `chat.send` capability. Loading, unavailable, send-error, retry-queue, and reconnect retry states are rendered explicitly. Pending messages are persisted in a local retry queue and retried when the browser returns online.

The message input supports keyboard send with `Enter` and keeps mobile controls at the shared touch-target boundary. Attachment, emoji, extra-message, and voice actions are visible as explicit unavailable boundaries because no verified application contract exists for those mutations. Typing/presence/read-receipt, edit/delete, and reactions are not fabricated by the UI.

The Chat E2E smoke test verifies the authenticated keyboard send path across desktop Chromium, mobile Chromium, Firefox, and WebKit. The broader product matrix also covers the Chat journey and performance request behavior.
