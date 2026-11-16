# ROCKSOUL LAZARUS Program Plan — Draft v1

Status: **PLANNING DRAFT / NON-CANONICAL / NOT EXECUTION AUTHORITY**

Date: 2026-09-01

Companion backlog: `ROCKSOUL-LAZARUS-ISSUE-BACKLOG-DRAFT-V1.yaml`

Research basis: `ROCKSOUL-LAZARUS-PROPHETIC-ETHICS-RESEARCH-V1.md`

## 1. Intended outcome

ROCKSOUL LAZARUS is proposed as a bounded autonomous engineering and research
platform. It should turn an authenticated human objective into a traceable plan,
isolated execution, independent verification, reviewable evidence, and a
recoverable delivery. OpenCode remains a replaceable coding engine; deterministic
policy, authority, state, verification, and recovery remain outside the model.

The near-term outcome is not AGI or ASI. The measurable target is a trustworthy
local engineering assistant that can complete explicitly scoped tasks while:

- preserving the user's original checkout and unrelated changes;
- using least privilege and explicit approval for consequential actions;
- failing closed when verification evidence is absent;
- retaining disagreement, provenance, resource use, and outcomes;
- producing a reviewable branch or draft pull request rather than silently
  changing production;
- remaining usable with local models, online models, or a controlled hybrid;
- clearly separating scripture, attributed human interpretation, and software
  inference.

## 2. Authority and decision boundary

`ArsyBelovedLabs/moonwitness-blueprint` remains the frozen architecture authority
for MoonWitness. The production backbone is the live self-hosted GitLab
installation: it is the system of record for source code, repositories, issues,
merge requests, CI/CD, runners, registries, and delivery automation.
`ArsyBelovedLabs/moonwitness-platform-foundation` is the application/domain kernel
deployed through that GitLab backbone. ROCKSOUL is the product suite integrated
into the Foundation.

This direction is not yet a change to the frozen repository map. It requires an
ADR to ratify the production ownership and to prevent a second active engine from
appearing. No new `rocksoul-blueprint` repository is needed at this stage. This
plan remains an incubation artifact until the ADR is approved.

The production integration rule is:

1. GitLab Self-Hosted owns the generic platform backbone: source, issues, merge
   requests, CI/CD, runners, registries, identity integration and delivery;
2. `moonwitness-platform-foundation` owns the application kernel, plugin lifecycle,
   permissions, domain persistence, auth/session, audit and AI/MCP policy;
3. GitLab is accessed only via its public REST, OIDC, webhook, Package Registry,
   runner and CI/CD interfaces; its internal database is never accessed;
4. unique MoonWitness/ROCKSOUL capabilities are integrated as foundation plugins,
   typed adapters, or isolated workers;
5. OpenCode is the replaceable coding/execution adapter, not the system of record;
6. the existing ROCKSOUL services remain transitional sidecars until their
   capability is migrated and verified through foundation contracts;
7. repository trees are never copied wholesale, and private databases are never
   shared across repository boundaries.

The Foundation repository supplies the application runtime and plugin boundary;
GitLab supplies the live platform backbone and automation plane. The current
Foundation work remains incomplete and must pass its issue gates before pilot
deployment.

## 3. Evidence snapshot

The following snapshot was inspected locally and through GitHub on 2026-09-01.
It records observed state, not certification.

