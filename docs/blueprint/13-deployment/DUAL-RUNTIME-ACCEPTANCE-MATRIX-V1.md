# Dual-Runtime Acceptance Matrix v1

Purpose: prove that portable Gen2 applications and services behave consistently on Vercel/serverless and Node/Docker execution targets.

| Capability | Vercel / Serverless | Node / Docker | Required parity |
|---|---|---|---|
| startup | function initializes safely | process initializes safely | same configuration contract |
| health | `/v1/health` responds | `/v1/health` responds | same semantic status |
| request/response | OpenAPI behavior | OpenAPI behavior | same contract |
| validation | same schema | same schema | same error semantics |
| auth/policy | same authorization decision | same authorization decision | same policy |
| persistence | external durable store | external durable store | same domain behavior |
| retries | idempotent where applicable | idempotent where applicable | no duplicate side effects |
| streaming | SSE over HTTP where applicable | SSE over HTTP where applicable | same event contract |
| long-running work | handoff to durable runtime/worker | handoff to durable runtime/worker | never depend on process lifetime |
| telemetry | OTel context emitted | OTel context emitted | correlation continuity |
| graceful shutdown | platform managed | explicit signal handling | no correctness loss |

## Mandatory smoke tests

1. deploy/build the same application revision to the serverless target;
2. build and start the same revision as a container;
3. call the same health and representative API endpoints;
4. compare status codes and canonical response shapes;
5. execute one idempotent mutation twice and verify one durable effect;
6. start one async job and verify the API remains independent of worker lifetime;
7. verify correlation/trace metadata reaches logs;
8. record runtime versions and deployment identifiers.

## Failure policy

A runtime-specific failure does not justify changing domain behavior to suit the hosting provider. First isolate the problem to the adapter, build target, or unsupported runtime feature.

## Promotion policy

The newest upstream runtime may be tested in CI before production promotion. Production uses the newest version explicitly supported by the target platform and proven by the compatibility suite. As of 2026-08-30, Node.js 26.8.1 is Current and Node.js 24.20.0 is LTS; Vercel-facing runtime selection must remain platform-supported at deployment time.
