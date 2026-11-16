# Controlled Publishing Contract

**Status:** PROPOSED  
**Version:** 0.1.0

## Purpose

Define a safe future path for publishing selected material from private ROCKSOUL DX into public MoonWitness.

This is a specification only. No publishing bridge or endpoint is asserted to exist.

## Flow

1. Select a specific artifact in ROCKSOUL DX.
2. Prepare a publication package.
3. Preview rendered content, metadata, attribution, and attachments.
4. Check privacy classification and source permissions.
5. Explicitly approve publication.
6. Transfer the approved package through an authenticated channel.
7. MoonWitness validates the package and stores it as a draft or review item.
8. An authorized editorial action publishes it.
9. Return a receipt containing publication identifier, destination, status, and timestamp.

The owner may require a separate final publish approval in MoonWitness.

## Package fields

```json
{
  "contract": "rocksoul-moonwitness-publishing/0.1",
  "artifact_id": "stable-id",
  "title": "Human-readable title",
  "body": "Approved content",
  "content_type": "article|story|research|image|audio|video",
  "classification": "REVIEW",
  "epistemic_labels": ["FICTION"],
  "attribution": {},
  "sources": [],
  "attachments": [],
  "approved_by_owner": true,
  "approved_at": "ISO-8601 timestamp"
}
```

This example is illustrative, not a deployed schema. The final contract must define validation, attachment handling, idempotency, authorization, and error semantics before implementation.

## Prohibited behavior

- No bulk publication of the private archive.
- No automatic publication of AI-generated drafts.
- No silent changes to approved content after approval.
- No publication of private source material or third-party content without permission.
- No assumption that a local draft is publishable because it exists in ROCKSOUL DX.

## Acceptance criteria

- A user can inspect exactly what will be shared.
- Approval is explicit and scoped to a specific revision.
- Rejected or failed transfers do not create public content.
- Every successful publication has a traceable receipt.
- Revocation/unpublish behavior is documented.