| Repository or local path | Observed role | Current evidence | Required classification |
|---|---|---|---|
| `moonwitness-blueprint` | MoonWitness architecture authority | Draft research PR #35 is open and CI passes | Canonical for MoonWitness; incubation only for ROCKSOUL |
| `moonwitness-prophetic` | Bounded research-domain capability | Draft PEP evaluator PR #6 is open and CI passes | MoonWitness domain; no autonomous authority |
| `rocksoul-code` | OpenCode-derived coding engine | Local folder is still named `opencode`; `upstream` tracks `anomalyco/opencode` | ROCKSOUL engine fork |
| `rocksoul-code-web` | Next.js control center and BFF | Engine UI, task graph, service health and source-mode launcher exist | ROCKSOUL application |
| `rocksoul-orchestrator` | Goal/task state, planning and OpenCode dispatch | Durable single-process JSON state, approvals, gates, memory, RAG, analytics and scoring exist | ROCKSOUL control plane |
| `rocksoul-runner` | Confined command-plan service | Argv execution, path confinement, deny policy, approval and budgets exist | ROCKSOUL execution boundary |
| `rocksoul-browser-worker` | Browser execution worker | Playwright driver, domain policy, approval, cancellation and evidence exist | ROCKSOUL execution boundary |
| `rocksoul-gateway` | Signed ingress, schedules and channel adapters | Web/generic ingestion and bot controller exist; vendor adapters remain partial | ROCKSOUL edge boundary |
| `rocksoul-cli` | Developer/operator CLI | Local commits exist, but GitHub cannot currently resolve the configured repository | Orphan requiring ownership decision |
| `moonwitness-design-system` | UI showcase mirror | Existing issue #15 says it must not become canonical owner | MoonWitness satellite |
| `moonwitness-pencil` | Design-editor adaptation | OpenPencil-derived source | MoonWitness tooling satellite |
| `moonwitness-lab` | GitLab-derived infrastructure source | Default branch is `master`; not present in the frozen repository map | Infrastructure mirror requiring classification |
| `moonwitness-platform-foundation` | Application/domain kernel | Foundation v0.3 kernel/plugin/runtime, GitLab adapters, auth, DB and production roadmap; 24 open issues | Deployable application layer pending ADR and R1–R4 evidence |
| `moonwitness-lab.partial` | Partial local clone | Origin is `gitlab-community/gitlab`, not `ArsyBelovedLabs` | Quarantine/reference; never an active org repo |
| `ArsyBelovedLabs/test` | Unclassified remote repository | Exists in GitHub, not in the inspected local organization workspace | Archive/delete/retain decision required |
| `X:\REPO\cosmic`, `moonwitness`, `moonwitness-corpus`, `propetic` | Legacy evidence | Origins point to `bjo163/*` | Read-only reference under the existing migration policy |
| GitLab Self-Hosted | Production platform backbone | Live source, issue, MR, CI/CD, runner, registry and delivery system | Never access GitLab's internal database; use public contracts |

At the snapshot time, the six resolvable ROCKSOUL service repositories had no
GitHub issues or pull requests. Their `main` branches were not reported as
protected by the GitHub branch-protection API. Existing implementation arrived as
direct commits, so passing repository-local tests is not equivalent to reviewed
cross-service certification.

## 4. Confirmed blockers and risks

These findings must be resolved before claiming trustworthy autonomy.

