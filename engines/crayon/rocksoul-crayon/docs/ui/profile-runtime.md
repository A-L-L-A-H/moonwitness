# Profile runtime

The profile surface reads identity from `/api/v1/auth/me` and updates only allowed self-editable fields through the generic `users` model client. Role, status, and email are server-authoritative read-only values in this UI. Passwords, tokens, hashes, and API-key secrets are never rendered.
