# ADR-027 — GitLab, Foundation, and ROCKSOUL Platform Boundary

Status: **PROPOSED / REVIEW REQUIRED**
Date: 2026-09-01

## Decision

Adopt the following production architecture:

1. **GitLab Self-Hosted is the platform backbone.** It owns source repositories,
   projects, issues, merge requests, review and approval workflows, CI/CD pipelines,
   runners, package and container registries, release automation, and deployment
   records.
2. **`ArsyBelovedLabs/moonwitness-platform-foundation` is the MoonWitness
   application/domain kernel.** It owns the application runtime, plugin lifecycle,
   domain policy, authorization enforcement, application persistence, durable
   workflow state, audit and provenance, and typed integration contracts.
3. **ROCKSOUL is a product suite running on Foundation.** Its coding agent,
   orchestration, confined command execution, browser automation, gateways, AI/MCP
   tools, and operator experience are integrated as Foundation plugins, typed
   adapters, or isolated workers according to their execution risk.
4. **GitLab integration is API-only.** Foundation and ROCKSOUL may use documented
   GitLab REST APIs, OIDC/OAuth, signed webhooks, CI/CD job contracts, and supported
   package/container registry protocols. They must not read or write GitLab's
   internal database, filesystem, queues, caches, or private implementation APIs.

This decision makes GitLab the operational backbone, Foundation the domain-aware
application kernel, and ROCKSOUL the product capability layer. They are separate
ownership boundaries, not three competing platform engines.

## Context

MoonWitness needs a live, self-hosted platform for code collaboration, automation,
artifact delivery, and controlled deployment. GitLab already supplies these generic
platform capabilities. Reimplementing them in Foundation or ROCKSOUL would create
duplicate identity, repository, CI/CD, runner, registry, and release systems.

Foundation already defines the intended MoonWitness application-kernel boundary:
domain-aware plugins, policies, persistence, audit, and integrations. ROCKSOUL is
being developed as the product suite that supplies autonomous engineering and
research capabilities. The architecture therefore needs one explicit ownership
decision before product integration and production deployment proceed.

The Blueprint remains the architecture and contract authority. GitLab stores and
executes delivery workflows, but pipeline configuration or runtime discovery must
not silently redefine ownership or canonical contracts.

## Logical topology

```text
MoonWitness Blueprint
  └── architecture, ownership, contracts, safety gates

GitLab Self-Hosted
  ├── source repositories, issues, merge requests and approvals
  ├── CI/CD pipelines and runners
  ├── package/container registries
  └── release and deployment automation
           │
           │ documented API / OIDC / webhook / CI / registry contracts
           ▼
MoonWitness Platform Foundation
  ├── application/domain kernel
  ├── plugin lifecycle and permissions
  ├── domain persistence and durable workflow state
  ├── audit, evidence and provenance
  └── typed GitLab and product integration adapters
           │
           ▼
ROCKSOUL Product Suite
  ├── coding-agent adapter
  ├── orchestrator
  ├── confined runner
  ├── isolated browser worker
  ├── gateway and channel adapters
  ├── AI/MCP tools
  └── operator/developer experience
```

## Ownership