| ID | Severity | Finding | Required outcome |
|---|---|---|---|
| `F-01` | P0 | ROCKSOUL has no approved canonical repository/contract map | Approve product ownership and architecture authority |
| `F-02` | P0 | `rocksoul-code-web/docs/CONTRACTS.md` does not match live service paths and payloads | Generate or validate docs from versioned contracts |
| `F-03` | P0 | Unknown orchestrator verification gates return a simulated passing result | Unknown or unavailable gates fail closed |
| `F-04` | P0 | Orchestrator verification commands run through a shell and bypass `rocksoul-runner` | All executable commands pass through the policy boundary |
| `F-05` | P0 | Rollback uses `git reset --hard` followed by `git clean -fd` | Replace with recoverable worktree/commit strategy and explicit approval |
| `F-06` | P0 | Delivery uses `git add -A`, which can include unrelated user changes | Stage only task-attributed files in an isolated checkout |
| `F-07` | P0 | Browser worker emits `approval_required`; L5 polling checks `waiting_approval` | Share one versioned state contract and test it end to end |
| `F-08` | P0 | Several gates named by the planner (`spec_validation`, `browser_execution`, `screenshot_evidence`, `command_verification`) have no real verifier | Implement each verifier or block the task |
| `F-09` | P0 | `security_audit` currently executes only `git diff --name-only` | Add secret, dependency, policy and changed-file checks with evidence |
| `F-10` | P0 | Project inspection writes `.rocksoul/project.json` even when the caller expects inspection | Make mutation explicit and deny it in read-only mode |
| `F-11` | P0 | Runner and browser services have no complete service-identity boundary; orchestrator auth is optional | Authenticate every mutation and propagate actor/approval identity |
| `F-12` | P1 | Orchestrator executes ready tasks sequentially; “multi-agent” is not yet durable parallel orchestration | Add leased DAG scheduling and deterministic joins before claiming parallel agents |
| `F-13` | P1 | JSON persistence supports one process and no distributed claim/lease | Keep single-user mode explicit; add transactional storage only for multi-user scale |
| `F-14` | P1 | Cognitive scoring is an isolated endpoint rather than an enforced lifecycle gate | Calibrate it and bind it to plan, act, verify, deliver and rollback transitions |
| `F-15` | P1 | Maturity labels such as L5 can be read as a capability claim without benchmark evidence | Use evidence-based maturity levels and publish benchmark results |
| `F-16` | P1 | PEP and Qur'anic mappings are engineering research drafts without qualified scholarly review | Keep them advisory and non-authoritative until human review |
| `F-17` | P0 | Foundation has no committed lockfile and CI installs TypeScript dynamically | Pin reproducible foundation dependencies before production |
| `F-18` | P0 | Foundation trusted plugins run in-process while isolated/remote execution is deferred | Do not install untrusted AI, browser, or shell capabilities in-process |
| `F-19` | P0 | Foundation production HTTP, PostgreSQL, OIDC/session, webhook, installer, isolation and observability work is still deferred or tracked as open issues | Complete and certify the foundation roadmap before pilot |
| `F-20` | P0 | Ownership between foundation plugins and transitional ROCKSOUL services is not yet mapped | Publish one capability migration matrix and contract owner per capability |

## 5. Target trust architecture

```text
GitLab identity / platform APIs
        |
        v
GitLab Self-Hosted: source + CI/CD + runners + registry + delivery
        |
        v
Foundation: application kernel + plugins + runtime + policy
        ^
        |
authenticated human intent
        |
        v
gateway / web / CLI
        |
        v
MITHAQ task contract + authority + expiry
        |
        v
orchestrator state machine ----> epistemic and audit ledger
        |
        +----> planner/council (model output remains advisory)
        |
        v
deterministic policy + cognitive hard gates
        |
        v
isolated per-goal git worktree / sandbox
        |
        +----> OpenCode adapter: code and reasoning
        +----> runner adapter/isolated worker: argv commands and verification
        +----> browser adapter/isolated worker: typed actions and evidence
        |
        v
independent verification + dissent + provenance
        |
        v
human approval when required
        |
        v
task-scoped commit + draft PR + rollback artifact
```

### 5.1 Non-negotiable invariants

- A model cannot grant itself permission, mark its own unsupported claim as
  evidence, or waive a required gate.
- The original checkout is not used as an autonomous scratch space.
- A dirty user checkout is never cleaned, reset, switched, or staged by an agent.
- Unknown commands, tools, states, schema versions, and verification gates fail
  closed.
- Completion requires externally inspectable evidence, not a model statement.
- Consequential actions have an accountable human, an expiry, and a recourse path.
- Every cross-service request has correlation, actor, idempotency and contract
  version metadata.
- Religious principles may inform controls; model output is never revelation,
  worship, prophecy, a fatwa, or a representation of a messenger.

### 5.2 Model topology

The platform remains model-agnostic:

- deterministic code performs identity, policy, state transition, budgets and
  verification;
- local models are preferred for private retrieval, classification, embeddings,
  routine drafting and continuous low-cost work;
- online models are optional escalation for difficult planning or review after
  sanitization and disclosure-budget checks;
- provider fallback is measured by success, safety, privacy, latency and cost;
- no local or online model receives spiritual, legal, deployment or merge
  authority merely because it is high-scoring.

### 5.3 Production ownership map

