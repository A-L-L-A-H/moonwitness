# Subscription contract

Subscriptions expose server-authoritative application events through a
transport-neutral SDK callback. Filters are limited to safe resource, record,
event type, and scope fields; arbitrary query languages are not part of the
contract.

The lifecycle is `CREATED`, `ACTIVE`, `PAUSED`, `RESUMING`, `CLOSED`, or
`FAILED`. A reconnect restores identity, negotiates the application cursor,
replays available events, and requests a snapshot when replay is impossible.
Critical events are never silently dropped. Ephemeral events may be dropped or
coalesced only under an explicit bounded-queue policy.
