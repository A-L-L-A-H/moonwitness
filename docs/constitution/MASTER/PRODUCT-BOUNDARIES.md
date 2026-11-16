# Product and Repository Boundaries

**Status:** DECIDED  
**Last reviewed:** 2026-11-15

## Canonical ownership

| Concern | Owner |
|---|---|
| Private desktop experience | `A-L-L-A-H/rocksoul-dx` |
| Public web experience | `A-L-L-A-H/moonwitness` |
| Cross-product documentation and contracts | `A-L-L-A-H/master-docs` |
| Private personal memory and drafts | ROCKSOUL DX, subject to its implementation and security model |
| Public stories and published content | MoonWitness |
| Shared narrative/knowledge definitions | Canon in master-docs, with source and status |

## ROCKSOUL DX

- **Form:** desktop application (desktop-first product, not a web app).
- **Primary user:** the product owner only, unless the owner explicitly changes this.
- **Default data classification:** PRIVATE.
- **Product direction:** layered private desktop universe with continuity, creative/research, and execution spaces. The owner approved GAME WORLD + LIVING ANIMATION as the unified experience direction.
- **v0.1 scope:** THE THRESHOLD plus navigable shells for all four destinations; THE RIOT DECK receives the first detailed room shell. Full room workflows remain separately gated.
- **Interaction boundary:** designed around a desktop workspace and desktop operating environment; it is not a browser-first dashboard, MoonWitness CMS/admin panel, or public website.
- **Publication:** explicit, selective, user-approved export only.
- **Technical status:** Tauri is the owner-selected desktop framework direction (ADR-0007). Frontend framework, packaging/signing, supported operating systems, and local/hybrid persistence remain open until accepted through contracts/ADRs.

ROCKSOUL DX is not a MoonWitness admin panel, a public-facing website, a multi-tenant SaaS product by default, or a web dashboard merely wrapped for desktop distribution.

## MoonWitness

- **Form:** web application.
- **Audience:** public readers and visitors, with editorial/administrative roles where implemented.
- **Default data classification:** PUBLIC only for material intentionally published; drafts and operational data may be restricted.
- **Primary activities:** storytelling, witnessing, research presentation, archive, messages, and publishing.

MoonWitness is not the private memory store for ROCKSOUL DX.

## Master Docs / Master Hub

- **Form:** documentation repository and future private control plane; current app is only a visual MVP preview.
- **Primary responsibility:** cross-product source of truth, contracts, canon indexes, governance, and future controlled coordination.
- **Boundary:** not the ROCKSOUL DX desktop application and not the MoonWitness public web experience.

## Shared does not mean coupled

Sharing a name, story, schema concept, design token, or document does not imply shared runtime, database, authentication, UI, or release cadence.

Any coupling requires:
1. a written use case;
2. a named data owner;
3. an explicit contract;
4. access and privacy rules;
5. versioning and compatibility policy;
6. failure and rollback behavior;
7. approval by the product owner.

## Repository changes

- Changes to desktop code belong in `A-L-L-A-H/rocksoul-dx`.
- Changes to public web code belong in `A-L-L-A-H/moonwitness`.
- Cross-product specifications and decisions belong here.
- A master-docs change does not itself implement a feature in either product.