| Capability | Production home | Transitional source or adapter | Boundary |
|---|---|---|---|
| Source, projects, issues, MRs, CI/CD, runners and registries | GitLab Self-Hosted | `packages/integrations` in foundation | Public GitLab REST/OIDC/webhook/Package Registry/CI/CD |
| Application kernel, plugin lifecycle, permissions, routes, commands, search and UI contributions | `moonwitness-platform-foundation` | None | Foundation plugin contract, delivered by GitLab CI/CD |
| Durable domain events, auth/session and application persistence | `moonwitness-platform-foundation` | Rocksoul JSON stores only for local alpha | Foundation storage and migration contracts |
| OpenCode coding sessions and provider tools | Foundation adapter/plugin boundary | `rocksoul-code` | Authenticated HTTP/SDK adapter; no direct UI-to-engine secret exposure |
| Goals, task graph, approvals and orchestration | Foundation runtime/plugin | `rocksoul-orchestrator` | Migrate behavior behind foundation contracts; keep sidecar during parity |
| Shell execution and verification | Foundation isolation/plugin boundary | `rocksoul-runner` | Policy-controlled argv; no direct orchestrator shell |
| Browser automation | Foundation isolated worker boundary | `rocksoul-browser-worker` | Typed steps, domain policy, approval and evidence |
| Webhooks, schedules and chat channels | Foundation integrations/plugins | `rocksoul-gateway` | Signed ingress, identity, idempotency and outbound policy |
| Public MoonWitness experience | `moonwitness-commandcenter` per foundation roadmap | `rocksoul-code-web` remains operator/control-center UI | Frontend contract; kernel has no design-system dependency |
| Research, corpus and prophetic capabilities | Foundation plugins/adapters | `moonwitness-corpus`, `moonwitness-cosmic`, `moonwitness-prophetic`, `moonwitness-crayon` | Versioned package/API contracts and private data ownership |

The migration unit is a capability, not a repository. A transitional service may
remain deployed when isolation or operational evidence justifies it, but it may not
become a second source of truth for the same capability.

## 6. Program gates and execution waves

Issue IDs and acceptance criteria are defined in the companion YAML backlog.

### Gate 0 — Foundation ownership and workspace reconciliation

Objective: establish one truthful map before creating more code.

Required outcomes:

- ratify GitLab Self-Hosted as the production platform backbone and
  `moonwitness-platform-foundation` as the application/domain kernel;
- publish the foundation-to-ROCKSOUL capability ownership matrix;
- classify every organization repository and local folder;
- resolve `rocksoul-cli`, `test`, `moonwitness-lab.partial`, and the local
  `opencode`/`rocksoul-code` naming mismatch;
- establish PR-only delivery, branch protection, CODEOWNERS and required CI;
- preserve the OpenCode upstream remote and publish a controlled sync policy.

Exit gate: the ADR, production ownership map, and repository inventory agree. Every
repo has an owner, status, purpose, default branch, lifecycle and
canonical/non-canonical classification. No folder is deleted by this gate without
separate explicit authorization.

### Gate 1 — Foundation production substrate and destructive-safety closure

Objective: harden the GitLab-backed Foundation application layer first, then make
transitional service boundaries truthful and fail-closed.

Required outcomes:

- versioned OpenAPI/JSON Schema or equivalent typed contracts;
- contract tests across web, orchestrator, runner, browser and gateway;
- runner-only command execution;
- no simulated passing verification;
- isolated worktrees and recoverable checkpoints;
- task-scoped Git staging and draft-PR delivery;
- authenticated service mutations and approval identity;
- fixed browser approval-state compatibility.
- pinned foundation toolchain/lockfile and production environment contract;
- PostgreSQL, GitLab OIDC/session, webhook replay, plugin provenance and isolation
  evidence according to the foundation roadmap.

Exit gate: the full test suite proves that a dirty checkout, missing verifier,
rejected approval, unknown state, malicious path and failed command cannot produce
a success or destructive cleanup.

### Gate 2 — Foundation plugin integration and trustworthy local alpha

Objective: integrate one bounded ROCKSOUL capability into the foundation and
complete one goal reliably before adding scale.

Required outcomes:

- create, plan, approve, execute, verify, cancel, resume and deliver one goal;
- durable idempotency and restart recovery;
- source-mode process launcher with health, logs and graceful stop;
- full evidence bundle containing intent, plan, model route, tool actions, command
  outputs, tests, changed files, approval and draft PR;
- end-to-end browser test covering success and denial paths.
- foundation plugin install/enable/disable/remove behavior preserves ownership and
  never silently deletes plugin data;
