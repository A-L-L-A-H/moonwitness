# ORM Domain Backlog (implemented scaffolding)

This document tracks ORM models/migrations added to accommodate MoonWitness operational domains.

## P0

- **Audit log**: `ops_audit_logs` (`apps/api/src/infrastructure/audit/audit-log.ts`) + helper `recordAuditLog/tryRecordAuditLog`.
- **Identity/Auth**: `identity_user_profiles`, `identity_sessions`, `identity_oauth_tokens`, `identity_auth_events` (`apps/api/src/infrastructure/persistence/domain/identity.ts`).
- **Storage metadata**: `storage_buckets`, `storage_objects`, `storage_upload_sessions` (`.../domain/storage.ts`).
- **Events persistence**: `ops_events` + `OrmEventRepository` (`.../domain/ops-events.ts`, `.../repositories/orm-event.repository.ts`) replacing in-memory timeline/event storage path.

## P1

- **Probes (ORM mirror)**: `orm_probe_nodes`, `orm_probe_events` (`.../domain/probes.ts`) alongside legacy probe tables.
- **Command center/control**: `command_center_workflows_orm`, `command_center_alerts_orm`, `control_command_history` (`.../domain/command-control.ts`).
- **Memory**: `memory_records` (`.../domain/memory-syslog-snmp-radius.ts`).
- **Syslog**: `syslog_entries`.

## P2

- **SNMP**: `snmp_devices`, `snmp_targets`, `snmp_samples`.
- **RADIUS**: `radius_clients`, `radius_sessions`.

## P3

- **Seeder framework**: `apps/api/src/db/seeders/index.ts` (`runSeeders`).
- **Migration registry**: `apps/api/src/infrastructure/persistence/domain/index.ts` aggregates `domainMigrations`; API bootstrap/adapter apply it.
- **Add-ons/patterns**: models use `defineModel` base metadata (status/version/source, soft-delete where applicable), indexed for common lookups. Further tenant scoping/pooling/caching/query extensions can be layered per domain needs.

## Integration notes

- Legacy auth/session tables (`users`, `sessions`, `bff_oauth_tokens`) remain authoritative for current auth flows; ORM identity tables provide persisted domain models/audit scaffolding for migration.
- Some upstream-backed routes (storage/syslog/snmp/radius/control proxy, memory bridge) now have first-class ORM schemas for metadata/history capture; deeper per-request write-through integration can be added incrementally.
