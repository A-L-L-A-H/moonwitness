# CRAYON Falsification Matrix

CRAYON is not considered valid because its philosophy sounds compelling. It must survive unrelated, adversarial situations using one semantic grammar.

## Universal loop under test

`Situation -> Possibility -> Intent -> Prediction -> Commitment -> Execution -> Observation -> Reconciliation -> Witness`

## Domain matrix

| Domain | Situation | Hard problem | Required invariant |
|---|---|---|---|
| Banking | transfer funds | debit observed, credit unknown | prediction must not become verified reality |
| Files | recursive delete | partial delete / restore window | reversibility and partial effects remain explicit |
| ERP | purchase approval | authority threshold changes | stale authority/preconditions block commit |
| Email | send message | send is irreversible | intent/commitment distinction and witness |
| DevOps | deploy production | some services deploy, some fail | partial outcome and reconciliation |
| AI | accept generated edits | agent proposes risky modifications | proposal must not imply human commitment |

## Test class A — Epistemic truth

CRAYON must survive:
- two trusted sources disagree;
- a source is stale;
- no source returns a value;
- a high-confidence AI inference conflicts with a verified observation;
- an expectation differs from observed reality.

Failure condition:
- engine silently emits one value as fact without preserving disagreement/uncertainty.

## Test class B — Prediction vs observation

Scenario:
1. simulation predicts A and B change;
2. execution begins;
3. A is observed changed;
4. B cannot be observed because an external service times out.

Required result:
- predicted B remains predicted;
- observed A becomes verified knowledge;
- B remains unknown;
- witness is partial/unverified as appropriate;
- retry policy can see duplicate-action risk.

Failure condition:
- `Transition.to` is reported as actual post-execution state.

## Test class C — Concurrency / staleness

Scenario:
1. user simulates action at version 10;
2. another actor changes state to version 11;
3. first user commits old prediction.

Required result:
- precondition fails;
- transition becomes stale;
- engine requires re-observation/re-simulation.

Failure condition:
- old prediction executes silently against changed reality.

## Test class D — Authority

Required capability separation:
- observe;
- propose;
- intend;
- commit;
- execute;
- verify;
- override.

Failure condition:
- possession of one capability silently implies another.

## Test class E — Consequence

Test actions with:
- low risk / reversible;
- high impact / reversible;
- low impact / irreversible;
- high impact / irreversible;
- uncertain external consequence.

Required result:
- commitment resistance changes proportionally and remains explainable.

Failure condition:
- representation depends on arbitrary styling rather than semantic consequence.

## Test class F — Domain independence

The kernel source must not branch on:
- banking;
- invoice/ERP;
- files;
- email;
- deployment;
- AI.

Failure condition:
- ontology requires domain-specific code inside `packages/kernel`.

## Test class G — Renderer invariance (later phase)

Given one semantic situation, Web, Voice, and Agent representations may differ in form but must preserve:
- current truth and uncertainty;
- available possibilities;
- constraints and authority;
- predicted consequences;
- commitment requirements;
- witness/verification state.

Failure condition:
- one renderer changes the meaning or hides a required semantic invariant.

## Current red flag

The current Kernel v0.1 draft has a deliberate known issue: `Witness.after` is populated from the simulated transition. This is tracked as the highest-priority correction before the kernel is frozen.