- the same capability cannot be active as both a foundation owner and an
  independent sidecar owner.

Exit gate: at least 30 representative tasks pass the initial benchmark with zero
false-success events and zero modification of unrelated checkout content.

### Gate 3 — Parallel orchestration and bounded learning beta

Objective: add real parallelism only after the serial path is trustworthy.

Required outcomes:

- dependency-aware leases, concurrency budgets and deterministic joins;
- independent reviewer roles whose dissent is retained;
- ephemeral task context plus governed operational memory;
- memory-poisoning tests and human promotion for reusable skills;
- calibrated local/cloud routing with privacy and cost accounting.

Exit gate: parallel execution improves benchmark latency or quality without a
material regression in false success, safety, cost or reproducibility.

### Gate 4 — Browser, channels and operator experience

Objective: expose autonomy through usable, inspectable control surfaces.

Required outcomes:

- approval inbox, live task graph, evidence viewer, diff review and recovery UI;
- real Telegram/Slack adapters only after native signature and identity checks;
- outbound messages treated as consequential actions when appropriate;
- browser evidence access control, retention and redaction;
- no credentials or private raw context exposed to the browser or channel.

Exit gate: E2E suites cover UI, API, state, data, approval, tool execution,
evidence, cancellation, restart and recovery.

### Gate 5 — Source-linked ethics research

Objective: evaluate whether the proposed PEP controls improve conduct without
impersonation or religious overclaiming.

Required outcomes:

- qualified human review of source mappings and translations;
- adversarial evaluation of attribution, non-impersonation and hidden-wisdom
  firewall behavior;
- PEP results remain advisory unless a reviewed deterministic policy separately
  owns the enforcement;
- explicit UI source lanes for passage, translation, human interpretation and
  model synthesis.

Exit gate: research results include baseline, ablation, failures and reviewer
sign-off. This gate does not establish religious authority.

### Gate 6 — Foundation production pilot and operations

Objective: operate a bounded pilot with measurable reliability.

Required outcomes:

- cross-service traces, SLOs, incident records and cost/resource accounting;
- backup, restore, rollback rehearsal and evidence retention;
- pinned dependencies, SBOM, vulnerability checks and release provenance;
- deployment boundary approved for ROCKSOUL;
- foundation R1–R4 child issues are closed or explicitly waived with evidence;
- local development remains source-mode; production packaging follows the
  approved deployment decision rather than dictating local Docker use.

Exit gate: the pilot meets its SLO, security, recovery and benchmark thresholds
for an agreed observation period.

### Gate 7 — Quantum and custom-language laboratory

Objective: test narrow hypotheses without putting speculative technology on the
production critical path.

Entry is blocked until Gates 0–3 pass and a tuned classical baseline exists.

Permitted experiments:

- PennyLane simulator adapters for bounded optimization fixtures;
- classical-versus-hybrid measurements including encoding, queue and readout;
- a small declarative `MITHAQ` policy notation that compiles to ordinary typed
  policy data and can be fully inspected;
- content-addressed witness records and optional external anchoring.

Prohibited shortcuts:

- calling a classical heuristic “quantum”;
- treating Qur'anic language as empirical proof of a quantum algorithm,
  blockchain, programming language, consciousness, AGI or ASI;
- making production depend on quantum hardware or a custom language without a
  tested classical/standard-format fallback;
- interpreting a benchmark delta as spiritual or general-intelligence proof.

## 7. Parallel execution design

Parallel work starts only after Gate 0 decisions are recorded.

| Lane | Can run in parallel with | Join condition |
|---|---|---|
| Contracts | Repository governance | Contract version and compatibility fixtures approved |
| Runner safety | Browser safety | Shared authority, state and evidence envelopes frozen |
| Gateway identity | UI read-only views | Auth and actor propagation contract approved |
| Orchestrator persistence | Model routing benchmark | Goal/task/event schemas frozen |
| PEP research | Classical autonomy benchmark | No production enforcement before review |
| Quantum lab | None before Gate 3 | Classical baseline and research budget approved |

