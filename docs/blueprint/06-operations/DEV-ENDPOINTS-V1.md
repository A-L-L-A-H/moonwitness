# MoonWitness Development Endpoints V1

Status: CANONICAL DEVELOPMENT DEPLOYMENT RECORD  
Date: 2026-09-01

## Development API

- Public development API: `https://dev-api.moonwitness.biz.id`
- Service: `moonwitness-platform-foundation`
- Branch: `dev`
- Runtime port: `8080`
- Host port exposure: **none**

The foundation runtime listens on port `8080` inside the container/network only. PostgreSQL likewise remains internal to the Compose network and must not bind host port `5432`.

## Deployment Boundary

Coolify is responsible for the external reverse-proxy/domain binding. The application Compose stack must not publish the foundation API or PostgreSQL directly to the host.

Required topology:

```text
dev-api.moonwitness.biz.id
        |
        v
   Coolify proxy
        |
        v
 foundation:8080   (internal only)
        |
        v
 postgres:5432     (internal only)
```

## Health Endpoints

- `/healthz` — liveness
- `/readyz` — readiness including PostgreSQL dependency
- `/v1/health` — API health alias
- `/v1/readiness` — API readiness alias
- `/v1/metadata` — runtime metadata/capabilities
- `/metrics` — Prometheus-compatible metrics endpoint

## Port Policy

- `5432`: never publish on the host.
- `8080`: never publish on the host from the foundation Compose stack.
- Monitoring ports are optional/profile-gated and must not be enabled on the production/public API boundary without an explicit operations decision.

This record is part of the deployment contract and should be updated whenever the canonical development endpoint or network boundary changes.
