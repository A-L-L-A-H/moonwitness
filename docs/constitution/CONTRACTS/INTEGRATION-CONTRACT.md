# Cross-Product Integration Contract

**Status:** PROPOSED  
**Version:** 0.1.0

## Principle

ROCKSOUL DX and MoonWitness operate independently. Integration is optional and must be explicit, narrow, secure, and versioned.

## Allowed integration candidates

- User-approved publishing from ROCKSOUL DX to MoonWitness.
- Import of public MoonWitness material into a ROCKSOUL research workspace, retaining source attribution.
- Shared public canon definitions or exported creative assets where licensing and ownership permit.

These are candidate use cases, not claims of existing integrations.

## Forbidden defaults

- Shared unrestricted database.
- Shared private memory store.
- Automatic two-way synchronization.
- Implicit trust between desktop and web sessions.
- MoonWitness access to local/private ROCKSOUL files.
- ROCKSOUL credentials embedded in public web code.

## Contract requirements

Any integration must specify:
- producer and consumer;
- data owner and purpose;
- schema and contract version;
- authentication and authorization;
- classification and consent;
- transport and encryption;
- idempotency and duplicate handling;
- validation and error behavior;
- observability without sensitive payload leakage;
- revocation and rollback;
- compatibility and migration policy.

## Failure isolation

Either product must remain useful if the other product is unavailable. Integration failure must not corrupt the source record or cause unintended publication.
