# Privacy and Data Classification Contract

**Status:** DECIDED  
**Version:** 1.0.0

## Purpose

Prevent private personal material in ROCKSOUL DX from being exposed through MoonWitness, logs, AI processing, exports, or integrations without informed user action.

## Data classes

| Class | Meaning | Default handling |
|---|---|---|
| PRIVATE | Personal notes, memories, drafts, private conversations, unpublished work | Local/private workspace; no public release |
| RESTRICTED | Sensitive operational, account, or collaborator data | Access-controlled; minimum necessary |
| INTERNAL | Non-public product documentation and working material | Organization/repository access only |
| REVIEW | Selected material awaiting publication review | Not public; approval required |
| PUBLIC | Explicitly approved and published material | May be served to public audiences |

## Mandatory invariants

- ROCKSOUL DX content is PRIVATE by default.
- MoonWitness publication must use an explicit selection and approval step.
- No background synchronization may promote PRIVATE, RESTRICTED, or REVIEW data to PUBLIC.
- A generated summary or AI transformation inherits the source's privacy class unless explicitly reviewed and reclassified.
- Secrets, credentials, tokens, private keys, and authentication material must never be placed in canon or ordinary documentation.
- Logs must not capture private content unnecessarily.
- Access must follow least privilege.
- Export and deletion behavior must be documented by the implementing product.

## Publication approval

Approval must identify:
- exact content or artifact;
- destination and audience;
- included attachments and metadata;
- author/attribution;
- publication status;
- approving user and timestamp.

Approval of one artifact does not approve related drafts or future revisions.

## Retention and deletion

Each product must document retention, backup, deletion, and recovery behavior. This contract does not claim those mechanisms are already implemented.

## Security incident

If a private/public boundary is breached, stop further propagation, preserve necessary audit evidence without spreading the content, revoke affected access where appropriate, and notify the product owner.