Contract changes are serialized first, then consumers fan out. Two agents must not
edit the same canonical contract or migration target concurrently.

## 8. Delivery milestones and effort envelope

The estimates below are planning ranges, not promises. They assume one accountable
human reviewer and two to four disjoint implementation lanes with working CI. The
GitLab-backed Foundation roadmap is the production critical path; the existing standalone
ROCKSOUL services are not production-certified merely because their local tests
pass.

| Milestone | Included gates | Estimated engineering effort | Earliest useful outcome |
|---|---|---:|---|
| Foundation adoption | Gate 0 | 2–4 working days | Approved base-host ADR and capability map |
| Foundation staging substrate | Gate 1 | 10–20 working days | Reproducible host, identity, persistence, plugin and safety evidence |
| Trustworthy local alpha | Gate 2 | additional 10–15 working days | One safe, restartable, reviewable goal flow on foundation |
| Parallel beta | Gate 3 | additional 10–15 working days | Measured multi-agent DAG and bounded memory |
| Operator/public pilot | Gates 4–6 | additional 15–30 working days | Authenticated pilot with E2E and operational evidence |
| Research tracks | Gates 5 and 7 | ongoing, gated | Publishable negative or positive experimental results |

The production critical path is:

`GitLab/Foundation ADR → Foundation R1 substrate → contracts and safety → capability
plugin parity → serial E2E → benchmark → parallelism → production pilot`.

Adding models, agents, quantum components, databases or channels before this path
passes increases surface area but does not increase trustworthy autonomy.

## 9. Maturity claims

Use these evidence-based labels:

| Level | Permitted claim | Minimum evidence |
|---|---|---|
| `R0 Research` | Concept or isolated prototype | Documented hypothesis and test |
| `R1 Assisted` | Human drives every consequential step | Tool evidence and human review |
| `R2 Bounded execution` | Agent executes pre-approved scoped tasks | Isolation, budgets, verification and rollback |
| `R3 Supervised autonomy` | Agent plans and executes with policy-based approvals | Durable recovery, benchmark and low false-success rate |
| `R4 Multi-agent pilot` | Parallel specialist tasks with deterministic joins | Lease/concurrency evidence, dissent and E2E |
| `R5 Production-certified` | Bounded production use for an explicit capability | SLO, security, recovery and observation-period evidence |

`R5` does not mean AGI, ASI, consciousness, infallibility, prophecy or unrestricted
autonomy.

## 10. Issue publication protocol

The companion backlog is intentionally marked `proposed`. After human review:

1. publish one program epic in the approved architecture repository;
2. publish Gate 0 and Gate 1 issues first;
3. create later-gate issues only when their entry gate is satisfied, or keep them
   explicitly blocked;
4. link every implementation issue back to its architectural decision and contract;
5. use branch + draft PR + required CI for every implementation change;
6. transfer rather than duplicate an issue when ownership moves;
7. close an issue only with the evidence paths listed in the backlog.

Recommended labels:

- priority: `P0`, `P1`, `P2`, `P3`;
- gate: `gate-0` through `gate-7`;
- type: `governance`, `contract`, `security`, `feature`, `research`, `evaluation`,
  `operations`;
- state: `blocked`, `ready`, `needs-adr`, `needs-human-review`;
- evidence: `needs-e2e`, `needs-benchmark`, `needs-threat-model`.

## 11. Program definition of done

The program reaches a production-pilot definition of done only when:

- repository and contract ownership are canonical and unambiguous;
- protected-branch and PR review controls are active;
- no unknown or simulated verification can pass;
- no autonomous path can reset, clean, stage or commit unrelated user work;
- command and browser actions are policy-controlled, authenticated and cancellable;
- goal state survives restart and duplicate requests do not duplicate effects;
- one full source-mode E2E suite covers allow, revise, deny, cancel, restart,
  recovery and draft delivery;
- model routing, memory, cognitive scores and any PEP advice have calibrated
  evaluation evidence;
- observability, backups, rollback and incident procedures are rehearsed;
- maturity claims match benchmark evidence;
- speculative research remains outside the production critical path.

Until those conditions pass, the accurate description is **research prototype**
or **bounded local alpha**, according to the attained gate.
