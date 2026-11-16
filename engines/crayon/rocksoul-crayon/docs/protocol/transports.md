# Transport policy

The application facade selects transport by semantic requirement, not by
feature-specific branching. Reliable mode is used for CRUD, commands,
authorization, critical events, and execution results. Stream mode is used for
AI output and long-running results. Datagram mode is reserved for ephemeral
presence or telemetry and never carries authoritative mutations.

The runtime may use WebTransport, WebSocket fallback, or HTTP compatibility,
but the public resource and capability APIs remain identical. A downgrade is
diagnostic and must be observable through sanitized runtime inspection. HTTP
remains a compatibility baseline; AEP is the native application abstraction.
