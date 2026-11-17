# ADR-001: API Versioning Strategy

## Context

The Moonwitness API is currently served under a single `/api/v1` prefix. The API is consumed by:

- **apps/web** (Next.js, rewrites `/api/v1/*`)
- **apps/a-l-l-a-h** (Next.js, port 3003)
- **Third-party integrations** (unknown number of external clients)

There is no documented strategy for API evolution. New features are added without version consideration, and there is no process for handling breaking changes.

## Decision

Adopt a **frozen `/api/v1` strategy** with the following rules:

### 1. `/api/v1` is the canonical, immutable version

- All new development targets `/api/v1`
- `/api/v1` will not receive breaking changes
- Any change that modifies existing contract (field removal, rename, type change, endpoint removal) requires a **new version prefix**

### 2. Non-breaking changes (allowed under `/api/v1`)

- Add **optional** fields to response schemas
- Add **optional** query parameters
- Add **new** endpoints
- Change error codes to more specific values (without removing existing ones)
- Add new optional filters

### 3. Breaking changes (require new version)

- Remove or **rename** any existing field in response schemas
- Change type of existing field (e.g., string → number, object → array)
- **Remove** any existing endpoint
- Change authentication/authorization requirements for existing endpoints
- Modify required query parameters

### 4. New version format: `/api/v2`, `/api/v3`, etc.

- Version prefix follows `v{incrementing integer}`
- Major version increments for **any** breaking change
- Minor version increments for **non-breaking** additions (optional, can stay on v1)
- Example: `GET /api/v2/timeline/events`

### 5. Deprecation process

- When a breaking change is needed, create a new version (e.g., `/api/v2`)
- Mark the old version (`/api/v1`) as **deprecated** in API docs
- Support the old version for **90 days** minimum after new version launch
- Communicate deprecation in release notes and CHANGELOG
- After 90 days, remove old version support

### 6. Migration guide requirement

- Every breaking change PR must include:
  - New version prefix specification
  - Migration guide (field mappings, new endpoints, auth changes)
  - Deprecation timeline
  - Updated CONTRIBUTING.md section referencing this ADR

## Alternatives Considered

| Approach                                                   | Pros                                       | Cons                                                                                         | Why Rejected                                                                 |
| ---------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Always version** (`/api/v1`, `/api/v2`, etc.) from start | Clean separation; no breaking changes ever | High overhead; consumers must track versions from day 1; unnecessary for early-stage product | Too complex for a v0.4.0 project; adds cognitive load without immediate need |
| **No versioning, breaking changes OK**                     | Simplest; no prefixes needed               | Consumers break silently; no upgrade path; high risk of production incidents                 | Violates the project's security and reliability standards                    |
| **Feature flags instead of versioning**                    | No URL changes needed                      | Doesn't solve API contract evolution; still breaks consumers                                 | Doesn't address the core problem of schema evolution                         |

## Consequences

### Positive

- Predictable API evolution: consumers know when a change is safe vs. risky
- Clear migration path: 90-day deprecation window + migration guide
- Backward compatibility guaranteed for `/api/v1` consumers
- Documented process in CONTRIBUTING.md

### Negative

- New endpoints require version planning from the start
- Breaking changes require PR metadata (version prefix, migration guide)
- Slightly more overhead for adding truly new features

## Implementation Checklist

- [ ] Create `docs/architecture/adr-001-api-versioning.md` (this file)
- [ ] Add reference to ADR in `docs/architecture/engineering-foundation.md`
- [ ] Update `CONTRIBRIBUTING.md` to reference this versioning rule
- [ ] Ensure all new API changes follow the non-breaking / breaking criteria
- [ ] Add deprecation notice mechanism (TODO: implement `X-API-Deprecated` header or similar)

## Related

- `spec.md` — UR-ARCH-001: No API contract versioning strategy
- `task.md` — UR-ARCH-001 task: Document API versioning strategy
- `.github/workflows/ci.yml` — Verify API changes don't break existing contracts
