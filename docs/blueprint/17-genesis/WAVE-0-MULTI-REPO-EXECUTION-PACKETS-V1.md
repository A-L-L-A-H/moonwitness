# Genesis Wave 0 — Multi-Repo Worker Execution Packets

Status: **READY FOR EXECUTION / FOUNDATION AUTHORIZED**

## Global objective

Create or normalize clean, independent Gen2 repositories under `ArsyBelovedLabs` with a common, current-compatible toolchain and identical minimum governance/CI expectations. Do not migrate legacy application logic in Wave 0. Preserve verified work that already conforms to the frozen architecture.

## Global locked baseline

- Runtime policy: latest-supported-production; track latest upstream.
- Current check recorded 2026-09-01: Node 26.8.1 Current, Node 24.20.0 LTS.
- Vercel/serverless compatibility is mandatory for network-facing workloads where the repository runtime contract requires it.
- Docker/Node long-running compatibility is mandatory for long-running/service workloads where the repository runtime contract requires it.
- pnpm is the package manager standard.
- TypeScript + ESM.
- Backend baseline: Fastify 5 where applicable.
- Frontend baseline: Next.js 16 / React 19.2 line where applicable, subject to the approved toolchain manifest and target compatibility.
- HTTP network door: HTTPS + OpenAPI.
- SSE is a streaming mode of the same HTTP API.
- No tRPC/GraphQL as ecosystem standards.
- gRPC only when later justified by a concrete workload.
- No cross-repository deep source imports.
- No direct cross-repository database coupling.
- Primary public Web target: `moonwitness-wheremythfadetolegend` per ADR-025.
- `moonwitness-web` remains legacy/paused and is not a Wave 0 primary-Web provisioning target.

## Common Wave 0 acceptance gate

Every worker must:

1. Inspect its target repository before editing; normalize in place when it already exists.
2. Establish `package.json`, `tsconfig.json`, `.gitignore`, `.editorconfig`, `README.md`, `SECURITY.md`, `CONTRIBUTING.md` where applicable.
3. Pin the current supported toolchain through project metadata and CI.
4. Add lint/typecheck/test/build scripts appropriate to the repo.
5. Add CI with dependency installation, typecheck, tests, build, and architecture/security sanity checks.
6. Add a reproducible local command path.
7. Prove no provider-specific code leaks into reusable domain packages.
8. Preserve existing verified capability work that conforms to the frozen architecture.
9. Emit the required machine-readable worker report from the implementation handoff contract.

## Packet matrix

| Wave 0 worker | Repository | Primary job | Parallel with |
|---|---|---|---|
| W0-01 | moonwitness-core | package foundation + contracts | all except shared contract edits |
| W0-02 | moonwitness-corpus | knowledge repo foundation | W0-03..W0-05 |
| W0-03 | moonwitness-cosmic | engine repo foundation | W0-02,W0-04,W0-05 |
| W0-04 | moonwitness-crayon | methodology repo foundation | W0-02,W0-03,W0-05 |
| W0-05 | moonwitness-prophetic | domain repo foundation | W0-02..W0-04 |
| W0-06 | moonwitness-runtime | orchestration foundation | W0-02..W0-05 |
| W0-07 | moonwitness-worker | async execution foundation | W0-06 only if no shared contract edits |
| W0-08 | moonwitness-api | HTTP/OpenAPI transport shell | after W0-01 contract baseline |
| W0-09 | moonwitness-sdk | generated/typed consumer shell | after W0-08 API baseline |
| W0-10 | moonwitness-frontend-platform | portable UI package foundation; preserve verified Experience Constitution/icon work | W0-01; parallel to W0-08 |
| W0-11 | moonwitness-wheremythfadetolegend | primary public Web serverless-first app normalization | after W0-08 and W0-10 |
| W0-12 | moonwitness-commandcenter | operational app shell | after W0-08 and W0-10 |
| W0-13 | moonwitness-crayon-lab | research lab app shell | after W0-08 and W0-10 |

## Serial dependencies

`W0-01 → W0-08 → W0-09`

`W0-10` may proceed after foundation conventions exist, but its public contract must remain independent from domain implementations. Existing verified frontend-platform work is retained and normalized rather than recreated.

Applications wait for both API and frontend-platform baselines.

## Forbidden in Wave 0

- No legacy feature migration.
- No wholesale copying of legacy repositories.
- No database schema cloning.
- No custom Plane synchronization service.
- No second network protocol becoming canonical.
- No business logic in transport adapters.
- No application-specific domain package hidden in a generic package.
- No reprovisioning `moonwitness-web` as the primary public Web while ADR-025 is active.