| Capability | Canonical owner | Boundary |
|---|---|---|
| Source, projects, issues, merge requests and review state | GitLab Self-Hosted | GitLab UI and documented APIs |
| CI/CD, runners, registry, releases and deployment records | GitLab Self-Hosted | Versioned pipeline, runner and registry contracts |
| Architecture, capability ownership and canonical contracts | `moonwitness-blueprint` | Approved ADRs and versioned contract artifacts |
| Canonical external MoonWitness domain API | `moonwitness-api` | HTTPS + OpenAPI; Foundation does not introduce a second public domain API |
| Application runtime and plugin lifecycle | `moonwitness-platform-foundation` | Foundation kernel and plugin contracts |
| Domain policy, permissions and authorization enforcement | `moonwitness-platform-foundation` | Authenticated application boundary; GitLab identity may be mapped through OIDC |
| Domain persistence, agent/workflow state, audit and provenance | `moonwitness-platform-foundation` | Foundation-owned schemas and migration contracts |
| GitLab integration | Foundation GitLab adapter | Documented GitLab interfaces only |
| Coding-agent sessions and provider tools | ROCKSOUL product adapter/plugin | Authenticated Foundation contract; engine implementation remains replaceable |
| Goals, task graphs, approvals and orchestration | ROCKSOUL orchestration plugin | Durable Foundation state and policy gates |
| Shell commands and verification | ROCKSOUL confined runner | Typed argv plan, workspace confinement, budgets and approval |
| Browser automation | ROCKSOUL isolated browser worker | Typed steps, domain allowlist, approval and evidence |
| Webhooks, schedules and messaging channels | ROCKSOUL/Foundation integration plugins | Signed ingress, identity mapping and idempotency |
| Primary public MoonWitness Web | `moonwitness-wheremythfadetolegend` under ADR-025 | Existing historical-data path plus approved Foundation/API contracts for live capabilities |
| MoonWitness operations and research experience | `moonwitness-commandcenter` | Foundation application contracts; activation remains subject to its existing UI/API gates |
| ROCKSOUL operator/developer experience | `rocksoul-code-web` | Foundation product contracts; no privileged browser secrets |

Every capability must have one canonical owner. A standalone ROCKSOUL service may
remain a transitional sidecar only when its owner, contract, migration target, and
retirement or long-term isolation condition are recorded.

## Runtime boundary

The canonical runtime path is:

```text
Approved client or operator UI
  → canonical moonwitness-api HTTPS/OpenAPI boundary
  → Foundation application/domain kernel
  → Foundation policy, authorization and durable state
  → ROCKSOUL plugin or typed adapter
  → isolated runner/browser/engine worker when execution risk requires it
  → evidence, audit and result persistence in Foundation-owned storage
  → response or progress through the Foundation application contract
```

Repository, issue, merge-request, pipeline, or registry operations cross from
Foundation to GitLab only through the documented GitLab boundary. Privileged GitLab
or engine credentials must not be exposed to browser clients or product plugins.

The existing one-door HTTPS/OpenAPI rule continues to apply to MoonWitness domain
APIs, with `moonwitness-api` as the canonical external owner. Foundation may provide
internal host routes needed by trusted adapters and workers, but it does not create
a second public domain API. GitLab remains a separately administered platform
service; its supported API surface is an external integration boundary, not a
MoonWitness domain API.

## Deployment flow

The production delivery path is:

```text
Developer or authorized ROCKSOUL change proposal
  → GitLab issue/branch/merge request
  → required review, approval and security checks
  → GitLab CI build, test, contract checks and artifact attestation
  → versioned package/container in the GitLab registry
  → protected deployment pipeline and runner
  → Foundation migration and application deployment
  → ROCKSOUL plugin/adapter/worker rollout
  → health, readiness, contract and smoke verification
  → deployment evidence recorded in GitLab and Foundation audit records
```

Production mutation requires protected GitLab environments and explicit deployment
policy. ROCKSOUL may propose changes or trigger an authorized pipeline through the
GitLab API, but it may not bypass merge-request controls, protected environments,
required human approval, or Foundation policy.

Artifacts are promoted by immutable digest or equivalent verified identity. A
deployment must be reproducible from a versioned repository revision and retain
provenance for source, pipeline, artifact, configuration class, actor, and target
environment. Secrets remain in the approved GitLab/Foundation secret-management
boundary and are never committed or embedded in artifacts.

GitLab owns delivery automation, not every runtime hosting target. Existing hosting
decisions, including the primary public Web target under ADR-025, remain unchanged
unless a separate ADR explicitly migrates them.

## Migration

1. Approve this ADR and reconcile the design-freeze and canonical repository maps.
2. Inventory the live GitLab Self-Hosted endpoints, OIDC issuer, webhook contracts,
   runner classes, registries, protected environments, and secret owners without
   recording secret values in Blueprint.
3. Publish a capability migration matrix assigning every ROCKSOUL capability to a
   Foundation plugin, typed adapter, isolated worker, or explicitly transitional
   sidecar.
