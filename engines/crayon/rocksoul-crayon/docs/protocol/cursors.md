# Application cursors

An application cursor is opaque to clients and distinct from an AEP wire
sequence. It identifies a position in an authorized application event stream.
The server is authoritative for cursor validity, principal binding, expiry,
and replay availability.

Consumers persist cursors only after processing the corresponding event. On a
gap, the runtime attempts replay; if the bounded history no longer contains
the range, it returns an explicit snapshot/reconciliation result. It must not
pretend continuity or expose database offsets as cursors.
