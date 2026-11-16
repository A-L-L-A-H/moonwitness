# Serverless and Latest Runtime Architecture v1

Status: LOCKED
Date: 2026-08-30

## Purpose

Define the canonical deployment model for MoonWitness so the platform is serverless-compatible without creating a second architecture.

## Canonical deployment model

MoonWitness uses one application architecture with deployment adapters:

```text
Application / Capability
        |
        +--> Vercel Functions (development/preview/serverless)
        |
        +--> Docker container (production VPS)
        |
        +--> local Node runtime (development)
```

Business logic, contracts, persistence ports, and observability semantics must not depend on Vercel.

## Serverless requirement

All HTTP capabilities targeted at Vercel MUST be deployable as serverless functions.

The canonical network contract remains HTTPS + OpenAPI. Vercel is only a deployment target.

Fastify is allowed in the serverless adapter. The serverless entrypoint must be thin and must delegate to the application layer. Fastify's own documentation explicitly supports running Fastify on Vercel/serverless platforms and recommends focused functions to control startup cost.

## Serverless-safe rules

- No process-global mutable application state that is required for correctness.
- No in-memory queue as the source of truth.
- No reliance on a long-lived WebSocket process for core functionality.
- No local filesystem persistence.
- No assumption that a function instance survives between requests.
- Connection pooling must use the hosting/platform-safe database pattern.
- Background work must be durable and resumable; use an external queue/job system or a bounded async mechanism appropriate to the deployment.
- Long jobs must not be forced through an interactive request/response path.
- Cancellation and idempotency are mandatory for durable jobs.

## Runtime policy

### Principle

Use the newest runtime that is verified across all mandatory deployment targets. Never equate "latest release" with "universally supported production runtime".

### Current 2026 policy

- Node.js 26.8.1 is the latest Node.js Current release as of 2026-08-30.
- Node.js 24.20.0 is the latest Node.js LTS release as of 2026-08-30.
- Vercel's published Functions runtime documentation currently lists Node 24.x as the default/available version range for Functions.
- Therefore Gen2's **portable production baseline is Node 24.x** until Vercel officially exposes Node 26.x for Functions in the project/runtime documentation.
- Node 26 may be used for local/experimental benchmarking only when the package set and CI are explicitly tested against it.

This is a compatibility policy, not a ban on newer Node versions. The baseline must be revisited whenever Vercel and Node release support changes.

## Framework baseline

- Next.js: 16.3.x Active LTS line; pin the exact patch used by the repository and upgrade through CI.
- React: 19.2 line.
- Fastify: 5.x line.
- TypeScript: latest stable release compatible with the pinned toolchain.
- pnpm: latest stable release compatible with the locked Node and CI images.

Exact versions are maintained in a machine-readable toolchain manifest rather than embedded throughout prose.

## Vercel architecture

```text
Browser
  |
  v
Vercel CDN / Edge routing
  |
  +--> Next.js application
  |
  +--> Node.js Function adapter
              |
              v
        moonwitness-api
              |
              v
      application capabilities
```

The public API remains HTTP/OpenAPI. Next.js route handlers or Vercel Functions are deployment adapters, not alternate domain contracts.

## Function classes

### Interactive

Web/API request, search, lightweight mutation.

Target: low latency.

### Streaming

Use SSE over the same HTTP API for research/job progress or model output that benefits from streaming.

### Long-running

Do not depend on a request staying open. Prefer durable job execution. Vercel currently supports longer-running Node/Python Functions with Fluid Compute on eligible plans, but this does not remove the need for durable job semantics.

### Heavy corpus/AI work

Use workers/async execution. Production VPS Docker is the canonical unrestricted execution target.

## Vercel-specific rules

- Use the current Vercel-supported Node major rather than an unverified Current Node major.
- Pin Vercel CLI/tooling through package management.
- Keep `vercel.json` minimal and declarative.
- Do not place provider-specific code inside domain packages.
- Use Vercel environment variables only through the environment boundary; never bake secrets into packages or artifacts.
- Preview environments must use isolated/non-production credentials and data boundaries.

## Production parity

Production Docker must execute the same application packages used by Vercel. Only the adapter/entrypoint and infrastructure configuration may differ.

```text
same packages
same contracts
same domain logic
same tests
       |
       +--> Vercel adapter
       +--> Docker adapter
```

## Acceptance criteria

A Gen2 service is serverless-ready when:

1. HTTP/OpenAPI contract is unchanged across local, Vercel, and Docker.
2. Application logic is executable without a long-lived process.
3. Persistence is externalized.
4. Async work is durable/idempotent.
5. Observability survives ephemeral instances.
6. Cold-start and bundle size are measured.
7. Vercel deployment succeeds with the pinned supported Node version.
8. The same package set can run in Docker.

## Non-goals

- Making every worker serverless.
- Using edge runtime by default.
- Creating a second API for Vercel.
- Locking domain logic to Vercel.

## References

- Node.js release status: https://nodejs.org/en/blog/release
- Vercel Node.js runtime: https://vercel.com/docs/functions/runtimes/node-js
- Vercel supported Node versions: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Fastify serverless guide: https://fastify.dev/docs/v5.6.x/Guides/Serverless/
