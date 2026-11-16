# Odoo-inspired Add-on Architecture

MoonWitness borrows the modular composition discipline of Odoo; it does not clone Odoo internals.

## Lifecycle

1. Discover — inspect a trusted manifest from an allowlisted package.
2. Validate — schema, API compatibility, package identity, permissions, dependencies.
3. Install — record package/version and run approved namespaced migrations.
4. Configure — validate configuration against the add-on schema.
5. Enable — resolve dependencies, acquire resources, register routes/jobs/events, then persist enabled state.
6. Disable — stop new work, drain jobs, release sockets/leases, unregister handlers, persist disabled state.
7. Upgrade — verify compatibility, back up affected data, migrate, and define rollback.
8. Uninstall — check dependents and require a data retention/deletion decision.

Install is not enable. Enabling an integration is not the same as connecting a user's account.

## Manifest fields

Required:
- id: stable reverse-DNS-like identifier.
- name and description.
- version: SemVer.
- apiVersion: compatible Add-on SDK API.
- dependencies: add-on IDs and version ranges.
- permissions: requested least-privilege capabilities.
- enabledByDefault: false unless explicitly reviewed.
- configSchema: runtime config schema.
- entry: server-side entry point inside an allowlisted package.

Optional:
- migrations, jobs, events, routes, settings UI, health checks, capabilities.

## Trust model

- Only repository-shipped or explicitly allowlisted packages may execute.
- Admin UI cannot upload arbitrary JS for execution.
- Dependency resolution is deterministic and detects missing nodes/cycles.
- Permission expansion requires review and re-authorization.
- Lifecycle operations are audited.
- Failed activation rolls back registrations and releases resources.
- Add-ons receive narrow capability objects, not root Fastify, ORM, Redis, or process environment.

The first host is in-process; that is not a security sandbox against malicious trusted code. Untrusted third-party execution would require a separate process/container isolation decision.

## Example IDs

- moonwitness.publishing
- moonwitness.research
- moonwitness.media
- moonwitness.whatsapp.baileys
