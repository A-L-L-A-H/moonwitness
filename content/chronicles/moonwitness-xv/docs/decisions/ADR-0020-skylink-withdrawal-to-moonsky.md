# ADR-0020 — Withdraw SKYLINK from this repository (D18 moves to MOONSKY)

**Status: ACCEPTED — owner instruction, 31 October 2026.** This supersedes [ADR-0006](ADR-0006-skylink-communication-surface.md) for this repository. It records a removal decision; it is not implementation, production or deployment evidence.

## Context

ADR-0006 accepted SKYLINK as a standalone D18 Messages & Channels service: `apps/skylink` on port 3005, provider adapter packages, a `skylink` Postgres schema, and an operator UI, with ARSY calling it over HTTP behind an `SKYLINK_ENABLED` flag.

What M38 actually built is more than the "health skeleton" older guidance still claims, and this record should say so plainly. At the source SHA this ADR removes, the tree contained: a Fastify control plane with a WebSocket event bus and its own session authenticator (`apps/skylink/src`), a React operator client (`apps/skylink/client`), contract types (`@moonwitness/skylink-core`), a second SQL owner with a real migration — `packages/skylink-store/migrations/0000_d18_messages_channels.sql` creates `skylink.channel_accounts`, `skylink.conversations`, `skylink.messages` and `skylink.delivery_attempts` — a Telegram adapter, a Baileys adapter, an ARSY client that registers and sends through the service key (M38-12), a Compose service with a healthcheck, and a dedicated image.

What stayed open was everything that makes it a product rather than a second implementation: the M38-12..14 integration, operator-UI and end-to-end/release leaves were never closed, no consumer inside XV used the D18 tables, and `skylink` was the only schema in this repository with an owner outside MoonQL.

The messaging surface the ADR described now exists where it belongs: the standalone **MOONSKY** repository (`bjo163/moonsky`, `@moonsky/*`) with its own auth, its own `moonsky` schema, its own operator UI and its own Baileys channel. Maintaining a second, divergent copy of that surface inside XV — service, store, adapter, flag and proxy routes — duplicates ownership with no consumer, the failure mode ADR-0019 named for the ISP vertical. The owner directed its removal from this repository on 31 October 2026.


## Decision

1. **Withdraw SKYLINK from this repository.** Remove `apps/skylink`, `packages/skylink-core`, `packages/skylink-store`, `packages/skylink-telegram`, `Dockerfile.skylink`, the ARSY `skylink` HTTP client and its tests, the Compose `skylink` service, the `SKYLINK_ENABLED`/`SKYLINK_URL`/`SKYLINK_SERVICE_KEY` configuration, port **3005**, and the cockpit supervisor entry and operator-evidence script.
2. **ADR-0006 is SUPERSEDED, not deleted.** Its body stays as the record of what was accepted on 27 October 2026. `docs/architecture/SKYLINK.md`, the `docs/milestones/M38.md` scope and the M38 task/audit records are retained as dated history, not as a live contract.
3. **The WhatsApp channel stays, and ARSY owns it in-process.** `packages/skylink-whatsapp` is renamed to `packages/whatsapp` (`@moonwitness/whatsapp`) — the same Baileys client, without the SKYLINK name or the cross-service hop. D09's `channels` routes are ARSY's own registry again; they are not a proxy for anything.
4. **The second SQL owner is gone.** ADR-0006 §3 accepted exactly one exception to "MoonQL is the only migration owner", for `@moonwitness/skylink-store`. With SKYLINK withdrawn, that exception is void: **`@moonwitness/moonql` is again the only `drizzle-orm`/`postgres` importer**, and the topology guard now holds the set to `{packages/moonql}`.
5. **No replacement owner is created.** Withdrawing D18 does not transfer message tables, conversations or delivery attempts to another XV package. Nothing in this repository stores chat history. If XV ever needs a D18 store again, that is a new accepted ADR, not a silent schema.
6. **No automatic data destruction.** The `skylink` schema and its rows in any existing database are untouched, as in ADR-0019 §5. The published `_schema` and the `/channels/*` control plane keep answering, because those routes never left ARSY.

## Consequences

- Workspace membership drops from 10 apps / 35 packages to **9 apps / 32 packages**. Remaining apps: `arsy`, `dock`, `headquarters`, `aigateway`, `sentinel`, `echolog`, `orbit`, `empire-web`, `lumen-runtime` (plus `tools/cockpit`).
- Port 3005 is retired; the registry in `scripts/apps.registry.mjs`, `PORTS` in `@moonwitness/core`, `pnpm ports:free`, the root `dev:skylink`/`start:skylink` scripts and the Cockpit's 8 supervised services become 7. `skylink` is added to no deny list any more because there is no `skylink` host to deny — `DEFAULT_DENY_HOSTS` loses the entry.
- Compose drops from 9 services to **8**. The `whatsapp-session` volume stays: it now holds ARSY's own Baileys auth directory, which is what always used it in practice.
- The published channel control plane loses no endpoint: `start`/`logout` were forwarded to SKYLINK when the flag was on, and there was no SKYLINK to receive them. `channels.statusAll()` is served directly by the in-process manager.
- `docs/data/M46-15-package-ownership.{json,md}` regenerates without the four removed packages; `packages/whatsapp` and `packages/core` still point at ADR-0006 as their boundary link, which this ADR now governs.
- The remote `skylink.moonwitness.biz.id` deployment and any D18 data import are **operator actions outside this decision**. Nothing in this repository removes them, and no script here drops the `skylink` schema.

## Verification

- `git grep -il skylink` outside `docs/audit`, `docs/tasks`, `docs/research`, `docs/milestones`, `TODO.md` and this file's citations returns no code, script, compose or config hit.
- `pnpm build`, `pnpm ui:check`, `pnpm lint`, `pnpm gen:sdk:check` and `pnpm test` pass; the topology guard reports `SQL drivers are imported only by MoonQL`, and the Cockpit port-registry test covers 5 canonical monorepo ports.
- `docker compose config` parses with 8 services and no `SKYLINK_*` interpolation.
