# Security Notes

- The desktop app is local-first and does not send project contents to a ROCKSOUL cloud service.
- AI CLI execution is outside this release; agent process execution is not compiled into the application command surface.
- Git uses fixed inspection and write-operation allowlists and never accepts arbitrary command strings. Write operations require explicit UI confirmation, validate branch names, reject dirty-worktree operations where unsafe, and report conflicts without force-resetting user work.
- Repository registration canonicalizes the Git root. Stored repository paths must remain local and accessible.
- SQLite connections enable foreign-key enforcement. Project deletion is transactional and preserves linked issues and repositories while removing milestones.
- The browser preview is not a native security boundary and stores workflow state in localStorage.
- The application does not expose a general arbitrary-shell endpoint.
- Tauri capabilities are minimal; add permissions only when a concrete local feature requires them.
- Do not expose the local SQLite database or app-data directory through an unauthenticated network service.
- The optional S3-compatible gateway listens on `127.0.0.1` with an OS-assigned port and requires a per-session bearer credential. It is not reachable from other machines.
- S3 requests without the session bearer credential are rejected before any Drive call. Object keys are validated for traversal, and request/body sizes are bounded (16 MiB per object).
- The gateway is an experiment surface, not a hardened multi-tenant S3 implementation: there is no request signing, multipart upload, or per-key ACL model.

This document describes intended boundaries; it is not a security certification or substitute for a release security review.
