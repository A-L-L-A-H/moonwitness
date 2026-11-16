# WhatsApp Adapter — Baileys

## Decision

Baileys is an optional provider behind a generic messaging port. It is not imported by core, the main API composition, or frontend. It is disabled by default.

Baileys is a community library for the WhatsApp Web protocol, not an official WhatsApp product. Review the current release channel, compatibility, and WhatsApp terms before enabling it in production.

## Provider port

- connect({ accountId, requestedBy, pairingMode })
- disconnect({ accountId, requestedBy })
- getStatus({ accountId })
- send({ accountId, recipient, message, idempotencyKey })
- onInboundMessage(normalizedMessage)
- health()

Provider-specific sockets and credential objects never cross this boundary.

## Session lifecycle

- User explicitly authorizes connecting an account.
- QR/pairing data is short-lived and shown only to the authorized account owner.
- Session credentials and Signal keys are encrypted at rest.
- Key updates are persisted transactionally before acknowledgement.
- A distributed lease guarantees one active socket owner per session.
- Disconnect revokes the session and releases the lease.
- Session deletion follows a documented retention policy.

## Message pipeline

API command -> authorization and consent -> idempotent outbox -> BullMQ job -> adapter -> provider acknowledgement -> delivery state -> audit event.

Inbound event -> normalize -> deduplicate -> retention policy -> domain event.

An HTTP request must not wait on the external WhatsApp network operation.

## Safety

- No unsolicited bulk messaging, scraped recipients, stalking, or evasion.
- Respect opt-out, block, and connection revocation.
- Rate-limit per account and purpose.
- Store only necessary message data and metadata.
- Do not log QR payloads, auth blobs, encryption keys, or message bodies.
- Model logout, banned/disconnected, retryable, and transient states explicitly.
- Retry permanent failures only when a human resolves the underlying issue.

## Auth storage warning

Baileys file-based auth helper is a sample, not production persistence. Build a database-backed auth/key store with Buffer serialization, atomic writes, concurrency control, encryption, and tested restore behavior.

## Rollout sequence

1. Ship provider port and disabled add-on manifest.
2. Implement encrypted credential repository and lease manager.
3. Implement authorized QR/pairing flow.
4. Implement one-to-one send with outbox/idempotency.
5. Implement inbound normalization and retention.
6. Test reconnect, disconnect, and key rotation.
7. Enable for selected operators only.
