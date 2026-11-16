# MoonWitness Decision Registry

This is the compact decision index. Detailed rationale belongs in the corresponding blueprint/ADR.

| ID | Decision | Status | Scope |
|---|---|---|---|
| ADR-001 | Independent repositories | LOCKED | Ecosystem |
| ADR-002 | Package-first, service-optional | LOCKED | Architecture |
| ADR-003 | One canonical network door: HTTPS + OpenAPI | LOCKED | API |
| ADR-004 | SSE is a mode of the HTTP API | LOCKED | Realtime |
| ADR-005 | gRPC conditional, not baseline | LOCKED | Internal RPC |
| ADR-006 | tRPC not an ecosystem standard | LOCKED | TypeScript apps |
| ADR-007 | GraphQL not an ecosystem standard | LOCKED | Query layer |
| ADR-008 | MCP is an optional agent adapter | LOCKED | AI |
| ADR-009 | Node 24 LTS + pnpm + TypeScript + ESM | SUPERSEDED | Toolchain |
| ADR-010 | Fastify 5 | LOCKED | Backend |
| ADR-011 | Next.js 16 + React 19.2 line | LOCKED | Frontend baseline |
| ADR-012 | Portable frontend platform | LOCKED | UI |
| ADR-013 | Corpus owns canonical knowledge | LOCKED | Data |
| ADR-014 | One canonical witness/provenance contract owner: moonwitness-core | LOCKED | Trust |
| ADR-015 | Database schemas are private | LOCKED | Data |
| ADR-016 | OpenTelemetry + centralized observability | LOCKED | Operations |
| ADR-017 | Vercel + Neon/Supabase for dev/preview | LOCKED | Legacy/preview deployment |
| ADR-018 | Docker + Compose + VPS for production | SUPERSEDED BY ADR-025 | Deployment |
| ADR-019 | Legacy migration by capability | LOCKED | Migration |
| ADR-020 | Repository is not a dependency boundary | LOCKED | Packaging |
| ADR-021 | Latest-supported production runtime; Node 24.x for current Vercel Functions baseline | LOCKED | Toolchain / Deployment |
| ADR-022 | Cross-cutting platform contracts | LOCKED | Contracts / Data / Security / UX / Operations / Migration |
| ADR-023 | Canonical contract wire naming and envelope: camelCase; retryable is required | LOCKED | Contracts / Core |
| ADR-024 | Private @arsybelovedlabs packages use GitHub Packages npm registry | LOCKED | Packaging / CI |
| ADR-025 | Primary public Web ownership moves from moonwitness-web to moonwitness-wheremythfadetolegend; backend production targets Coolify | LOCKED | Web / Deployment |
| ADR-026 | Reconcile canonical API inventory; adopt readiness and idempotent ResearchRun cancellation | LOCKED | API / Contracts |

## Design freeze

The architecture is design-frozen by `00-constitution/DESIGN-FREEZE-DECLARATION-V1.md`. Post-freeze architectural changes require a new ADR and update of the freeze record. Implementation/evidence work does not require an architecture change when it conforms to these locked decisions.

## Change rule

A LOCKED decision may change only through a new ADR that identifies the old decision, motivation, impact, migration plan, rollback, and affected repositories.