4. Complete Foundation production prerequisites: reproducible dependencies and
   configuration, PostgreSQL migrations, GitLab OIDC/session handling, durable
   webhook processing, plugin provenance, permissions, rollback, isolation, and
   observability.
5. Integrate one bounded ROCKSOUL vertical slice through Foundation and GitLab,
   including durable state, approval, execution evidence, CI checks, deployment,
   and rollback verification.
6. Migrate remaining capabilities incrementally. Do not remove a standalone service
   until parity, state migration, rollback, and operational evidence pass.
7. Promote staging, private alpha, public beta, and production only through explicit
   evidence gates.

## Non-goals

- Forking or modifying GitLab internals as part of ROCKSOUL/Foundation integration.
- Accessing GitLab's internal database, filesystem, queues, caches, or undocumented
  private APIs.
- Reimplementing Git hosting, issues, merge requests, CI/CD, runners, registry,
  releases, or generic deployment management inside Foundation or ROCKSOUL.
- Creating a second source-control, CI/CD, registry, identity, or deployment control
  plane for the same production responsibilities.
- Treating GitLab as the MoonWitness domain database or storing Foundation domain
  state directly in GitLab internal storage.
- Replacing `moonwitness-api` with a second public Foundation or ROCKSOUL domain API.
- Making ROCKSOUL a second platform kernel or allowing a product module to redefine
  Foundation or Blueprint policy.
- A big-bang repository merge or immediate removal of existing ROCKSOUL services.
- Allowing untrusted agent code to execute in the Foundation process or permitting
  autonomous actions to bypass budgets, approvals, isolation, audit, or rollback.
- Exposing privileged GitLab, model-provider, runner, or deployment credentials to
  client-side applications.

## Consequences

Positive:

- one self-hosted backbone owns collaboration, automation, artifacts and delivery;
- Foundation remains focused on MoonWitness domain and application concerns;
- ROCKSOUL remains a coherent product while capabilities can evolve independently;
- GitLab upgrades are decoupled from Foundation and ROCKSOUL implementation details;
- production changes retain review, pipeline, artifact and runtime provenance.

Costs and risks:

- GitLab availability becomes a critical delivery-plane dependency;
- API-version, webhook, OIDC, runner and registry compatibility require testing;
- Foundation needs durable adapters, idempotency and outage handling;
- transitional sidecars temporarily increase operational complexity;
- the prior GitHub-centric package and deployment decisions require a separate,
  explicit migration/reconciliation before GitLab becomes the production authority.

## Failure handling and rollback

- GitLab API or webhook outages must degrade safely, preserve idempotency, and use
  bounded retry/dead-letter handling; they must not produce duplicate domain effects.
- A failed ROCKSOUL rollout reverts to the last verified artifact and compatible
  Foundation schema using the protected GitLab deployment pipeline.
- Plugin disable/rollback must remain available independently of a full Foundation
  rollback when contracts and data compatibility permit it.
- If the self-hosted GitLab production migration is not yet viable, retain the last
  certified delivery path while correcting the gap through a follow-up ADR. Do not
  introduce direct database integration or an ungoverned parallel control plane as
  a temporary workaround.

## Affected repositories

- `moonwitness-blueprint`
- `moonwitness-api`
- `moonwitness-platform-foundation`
- `moonwitness-wheremythfadetolegend`
- `moonwitness-commandcenter`
- `rocksoul-code`
- `rocksoul-code-web`
- `rocksoul-orchestrator`
- `rocksoul-runner`
- `rocksoul-browser-worker`
- `rocksoul-gateway`
- `rocksoul-cli`

Additional MoonWitness repositories are affected only when their source, package,
pipeline, deployment, or Foundation integration is migrated to the self-hosted
GitLab backbone.

## Compatibility risk

High. This decision changes the production platform and deployment authority while
preserving the MoonWitness domain/API boundary. Approval requires an inventory of
conflicting GitHub-centric decisions, a staged migration plan, contract tests for
all supported GitLab interfaces, verified rollback, and corresponding design-freeze
updates. Until those follow-ups are approved and evidenced, this ADR expresses the
target architecture and does not itself certify production readiness.
