# ADR-006: Three-App Topology, Nine Worlds Mapping, and Trust Zones

- **Status:** Accepted (Wave 0 baseline, `dev` @ `acdc72a`)
- **Date:** 2026-11-18
- **Reconciles / Supersedes:**
  - `MOONWITNESS-AUDIT-REPORT-2026-11-18.md` (8-app historical snapshot at `0.6.1`)
  - Legacy references in `docs/dna/09-UI-ARCHITECTURE-STATUS.md` and `docs/constitution/**` suggesting separate app runtimes per world or standalone `apps/igate`, `apps/mid`, `apps/cli`, `apps/memory`
  - Prior implicit SQLite fallback in production API defaults

## 1. Decision: Three Application Workspaces

At target state, `apps/` contains **strictly three** deployable/distributable user-facing application workspaces:

| App             | Role                                                                                                                      | Runtime                    | Primary Trust Zone               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------- |
| `apps/web`      | Unified public reading surfaces (`A-L-L-A-H` sanctuary + MoonWitness Nine Worlds portal) & protected operator console     | Next.js 16 (App Router)    | Cloud / VPS (Zone A)             |
| `apps/api`      | Modular-monolith backend API, OpenAPI contracts, consolidated OIDC/session identity, ops proxies, and core domain modules | Fastify 5 + Node.js        | Cloud / VPS (Zone A)             |
| `apps/rocksoul` | Private, local-first desktop instrument & creative studio (`ROCKSOUL DX`)                                                 | Tauri 2 (Rust) + React SPA | Owner Workstation Local (Zone B) |

All other workspaces currently in `apps/` are consolidated cleanly:

1. `apps/cli` (`@moonwitness/cli`) -> moved to `packages/cli` (first-party operator/developer CLI tooling).
2. `apps/igate` (`@moonwitness/igate`) -> parity verified against `apps/api` `/api/v1/probes/*` & `/api/v1/igate/*`, then retired (removing standalone Cloudflare Worker/D1 runtime dependency).
3. `apps/mid` (`@moonwitness/mid`) -> consolidated into API-owned `@moonwitness/mid` identity module inside `packages/mid` / `apps/api` with one session/key owner.
4. `apps/memory` (`How U Remind Me` local archive/search deck) -> relocated out of `apps/` into private localhost-only `services/memory`, preserving all local `data/`, `venv/`, `.env`, SQLite FTS5, and LanceDB files untouched.

## 2. Nine Worlds Mapped as Experiences & Domain Modules

The **Nine Worlds** and adjacent portal entries (`A-L-L-A-H`, `Shadow Vault`, `CRAYON`, `SIN CAN`, `MYTHOS`) are **experiences within `apps/web`** backed by static modular-monolith modules in `apps/api` and `@moonwitness/canon`, **not** independent applications or separate databases:

- **Implemented Core Domain Modules (Wave 3–4 target):**
  - **Canon:** Canonical entities, names, terms, definitions, provenance, and status.
  - **Knowledge:** Immutable source revisions, cryptographic hashes, classifications, ingestion state, and citations.
  - **Witness:** Epistemic assertions and observations separating observation, report, fact, interpretation, hypothesis, dream, fiction, joke, and unknown.
  - **Chronicle (consolidating Timeline):** Events, eras, narrative stories/episodes, and witness cross-links (eliminating dual `timeline_events` vs `ops_events` persistence).
  - **Research:** Questions, source sets, runs, methods, findings, and hypotheses.
  - **SIDRA:** Read/navigation graph projection over canonical relationships owned by the modules above.
- **UI-First / Deferred Write Models (MW-0411):**
  - `Works / Publication` (selective owner-approved export workflow defined before editorial write schemas).
  - `Signal` (broadcast/program metadata only; distinct from Go host control plane `cp/arsy`).
  - `Justice / ANGEL WITH SHOTGUN` (deferred until explicit legal/social policy is approved).
  - `CRAYON`, `SIN CAN`, `MYTHOS` (explorer/UX modes over core Knowledge, Chronicle, and Canon entities).

## 3. Explicit Trust & Data Zones

Cross-zone silent replication or shared database writes are **prohibited**:

1. **Zone A — MoonWitness Production Stack (VPS):**
   - Core default Compose stack: `caddy` (TLS reverse proxy) -> `web` (`:3000`), `api` (`:3002`), `postgres` (`DATABASE_URL` required in production; SQLite restricted to local development/testing).
   - Optional operational profile (`ops` Compose profile): Rust `storage` (`:8091`), `radius` (`:1812/udp`, `:1813/udp` + HTTP control `:8090`, gated bind), `snmp-poller` (`:8094`), `syslog` (`:8093`), and optional separate host control plane `cp/arsy`.
2. **Zone B — ROCKSOUL DX Private Local Zone:**
   - Local-first Tauri 2 desktop app backed by private encrypted/local SQLite (`rusqlite`).
   - Optional owner-initiated S3 encrypted backup & loopback SigV4 gateway bound strictly to `127.0.0.1`.
   - Public `apps/web` / `apps/api` cannot query or ingest private ROCKSOUL SQLite state without explicit owner export.
3. **Zone C — Private Personal Memory Archive (`services/memory`):**
   - Localhost-only Python FastAPI (`127.0.0.1:8000`) + local web UI (`3005`), SQLite FTS5 + LanceDB (`data/db`, `data/inbox`, `data/vectors`, `venv/`, `.env`).
   - Strictly excluded from public VPS deployment, Docker Compose core, and automated cloud sync.

## 4. Document Classification Standard

Historical architectural blueprints (`docs/blueprint/**`), constitution charters (`docs/constitution/**`), and point-in-time snapshots (`MOONWITNESS-AUDIT-REPORT-2026-11-18.md`, `WORK_PLAN.md`) remain discoverable as historical provenance, with current runtime authority delegated to:

1. `docs/architecture/adr-006-three-app-topology-and-trust-zones.md` (this ADR)
2. `docs/architecture/RUNTIME-SERVICE-INVENTORY.md`
3. `WORK_PLAN.md` (live execution task ledger)
