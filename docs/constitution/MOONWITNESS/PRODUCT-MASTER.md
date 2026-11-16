# MoonWitness — Product Master

**Repository:** `A-L-L-A-H/moonwitness`  
**Product type:** Public-facing web application  
**Status:** Product boundary DECIDED; implementation baseline partially repository-verified  
**Last reviewed:** 2026-11-15

## Product identity

> When the Moon Witnesses, We Share A Message.

MoonWitness is a public web product for storytelling, witnessing, research presentation, messages, selected archives, and editorial publication.

It is separate from ROCKSOUL DX, which is a private desktop application for one primary user.

## Product responsibilities

- Public-facing storytelling and editorial experience.
- Publication of selected stories, messages, research, and creative works.
- Archive and timeline experiences where supported by implementation.
- Editorial and administrative workflows, with access controls.
- Clear distinction between testimony, reported material, research, interpretation, and fiction.

## Repository-observed engineering baseline

A repository inspection on 2026-11-15 observed the following on branch `dev`, at commit `9d8b8cf0a4f31b304b77c1e6a2c11189babfdd8e`:

- Monorepo structure and a Next.js 15.5 / React 19 web application.
- Fastify 5 API and shared packages/contracts.
- pnpm workspace and Turborepo.
- SQLite/libSQL-related persistence components.
- Rust operational services including Storage, Syslog, SNMP Poller, and RADIUS.
- Creative Engine work including cinematic landing/storytelling elements, editorial panels, archive/crew experiences, responsive layouts, and reduced-motion behavior.
- Security documentation describing server-side authentication, HTTP-only session cookies, role-based access, and service proxy boundaries.
- Workflow checks observed as successful for that commit during the inspection.

This is a dated snapshot, not a guarantee of current state. Verify against the target branch and latest commit before using it as an implementation instruction.

## Branch observation

At the time of inspection, comparison reported `dev` behind `main` by four commits, with no commits ahead. This discrepancy should be rechecked before release or branch promotion. No merge was performed as part of the audit.

## Product areas requiring explicit boundaries

The repository contains or documents public storytelling/creative experiences and operational/administrative areas such as Shadow/Command Center and ARSY-related capabilities. Their precise product ownership, access boundaries, and public-versus-internal responsibilities should be documented and verified before further expansion.

## Important caveats

- A passing workflow run is not proof of production readiness.
- A build or preview is not proof of a production deployment.
- Creative placeholder content is not verified testimony.
- A documented security mechanism is not a substitute for a current security review.
- Repository presence does not prove every capability is complete.

## Product principles

1. Public content must have editorial provenance.
2. Private ROCKSOUL material is never automatically imported.
3. Stories must preserve their epistemic labels and source context.
4. Public and operational routes must enforce server-side authorization.
5. The visual experience may be expressive, but readability and accessibility remain requirements.
6. MoonWitness must remain useful independently of ROCKSOUL DX.

## Open decisions

- Final boundary and product naming for Shadow and ARSY.
- Production hosting, deployment pipeline, backup, and recovery acceptance criteria.
- Editorial workflow and publication states.
- Canonical content taxonomy and provenance metadata.
- Any future ROCKSOUL-to-MoonWitness publishing bridge.
