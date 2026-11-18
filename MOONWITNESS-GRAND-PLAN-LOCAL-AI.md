# MOONWITNESS — GRAND PLAN & LOCAL AI EXECUTION BLUEPRINT

**Repository:** `A-L-L-A-H/moonwitness`  
**Audit date:** 18 November 2026 (Asia/Jakarta)  
**Audit target:** `dev` + comparison against `main`  
**Plan status:** owner direction consolidated; detailed implementation tasks are proposed until each wave passes its decision gate  
**Execution target:** local coding AI, with a human owner retaining product, privacy, and release authority

---

## 0. Executive decision

The final monorepo application topology is **three apps, not seven or eight**:

```text
apps/
├── web/       # unified MoonWitness + A-L-L-A-H public web experience
├── api/       # one central MoonWitness API / modular backend
└── rocksoul/  # private ROCKSOUL DX desktop application (Tauri)
```

These are three application workspaces, not three interchangeable products or three databases.

- `apps/web` owns the public web experience, including MoonWitness, A-L-L-A-H, and the Nine Worlds navigation/experience layer.
- `apps/api` owns the canonical HTTP API, server-side authorization, domain application services, and integration adapters. It is a modular monolith, not a collection of microservices.
- `apps/rocksoul` owns the private desktop experience and its local data. Its private records do not become MoonWitness records merely because code or types are shared.

The Nine Worlds are **experience destinations**, not nine applications, nine databases, or a requirement to create nine domain packages. They may use shared domain capabilities and projections.

The target keeps two important data trust zones:

1. **MoonWitness zone:** public and restricted material intentionally managed by the web/API platform.
2. **ROCKSOUL zone:** private owner-controlled desktop records, local memory, drafts, and working artifacts. Cloud backup is opt-in; publishing/export is selective and explicitly approved.

A shared monorepo does not remove this boundary.

### Target runtime topology

```text
Internet
   │
 Caddy / TLS
   ├──────── moonwitness.biz.id ───────┐
   └──────── a-l-l-a-h.com ────────────┤
                                       ▼
                                  apps/web
                                       │ HTTPS / OpenAPI
                                       ▼
                                  apps/api
                                       │
                               domain modules + ORM
                                       │
                                  PostgreSQL

Optional operational adapters (only when required):
  RADIUS · SNMP · Syslog · Object Storage · ARSY control plane

Owner's machine:
  apps/rocksoul (Tauri) ── local SQLite / local files / private vault
        └── explicit, scoped export only when the owner approves it
```

Production hosting should have one deliberate topology. Based on the current repository, the simplest existing foundation is **one VPS + Caddy + Docker Compose**, with `web` and `api` as the two server application containers, PostgreSQL as the server database, and operational services enabled only where a real workflow requires them. ROCKSOUL is a desktop product and is not part of the public VPS Compose stack.

---

## 1. Latest repository audit — verified snapshot

### 1.1 Branch and release state

At audit time:

| Item                        | Observed state                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository default branch   | `dev`                                                                                                                                                          |
| `main` head                 | `9c7ffa59f30977b138e9b704526c99370ce60ad9` — release 0.8.1 / promotion PR #242                                                                                 |
| `dev` head                  | `310ce6670513764594fae6275b0e14cde6f36ec1` — merge PR #243, ROCKSOUL S3 gateway/backup work                                                                    |
| Promotion PR                | [#244 — dev to main](https://github.com/A-L-L-A-H/moonwitness/pull/244), open                                                                                  |
| PR #244 mergeability        | GitHub reports mergeable, but `mergeable_state=behind`                                                                                                         |
| Branch comparison           | `dev` ahead by 4 commits and behind by 3 commits at audit time; branch histories need reconciliation before broad refactoring                                  |
| Latest `dev` check snapshot | 37 check-runs: 34 success, 2 skipped promotion jobs, 1 in progress (E2E Tests); do not call the whole run green until the in-progress required check completes |

For the `dev` head check-runs endpoint, GitHub reported 37 total records: 34 successful, 2 skipped promotion jobs, and 1 still in progress (E2E Tests) at the latest check. The required run is not fully settled until the in-progress check completes; skipped promotion jobs are not evidence of deployment. The current push has **not yet become the final `main` snapshot**. The local AI must fetch and re-check branch heads before acting; these SHAs are audit anchors, not permanent instructions.

### 1.2 Application workspace inventory

The latest `dev` tree still has seven `apps/` directories:

```text
apps/api
apps/cli
apps/igate
apps/memory
apps/mid
apps/rocksoul
apps/web
```

The standalone `apps/a-l-l-a-h` app has already been removed from the latest `dev` tree. Its public site has been consolidated into `apps/web`; Caddy routes both the MoonWitness and A-L-L-A-H public hostnames to `web`.

The remaining four directories beyond the approved three have different roles and must not be deleted by name alone:

| Existing path | What it is today                                                                                                   | Target treatment                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/cli`    | Small Node CLI for login, tokens, identity, and endpoint status                                                    | Move to a non-app workspace such as `packages/cli` or a tools area, or absorb the required commands into ROCKSOUL. Preserve the executable only if there is a real consumer.                                              |
| `apps/igate`  | Cloudflare-style Fetch/D1 handler and probe console; not in root Compose                                           | Compare with the API's existing probes/control routes. Port only missing, valuable behavior, then retire the duplicate worker package.                                                                                    |
| `apps/mid`    | Custom OIDC/identity implementation with Fastify plugin and D1-style persistence adapter                           | No standalone MID app. Inventory all clients and flows, then either absorb the minimum required auth capability into API-owned identity or deliberately retire unused OIDC flows.                                         |
| `apps/memory` | Separate local Python API + worker + Next dashboard + optional Rclone S3 gateway, launched by its own Compose file | Treat as private archive/memory capability, not as public MoonWitness infrastructure. Plan a safe transition into ROCKSOUL or a narrowly scoped local worker under `services/`; preserve original archive and local data. |

**Required end state:** only `web`, `api`, and `rocksoul` are application roots under `apps/`. Other reusable libraries belong in `packages/`; isolated protocol/worker runtimes belong in `services/` only where process isolation is justified.

### 1.3 Deployment inventory

The latest root `Dockerfile` has only `api` and `web` runtime targets. That is good progress.

The latest root `docker-compose.yml` defines these runtime services:

```text
caddy
web
api
radius
snmp-poller
syslog
postgres
```

`apps/rocksoul` is not deployed by this Compose stack, as expected for a desktop product. `apps/memory`, `apps/igate`, and `apps/cli` are also not part of the root production Compose stack.

Caddy currently routes:

- `moonwitness.biz.id` → `web:3000`
- `a-l-l-a-h.com` → `web:3000`
- `api.moonwitness.biz.id` → `api:3002`
- `id.moonwitness.biz.id` → `api:3002`

This is the correct direction for consolidating the public web and the public API doors.

**Verified deployment mismatch:** `apps/api` storage routes default `STORAGE_URL` to `http://127.0.0.1:8091`, but the root Compose file does not define a `storage` service and does not override `STORAGE_URL`. The Rust `services/storage` project exists and is checked by CI, but is not in the root Compose service list. From inside the API container, `127.0.0.1` points back to the API container. Therefore storage operations are likely unreachable in the default Compose deployment unless an unrecorded runtime override exists. The local AI must verify the real production env and then either wire the service to the internal network or intentionally disable/remove the feature until its runtime is ready.

The Go `cp/arsy` control plane is also built/tested separately and is not listed as a root Compose service. Do not assume that a tested repository/service is automatically deployed.

### 1.4 CI/CD and cost alignment

The current `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/preview-deploy.yml` use `ubuntu-latest`. The current deployment job also uses an SSH path to the VPS and runs `docker compose up -d --build` on the VPS.

The production deploy workflow has a credentials check that can mark deployment as not configured and skip the SSH deployment steps. That can produce a successful workflow run without a production deployment actually occurring. The release/deploy result must distinguish **deployed**, **deliberately not deployed**, and **blocked**; it must never imply a release was deployed when it was skipped.

The requested operating rule is self-hosted CI to control runner costs. The workflow runner policy has not yet been converted to self-hosted at the audited `dev` head.

### 1.5 Documentation drift

The repository still contains documents describing the pre-consolidation topology:

- Root `README.md` lists `apps/a-l-l-a-h` as a separate app and describes the old app set.
- `WORK_PLAN.md` documents the former multi-app topology, including standalone A-L-L-A-H and Memory application claims.
- `MOONWITNESS-AUDIT-REPORT-2026-11-18.md` describes a snapshot at version 0.6.1 and eight apps, while the inspected `main` is 0.8.1 and the current `dev` app tree has seven roots. Treat it as a historical audit, not the current source of truth.
- `docs/dna/09-UI-ARCHITECTURE-STATUS.md` still has references to `apps/a-l-l-a-h` and its former independent test/build path.
- Some copied blueprint ADRs still point to older multi-repository ownership, a separate public web repository, or a proposed GitLab/Foundation topology. These must be reviewed and marked superseded or reconciled; do not silently delete historical decisions.

The existing product-boundary principles remain useful: ROCKSOUL private data is not automatically published; MoonWitness is public-facing; provenance and epistemic labels must survive retrieval and publication. The technical monorepo structure must be updated without erasing those product boundaries.

---

## 2. Architecture principles — binding for implementation

### 2.1 Three apps, one domain platform, nine worlds

**Apps:** exactly three app workspaces under `apps/`: `web`, `api`, `rocksoul`.

**Domain platform:** reusable domain logic and contracts live below the application layer. The API composes them; it does not become the owner of every domain's data model and business rules.

**Nine Worlds:** experiences/navigation inside the product surfaces, not independent deployment units.

### 2.2 Product/domain mapping

| World              | Experience responsibility                                     | Domain capability direction                                                                                       | App surface                                                    |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| MOONWITNESS        | Stories, knowledge, archive, witnessing, selected publication | Witness, Chronicle, Knowledge, Research, Publication                                                              | `web`                                                          |
| ARSY               | Radio, signal, technology, infrastructure                     | Signal/operations integrations; keep ARSY Radio as a communication/signal concept                                 | `web` experience + optional isolated services/control plane    |
| HUMAN-PEN          | Think, write, create, share                                   | Works/authoring; ownership and public/private state must be explicit                                              | `web` for approved public works; `rocksoul` for private drafts |
| SIDRA              | Connect, explore, learn; knowledge graph navigation           | Graph projection over approved Canon/Knowledge/Witness/Research relationships, not a separate database by default | `web`                                                          |
| ROCKSOUL DX        | Private personal creative/research/execution workbench        | Private local data, task/workspace, local memory, explicit export                                                 | `rocksoul`                                                     |
| CRAYON             | Canon explorer / colorful explanatory experience              | Views over approved Canon and Knowledge records                                                                   | `web`                                                          |
| SIN CAN            | Canon explorer / reflection and questions                     | Views over approved Canon and Knowledge records                                                                   | `web`                                                          |
| MYTHOS             | Canon explorer / discover and remember                        | Views over approved Canon, Chronicle, and Knowledge                                                               | `web`                                                          |
| ANGEL WITH SHOTGUN | Law, justice, society                                         | Justice/governance domain only after explicit scope, data policy, and owner approval                              | `web` experience; domain module deferred                       |

No empty package should be created merely to match the Nine Worlds list. A world becomes a domain module only when it owns real entities, invariants, workflows, and data.

### 2.3 Ownership and dependency direction

```text
apps/web ───────────────┐
                        ├── apps/api HTTP adapters ── domain modules ── ORM
apps/rocksoul ── explicit contracts only where approved

packages/core / schema / contracts / canon / ui / orm
  may not import from apps/*

services/*
  are isolated runtimes only for protocol, resource, or security reasons
```

Rules:

1. `apps/api` is the only canonical public MoonWitness HTTP/OpenAPI door.
2. `apps/web` must not access the database directly.
3. Domain packages must not depend on Fastify, Next.js, Tauri, or a hosting provider.
4. Fastify routes, HTTP schemas, cookies, request parsing, and response serialization belong in `apps/api` adapters.
5. The ORM is infrastructure. It must not contain MoonWitness canon, Nine Worlds names, spiritual concepts, or business rules.
6. Do not create microservices or a plugin marketplace without demonstrated scaling, protocol, security, or release-isolation need.
7. Do not add a new framework or infrastructure vendor to solve a problem that the current stack can solve simply.

### 2.4 Data and privacy boundaries

| Data class                                                  | Owner                                        | Default storage                                | Cross-boundary rule                                                                              |
| ----------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public stories, approved research, published canon material | MoonWitness                                  | PostgreSQL + object storage where required     | Public only after editorial/publishing approval                                                  |
| Internal operations, account/session metadata               | API platform                                 | PostgreSQL                                     | Server-side auth and role checks; never expose secrets or raw records through metadata endpoints |
| Private drafts, personal notes, chat archives, source files | ROCKSOUL                                     | Local SQLite + local filesystem/vault          | No automatic upload, indexing into public corpus, or synchronization                             |
| Explicitly selected export                                  | Source product until accepted by destination | Export artifact with provenance                | Owner chooses exact artifact, destination, and scope; preserve provenance                        |
| Operational telemetry                                       | Owning service                               | Service-owned persistence or bounded retention | Keep operational telemetry separate from narrative events and private user material              |

Use the existing classification vocabulary (`public`, `internal`, `private`, `restricted`) and epistemic labels. A generated summary must not be presented as direct evidence. A dream, interpretation, hypothesis, coincidence, joke, or fiction must not silently become a verified event.

### 2.5 Database policy

- MoonWitness server persistence: PostgreSQL is the primary production database.
- ROCKSOUL: local SQLite remains local to the desktop app and its app-data directory.
- Private Memory/How U Remind Me data must not be copied into the MoonWitness PostgreSQL database by convenience.
- The owner has stated that the central MoonWitness database is still empty and does not need legacy data migration. The agent may design a clean initial schema **after verifying the configured database is the intended empty instance**. This does not authorize deleting or resetting ROCKSOUL's local SQLite database, user archives, or any existing personal data.
- Going forward, schema evolution still uses versioned migrations. “No legacy data migration” does not mean “no migrations at all.”

### 2.6 Identity policy

There must be one API-owned identity/session authority for the MoonWitness server surface. Do not keep a separate `apps/mid` application.

Before removing MID code, inventory every relying party, issuer URL, callback URL, cookie domain, login flow, refresh-token flow, and bearer-token consumer. Then choose the minimum required implementation:

- Keep API-native sessions/cookies and role enforcement for the web app.
- Keep OAuth/OIDC compatibility only when a verified client requires it (for example, a desktop login flow). If required, host it as an API-owned module using the same identity store and lifecycle—not a second server/database.
- If a flow has no active consumer, remove it after proving there are no references.
- Preserve a transitional `id.` hostname only while clients or discovery metadata depend on it; redirect or retire it through a documented compatibility step.

No new external identity provider is assumed.

---

## 3. Domain, ORM, and addon target

### 3.1 Current structural issues to resolve

1. `packages/addons` currently has only `__base` and `timeline`.
2. `packages/addons/__base/src/addon.ts` is a stub (`registerBaseAddon(db: any)` logs registration); the registry currently validates manifests, dependency order, and collisions, but does not yet provide a complete, wired lifecycle for model/migration/service ownership.
3. The Timeline domain currently has two persistence paths:
   - `packages/addons/timeline` defines `timeline_events` and `timeline_eras` and has its own repository/routes.
   - `apps/api` also defines `ops_events` and wires a separate `TimelineUseCase`/`OrmEventRepository`.
   - `apps/api/src/bootstrap.ts` executes `timelineDdl` directly, while `fastify.adapter.ts` applies `domainMigrations` for API-owned models.
4. The Timeline package currently imports Fastify and owns route registration. This mixes domain persistence/business logic with transport hosting.
5. `TimelineUseCase` imports `ActorContext` and `SYSTEM_ACTOR` from the ORM, leaking infrastructure types into the domain layer.
6. `packages/orm` supports multiple drivers and has a process-global active DB handle. Its migration table is global and keyed only by migration ID; future modules need collision-safe ownership/namespacing.
7. API models, routes, and migrations are spread across `apps/api/src/db`, `interface/routes`, `infrastructure/persistence`, and addon packages. A single inventory and ownership map is needed before moving files.

### 3.2 Desired addon/module contract

Keep the addon architecture intentionally small and statically imported. It is a modular-monolith composition mechanism, not dynamic third-party code loading.

A domain module should own:

- domain vocabulary and invariants;
- Zod/domain schemas and stable contracts;
- models and migration definitions;
- repository interfaces and implementations;
- application/domain services or use cases;
- domain events and seed fixtures where justified;
- an explicit manifest declaring dependencies and ownership.

`apps/api` should own:

- Fastify route plugins and HTTP schemas;
- auth/role pre-handlers;
- request/response mapping;
- OpenAPI aggregation;
- dependency injection and runtime startup;
- registration of domain services and their route adapters.

Domain modules must not import Fastify. A route adapter can call a domain service; a domain service must not know whether it was called by Fastify, a CLI, or a desktop client.

The base registry should do only what is needed now:

1. validate manifests;
2. resolve dependency order;
3. detect duplicate route/model/migration ownership;
4. register declared models/services;
5. run migrations exactly once;
6. expose lifecycle/health state for diagnostics.

Do not add hot reload, remote addon installation, arbitrary dynamic imports, or a permission marketplace unless a real first-party requirement is approved.

### 3.3 Initial domain modules

Implement only the first core set after the model/ownership contracts are approved:

1. **Canon:** stable identity for canon entities, names, definitions, relationships, status, and owner approval/provenance.
2. **Knowledge:** sources, revisions, hashes, classifications, ingestion state, chunks/index references, and citations.
3. **Witness:** observations and assertions with source, epistemic status, author, and provenance.
4. **Chronicle:** events, eras, chronology, stories/episodes, and linked witnesses. Resolve the existing duplicate Timeline implementation here.
5. **Research:** questions, source sets, research runs, methods, findings, and hypotheses.

Later, only when workflows are real and accepted:

- `works` / `publication` for authored works and editorial release;
- `signal` for radio/channel/program/broadcast domain metadata, separate from ARSY infrastructure;
- `justice` for ANGEL WITH SHOTGUN only after legal/social data policy and product scope are defined.

SIDRA is a graph/navigation projection over the relationships owned by these modules unless a separately justified graph-specific write model becomes necessary. CRAYON, SIN CAN, and MYTHOS are primarily explorer experiences, not independent persistence domains.

---

## 4. Deployment target — simplify, do not multiply

### 4.1 Core production stack

The desired default production Compose topology is:

```text
caddy
web
api
postgres
```

Operational services can be added only when their feature is active and their operational boundary is documented:

```text
radius        # optional/explicit network profile; UDP exposure must be intentional
snmp-poller   # internal network only unless a real external client is required
syslog        # internal or loopback/VPN only
storage       # internal service only if the web/API storage feature is retained
arsy          # separate control plane only if its real runtime is required
```

Do not run all optional infrastructure by default just because a source directory exists. Use Compose profiles or a separate, documented ops Compose overlay. Do not expose Postgres or private service ports to the public internet.

### 4.2 Deployment decisions

- One Caddy ingress and one production VPS topology.
- `web` and `api` are the only server app containers.
- ROCKSOUL is packaged and released as a desktop app; do not add it to the public production Compose stack.
- No separate A-L-L-A-H container; both public web domains resolve to `web`.
- No Cloudflare Worker deployment for MID/IGate as a parallel identity/operations runtime after consolidation.
- No production Memory container unless a future approved architecture explicitly requires one. Memory remains a private/local capability.
- `id.` host remains only as a compatibility alias if there are still valid OIDC clients.
- Normalize `DATABASE_URL`: production must always point to PostgreSQL. The Dockerfile's current SQLite default must not silently be treated as production configuration.
- Wire `STORAGE_URL` to a real internal storage service or disable the API storage routes and remove mandatory storage credentials until the service is actually deployed.
- RADIUS bind IP/firewall policy must be explicit. Do not default an Internet-facing UDP listener to `0.0.0.0` without a documented NAS allowlist and host firewall policy.
- Health/readiness must distinguish application readiness from optional upstream degradation.

### 4.3 Self-hosted CI/CD policy

- Replace GitHub-hosted `ubuntu-latest` execution with the owner's self-hosted runner labels.
- Separate an unprivileged CI runner from a production deploy runner. PR code must not receive production secrets or Docker/root permissions.
- Use a dedicated Windows self-hosted runner only for Windows Tauri installer/package verification if needed.
- Use runner labels such as `[self-hosted, linux, x64, moonwitness-ci]` and a separate protected deploy label. Match the actual installed machine labels; do not hardcode labels that do not exist.
- Keep `dev` as integration branch and `main` as release branch. Do not create extra permanent branches for each task.
- Build/test must run on `dev` and pull requests. Production deployment must run only from an approved release/tag on `main`.
- Use environment protection/owner approval for production.
- Missing deployment credentials must report `BLOCKED` or fail the production deploy job, not silently return a green deployment result.
- Pin immutable release tags and record the deployed commit/image digest.
- Use health checks, smoke checks, rollback to a known previous release, and a deployment evidence record.
- Choose one mechanism to manage production containers. Do not have Coolify and a direct Compose workflow both mutate the same stack concurrently. The repo's existing direct Compose path is the simplest baseline unless the owner explicitly chooses Coolify as the sole controller.
- Preview deployments are optional. Remove or disable the Vercel preview workflow if the owner wants all runtime/deployment execution self-hosted; never make preview availability a requirement for production correctness.

---

## 5. Prioritized execution waves

Each task below is intentionally bounded. The local AI must complete one task, attach evidence, and update the task state before starting tasks that depend on it. Task IDs are stable and should be copied into commits and reports.

### WAVE 0 — Establish the truth and unblock the branch (P0)

**Goal:** eliminate ambiguity before code movement.

| ID      | Task                                                                                                  | Acceptance evidence                                                                                                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MW-0001 | Fetch latest `main` and `dev`; inspect `git status`, branch state, PR #244, and required checks       | A short branch report with exact SHAs, ahead/behind state, and check conclusions. No force push.                                                                     |
| MW-0002 | Reconcile `dev` with `main` using the existing branch/promotion policy                                | Branch histories are in the expected two-branch state; no lost commits; promotion PR checks are complete.                                                            |
| MW-0003 | Capture the current workspace/dependency graph for all `apps`, `packages`, `services`, and `cp` roots | A generated inventory lists imports, workspace names, build scripts, runtime entrypoints, Docker/Compose references, and consumers.                                  |
| MW-0004 | Capture runtime topology and all service upstream URLs                                                | Every API route that calls an upstream has a corresponding runtime or is explicitly marked disabled/degraded. Storage mismatch is resolved or documented as blocked. |
| MW-0005 | Create an architecture decision document for the three-app topology and trust zones                   | `web`, `api`, and `rocksoul` are named exactly; Nine Worlds are mapped as experiences; product/data boundaries are explicit.                                         |
| MW-0006 | Reconcile stale documents without deleting history                                                    | README, WORK_PLAN, audit report index, UI status, and old ADR references are classified as current, historical, or superseded.                                       |

**Gate W0:** do not start destructive folder moves while `dev` and `main` are diverged or the dependency/runtime inventory is incomplete.

### WAVE 1 — Reduce the workspace to three apps (P0/P1)

**Goal:** make `apps/` reflect the agreed application architecture while preserving useful behavior.

| ID      | Task                                                                                                                        | Depends on       | Acceptance evidence                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| MW-0101 | Add an executable workspace topology check that requires exactly `apps/api`, `apps/web`, and `apps/rocksoul` at final state | MW-0003, MW-0005 | The check fails when an extra application workspace is added and passes for the agreed three.                                           |
| MW-0102 | Decide whether the CLI is still used and inventory its commands/clients                                                     | MW-0003          | Every CLI command has a named consumer or is marked for retirement.                                                                     |
| MW-0103 | Move the retained CLI to `packages/cli` or a tools location                                                                 | MW-0102          | CLI tests/build pass; no `apps/cli` workspace remains; CLI behavior is unchanged.                                                       |
| MW-0104 | Compare IGate worker probes with API probes/control operations                                                              | MW-0003, MW-0004 | A parity matrix identifies unique behavior, duplicate behavior, and active external callers.                                            |
| MW-0105 | Port only required IGate behavior into API-owned operations and retire `apps/igate`                                         | MW-0104          | No active client points to an unowned worker; probe/security tests pass; no D1 runtime dependency remains solely for IGate.             |
| MW-0106 | Inventory MID users, OAuth/OIDC clients, issuer URLs, cookie domains, redirect URIs, and token validation call sites        | MW-0003          | All first-party client flows are mapped; unknown clients are not silently removed.                                                      |
| MW-0107 | Approve a single API-owned identity model and the minimal required OIDC compatibility surface                               | MW-0106          | An ADR states which flows survive, which are retired, and how sessions/roles are owned.                                                 |
| MW-0108 | Move retained identity code into an API-owned module/package; remove the independent MID app boundary                       | MW-0107          | API uses one persistence owner and one auth policy; no `apps/mid` app remains.                                                          |
| MW-0109 | Verify private Memory product scope and local data inventory                                                                | MW-0003          | Original archives, SQLite files, model cache, Drive credentials, and source provenance are inventoried; no data is uploaded or deleted. |
| MW-0110 | Choose the Memory transition: ROCKSOUL-local feature or a temporary localhost-only `services/memory` worker                 | MW-0109          | A decision records UI ownership, local API/worker lifecycle, and a no-public-network policy.                                            |
| MW-0111 | Move or wrap Memory under the approved private boundary                                                                     | MW-0110          | The How U Remind Me workflow remains usable locally; public web/API does not gain access to private archive data.                       |
| MW-0112 | Remove `apps/memory` as a pnpm app workspace after parity and data-safety checks                                            | MW-0111          | Exactly three `apps/` workspaces remain; memory local data remains intact.                                                              |

**Important:** `apps/memory` is not a simple duplicate to delete. It currently contains a real private archive product and its own Python API/worker/frontend. Preserve its useful behavior and data while moving its app ownership. Keep the temporary local-only stack outside public production deployment until the new boundary is verified.

### WAVE 2 — Make API identity and runtime ownership unambiguous (P1)

| ID      | Task                                                                                                     | Depends on       | Acceptance evidence                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| MW-0201 | Document user/session/client/token data ownership in one identity schema map                             | MW-0106, MW-0107 | No duplicate user/session/signing-key owner remains undocumented.                                         |
| MW-0202 | Consolidate API session creation, cookie handling, bearer validation, role checks, and logout/revocation | MW-0201          | Integration tests cover login, logout, expiry, revocation, role denial, and invalid token.                |
| MW-0203 | Define issuer and callback compatibility for `id.moonwitness.biz.id`                                     | MW-0202          | Discovery/JWKS/callback behavior is tested for every retained client, or the alias is explicitly retired. |
| MW-0204 | Remove old MID environment variables and D1 adapter when no longer consumed                              | MW-0203          | Search/contract tests prove no runtime imports or required env variables remain.                          |
| MW-0205 | Enforce deny-by-default server authorization for all protected routes                                    | MW-0202          | Route matrix tests cover anonymous, viewer, editor, admin, and invalid/expired identities.                |
| MW-0206 | Remove duplicate or unused auth migrations/models after confirming the server database is empty          | MW-0201          | Clean initial schema builds from zero; ROCKSOUL/local data is untouched.                                  |

### WAVE 3 — Repair ORM and the domain/addon lifecycle (P1)

| ID      | Task                                                                                                         | Depends on       | Acceptance evidence                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| MW-0301 | Inventory every model, table, migration, repository, owner, and route                                        | MW-0003          | One ownership matrix exists; duplicate table/entity definitions are highlighted.                                                                 |
| MW-0302 | Define ORM/domain boundary and move actor/audit context out of ORM-specific use cases                        | MW-0301          | Domain use cases do not import ORM driver/repository types; tests inject actor and repository interfaces.                                        |
| MW-0303 | Make repository/transaction dependency explicit enough for deterministic tests                               | MW-0302          | No domain use case relies on an undocumented global DB singleton; transaction behavior is testable.                                              |
| MW-0304 | Namespace migration ownership and make migration execution single-source                                     | MW-0301          | Migration IDs are unique by owner; checksum protection remains; all migrations run once in deterministic order.                                  |
| MW-0305 | Resolve Timeline dual persistence (`timeline_events` versus `ops_events`)                                    | MW-0301          | Exactly one canonical Timeline model/repository/migration path feeds public timeline routes. Operational audit events remain a separate concern. |
| MW-0306 | Remove raw `timelineDdl` execution and duplicate migration registration                                      | MW-0305          | Fresh boot and repeated boot do not execute competing schema paths.                                                                              |
| MW-0307 | Move Timeline HTTP routes into `apps/api`; keep domain package transport-agnostic                            | MW-0305          | `packages/addons/timeline` has no Fastify import; API route tests and domain tests pass independently.                                           |
| MW-0308 | Implement a minimal, real addon lifecycle in `__base`                                                        | MW-0304, MW-0307 | Manifest validation, dependency ordering, ownership collision checks, registration, and single migration phase are executable and tested.        |
| MW-0309 | Remove dead D1 driver/adapters if MID and IGate no longer use D1                                             | MW-0105, MW-0204 | No supported runtime needs D1; driver code and dependencies are removed with tests.                                                              |
| MW-0310 | Verify ORM behavior on the actual production driver (PostgreSQL) and local test driver (SQLite where needed) | MW-0303, MW-0304 | CRUD, audit, soft-delete, optimistic locking, transactions, and migration tests pass on both supported drivers.                                  |

Keep ORM generic: drivers, model definition, migrations, transactions, actor context, audit, backup/restore, and concurrency. Do not put canon or Nine Worlds logic in it.

### WAVE 4 — Establish the first real domain modules (P1/P2)

**Goal:** implement domain capabilities, not empty package shells.

| ID      | Task                                                                                             | Depends on                         | Acceptance evidence                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| MW-0401 | Approve canonical entity/provenance/relationship contracts for Canon                             | MW-0005, MW-0301                   | Stable IDs, source refs, author, status, classification, lifecycle, and history are defined.                                         |
| MW-0402 | Implement Canon module (entities, terms, relationships, source lineage)                          | MW-0401, MW-0308                   | Repository/service/schema/migrations/tests live under one owner; API adapter uses the module.                                        |
| MW-0403 | Approve Knowledge source/revision/hash/classification/ingestion/citation contract                | MW-0401                            | The contract preserves original sources and revisions; access filters apply before retrieval.                                        |
| MW-0404 | Implement Knowledge module and source/citation retrieval                                         | MW-0403, MW-0308                   | Search results return source title, revision, URI/location, classification, and provenance.                                          |
| MW-0405 | Approve Witness claim/observation/evidence contract                                              | MW-0401, MW-0403                   | Observation, report, fact, interpretation, hypothesis, dream, fiction, joke, and unknown remain distinct.                            |
| MW-0406 | Implement Witness module and provenance-aware relationships                                      | MW-0405, MW-0308                   | No relationship is inferred from co-occurrence alone; each assertion has source/status/author.                                       |
| MW-0407 | Consolidate Chronicle/Timeline under one domain module                                           | MW-0305, MW-0308                   | Event/era/story/episode chronology uses one model and one API contract.                                                              |
| MW-0408 | Implement Research module (question, source set, run, method, findings, hypothesis)              | MW-0403, MW-0405, MW-0308          | Findings are distinguishable from generated summaries and hypotheses.                                                                |
| MW-0409 | Build SIDRA graph as a read/projection layer over approved relationships                         | MW-0402, MW-0404, MW-0406, MW-0408 | Graph edges always reference canonical domain records and provenance; no duplicate canonical owner.                                  |
| MW-0410 | Define selective Publication/Export workflow                                                     | MW-0402, MW-0404, MW-0406, MW-0408 | Export requires content selection, destination, attribution/context, privacy review, owner approval, and correction/retraction path. |
| MW-0411 | Defer Works, Publication, Signal, and Justice write models until concrete workflows are approved | MW-0005                            | No empty domains or premature schema are added; decisions and triggers are recorded.                                                 |

### WAVE 5 — Simplify infrastructure and fix actual deployment gaps (P0/P1)

| ID      | Task                                                                                                  | Depends on       | Acceptance evidence                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MW-0501 | Decide storage runtime: deploy Rust storage service internally or disable the web/API storage feature | MW-0004          | API `STORAGE_URL` resolves to a real container/service or routes are visibly disabled; no loopback self-call remains.                                   |
| MW-0502 | Create Compose core and optional ops profiles                                                         | MW-0501          | Default stack contains Caddy, web, API, PostgreSQL; optional services start only with an explicit profile.                                              |
| MW-0503 | Confirm which RADIUS/SNMP/Syslog workflows are truly required for first production                    | MW-0004          | Every retained container has an owner, consumer, port policy, health check, persistence, and runbook.                                                   |
| MW-0504 | Define RADIUS bind/firewall/NAS allowlist and internal service exposure                               | MW-0503          | UDP exposure is intentional and documented; unsafe broad defaults are removed or explicitly gated.                                                      |
| MW-0505 | Normalize production database configuration to PostgreSQL                                             | MW-0004          | Dockerfile/runtime defaults cannot silently start production against a local SQLite file.                                                               |
| MW-0506 | Remove dead service URLs, env keys, volumes, and compose dependencies                                 | MW-0501, MW-0503 | `docker compose config` and runtime smoke tests prove all configured upstreams exist.                                                                   |
| MW-0507 | Add self-hosted runner labels to CI and verify runner capabilities                                    | MW-0001          | Required Node, pnpm, Rust, Go, Docker and (where needed) Windows capabilities are present. No `ubuntu-latest` remains for the required owned workflows. |
| MW-0508 | Separate unprivileged CI from privileged production deploy runner                                     | MW-0507          | Pull-request jobs cannot access production secrets or Docker deployment privileges.                                                                     |
| MW-0509 | Move release deployment to self-hosted runner and protected release environment                       | MW-0508          | Production deploy runs only from approved `main` release/tag; no hosted runner is required for core deploy.                                             |
| MW-0510 | Replace silent deploy-skip with explicit BLOCKED/FAIL semantics                                       | MW-0509          | Missing credentials cannot be reported as a successful deployment.                                                                                      |
| MW-0511 | Decide whether Vercel preview workflow is retained, made self-hosted, or removed                      | MW-0507          | There is one clear preview path; no accidental second production runtime.                                                                               |
| MW-0512 | Add deployment smoke/readiness/rollback verification                                                  | MW-0509          | Deploy evidence records commit/tag, config validation, health, smoke results, and rollback target.                                                      |

### WAVE 6 — Complete the unified product experience (P1/P2)

| ID      | Task                                                                             | Depends on       | Acceptance evidence                                                                                                                           |
| ------- | -------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| MW-0601 | Create canonical Nine Worlds route/navigation map for `apps/web`                 | MW-0005          | Each world has a clear purpose, route, visibility, owning domains, and no separate app requirement.                                           |
| MW-0602 | Verify all A-L-L-A-H public routes/assets/content now resolve from `apps/web`    | MW-0601          | No old `apps/a-l-l-a-h` imports, path assumptions, or standalone deployment targets remain.                                                   |
| MW-0603 | Separate public reading routes from protected operations routes                  | MW-0205, MW-0601 | Server-side authorization tests cover Shadow/Command Center/ops actions.                                                                      |
| MW-0604 | Keep one canonical UI package and enforce app import boundaries                  | MW-0601          | Apps do not copy components or bypass public UI exports; DNA/skin ownership tests pass.                                                       |
| MW-0605 | Apply accessibility, responsive, reduced-motion, keyboard, and performance gates | MW-0604          | Visual/E2E evidence covers major public experiences and protected console surfaces.                                                           |
| MW-0606 | Preserve ROCKSOUL's desktop-first, private interaction boundary                  | MW-0109, MW-0110 | ROCKSOUL remains Tauri/local-first; no public dashboard conversion or implicit sync is introduced.                                            |
| MW-0607 | Verify new optional Rocksoul backup/S3 gateway boundaries                        | MW-0606          | Loopback-only, short-lived credentials, size/part limits, encryption/integrity, restore tests, and explicit owner initiation remain enforced. |

### WAVE 7 — Documentation, release, and final acceptance (P0)

| ID      | Task                                                                                                                                       | Depends on                | Acceptance evidence                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| MW-0701 | Rewrite root README for the three-app architecture and current runtime                                                                     | MW-0101, MW-0502          | README matches the workspace tree, ports, startup commands, secrets, and service profiles.                                     |
| MW-0702 | Replace or clearly archive the old audit report                                                                                            | MW-0003, MW-0301, MW-0501 | A current audit report references the exact branch/commit and separates verified, proposed, and unknown items.                 |
| MW-0703 | Replace stale WORK_PLAN with the task ledger from this grand plan                                                                          | All waves                 | Each task has status, owner/agent capability, dependencies, acceptance criteria, and evidence link.                            |
| MW-0704 | Reconcile copied blueprint/constitution ADR references                                                                                     | MW-0005                   | Historical decisions remain discoverable but are labelled superseded or reconciled by a new approved ADR.                      |
| MW-0705 | Publish local-AI execution instructions and repository-specific guardrails                                                                 | MW-0701, MW-0703          | A fresh local AI can identify source of truth, target branch, permissions, scope, tests, and stop conditions without guessing. |
| MW-0706 | Run full release gate on `dev`, then promote through the normal PR to `main`                                                               | All required tasks        | Required CI checks pass; no hidden skips; `main` receives only a verified promotion.                                           |
| MW-0707 | Verify clean install, clean DB bootstrap, production Compose, browser E2E, API contract, service health, desktop package, and restore path | MW-0706                   | Evidence exists for every required target; unsupported platforms are explicitly marked not run.                                |

---

## 6. Execution order and parallel-agent boundaries

The waves are sequential at the decision level, but some implementation tasks can run in parallel after W0 has locked ownership and branch state.

### Safe parallel lanes

| Lane                     | Work                                     | File ownership boundary                                                                            |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A — Docs/governance      | ADRs, README, current audit, task ledger | `docs/**`, root `README.md`, `WORK_PLAN.md`; do not edit runtime code                              |
| B — Workspace cleanup    | CLI/IGate inventory and relocations      | `apps/cli/**`, `apps/igate/**`, target package path; avoid auth and migration files                |
| C — Identity             | MID inventory and API auth consolidation | `apps/mid/**`, `apps/api/src/**` auth/env paths, auth package; one owner only                      |
| D — ORM/domain           | migration map, Timeline, addon registry  | `packages/orm/**`, `packages/addons/**`, API persistence paths; one migration integrator only      |
| E — Runtime/deploy       | Compose, Dockerfile, Caddy, workflows    | `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.github/workflows/**`; one deployment owner only |
| F — ROCKSOUL private app | desktop privacy/backup verification      | `apps/rocksoul/**`; no public API/data migration changes without a separate contract               |

### Parallelization rules

- Never let two agents edit the same migration, package manifest, lockfile, or shared route registration concurrently.
- One integrator owns `pnpm-lock.yaml`, root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and merge conflict resolution.
- Use temporary local worktrees only when parallel work genuinely requires isolation. Do not create permanent remote branches or one GitHub PR per tiny task.
- Work toward `dev`; never push directly to `main`. Promotion remains controlled by the repository's `dev → main` process.
- Do not parallelize a folder deletion with the agent still mapping its imports/callers.
- Do not run destructive database cleanup while another task is creating or validating migrations.

---

## 7. Local AI execution contract

### 7.1 Mandatory startup procedure

Before changing code, the agent must:

1. Confirm repository root is `A-L-L-A-H/moonwitness`.
2. Run `git status --short`, `git branch --show-current`, `git log -1 --oneline`, and `git remote -v`.
3. Fetch current remote refs and compare `origin/dev` with `origin/main`.
4. Stop if the worktree contains unrelated user changes; do not reset, clean, stash, or overwrite them without permission.
5. Read this plan, root README, `docs/constitution/CORE/FOUNDATION-CHARTER.md`, `docs/constitution/CORE/DOMAIN-MODEL.md`, `docs/constitution/KNOWLEDGE/KNOWLEDGE-BASE-CONTRACT.md`, `docs/constitution/SECURITY/THREAT-MODEL.md`, and the current relevant ADRs.
6. Inspect actual package manifests and call sites before moving/deleting any directory.
7. Establish a baseline with the available gate commands and record exactly which steps ran.

### 7.2 Task execution behavior

For each task ID:

1. State the task objective and affected paths.
2. Check all dependencies are completed.
3. Read the relevant implementation and tests before editing.
4. Make the smallest complete change; do not mix unrelated cleanup.
5. Add/update tests for the changed behavior.
6. Run the narrow test first, then the relevant package gate, then the broader gate at the wave boundary.
7. Inspect the diff for unrelated files, secrets, generated files, and accidental data deletion.
8. Update the task ledger with `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN` and evidence.
9. Commit only coherent, verified units when commit authority has been granted. Do not push or release unless explicitly authorized.

### 7.3 Stop conditions

The agent must stop and report a blocker if:

- `dev`/`main` history is unexpectedly divergent or the required promotion is not settled;
- product intent, domain ownership, or privacy classification conflicts across current authoritative documents;
- a required identity client/redirect URI has not been inventoried;
- a proposed deletion has an unknown consumer;
- a database is not proven to be the intended empty server database;
- a task risks deleting ROCKSOUL/local Memory records, original archive files, credentials, or backups;
- the deployment runtime/secret owner is unknown;
- a failing test reveals behavior beyond the task's bounded scope;
- the task needs a new external service, vendor, identity provider, or protocol not approved in this plan.

The agent must not silently invent product features, canon definitions, APIs, environment variables, route owners, fake data, or success evidence.

### 7.4 Required completion report

Every task or wave report must include:

```text
Task ID:
Repository / branch / base SHA:
Final commit (if committed):
Objective:
Changed files:
Behavior changed:
Tests/commands executed:
PASS / FAIL / BLOCKED / NOT RUN:
Evidence (logs, screenshots, CI links, test reports):
Security/privacy impact:
Database/schema impact:
Rollback approach:
Remaining risks or decisions:
Human approval still required:
```

Never claim “done”, “complete”, “production-ready”, or “released” unless the matching acceptance gate and evidence are present.

---

## 8. Validation gates

### 8.1 TypeScript/web/API

At minimum, run the repository's own scripts when present:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm gate:quick
pnpm gate:local
```

For targeted packages/apps, also run their direct lint/typecheck/test/build commands. E2E suites must run against a real built app/API environment; do not count a skipped/uninstalled Playwright suite as passing.

### 8.2 Rust/Go

For each retained Rust service and ROCKSOUL Rust/Tauri code:

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

For the Go control plane:

```bash
cd cp/arsy
go build ./...
go vet ./...
go test ./... -count=1
```

Only claim platform packaging success when the required OS runner has actually built and launched the package.

### 8.3 Runtime/integration

```bash
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

Then verify:

- web public host and A-L-L-A-H host resolve to the same `web` runtime;
- API health/readiness works through the canonical host;
- identity alias/issuer works only for retained clients;
- protected operations are denied without correct auth/role;
- every configured upstream URL resolves to a real service;
- optional ops services do not accidentally bind public ports;
- Postgres is not publicly exposed;
- backup and restore are tested, not only backup creation;
- production smoke checks and rollback work against a known release.

### 8.4 Privacy-specific verification

- ROCKSOUL local DB stays in the app's per-user data directory.
- Private Memory archive stays local by default.
- No private table/route is accidentally added to public API.
- Backup is opt-in, encrypted, and integrity checked.
- A restore test does not overwrite the current local database before validation and confirmation.
- Publication/export only includes the exact selected artifacts and necessary provenance.

---

## 9. Definition of final success

The grand plan is complete only when all of these are true:

1. `apps/` contains exactly `web`, `api`, and `rocksoul`.
2. All old app code is either moved to an appropriate package/service, merged into the right app, or retired with proof that it has no remaining consumers.
3. Nine Worlds exist as coherent experience destinations; they do not multiply apps, databases, or deployment surfaces.
4. MoonWitness public/restricted data and ROCKSOUL private data remain isolated by policy and tests.
5. There is one API-owned identity model and one canonical public API door.
6. ORM migrations and addon registration have one deterministic lifecycle.
7. Timeline/Chronicle has one canonical persistence path.
8. Every API upstream in production has a real runtime or is explicitly disabled; specifically, storage is no longer a broken loopback default.
9. Default production deployment is simple and deterministic; optional operational services are explicit and documented.
10. Required CI/CD executes on self-hosted runners with correct privilege separation; no hosted runner is required for the core release path.
11. `main` contains a release that was promoted from a fully verified `dev` state.
12. README, audit report, work plan, ADRs, and local-AI instructions match the actual code and runtime.
13. Evidence exists for clean install, tests, API contracts, browser E2E, Compose startup, health/readiness, backup/restore, and supported desktop packaging.

### What is intentionally not part of the first pass

- No microservice decomposition of every world/domain.
- No independent application for each world.
- No standalone MID or IGate runtime.
- No automatic ROCKSOUL ↔ MoonWitness data synchronization.
- No external IdP or new SaaS dependency by default.
- No graph database solely to implement SIDRA's visual graph.
- No full Justice, Publication, or Signal domain schema before actual workflows are approved.
- No public/production Memory archive service by default.
- No mass rewrite of all docs or all UI components unrelated to the approved target.

---

## 10. Audit limitations and source-of-truth note

This plan is based on read-only inspection of GitHub's latest visible `dev` and `main` trees, manifests, route/bootstrap code, Docker/Compose files, workflow definitions, and current product/architecture documents. The audit did not execute the code in the owner's local checkout, inspect production secrets, connect to the real VPS, or verify the actual deployed service state.

Before implementation, the local AI must fetch current remote refs and inspect the real worktree/runtime. Any difference from the audit snapshot must be reported and reconciled before the corresponding task begins.

Historical audit findings are not automatically current bugs. Re-test them against the target commit; keep only issues that still reproduce.
