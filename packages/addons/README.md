# packages/addons

Modular addon packages hosted by `@moonwitness/api` and backed by `@moonwitness/orm`.

## Workspace Status (16 Active Addons)

| Subdirectory        | Package                               | Category          | Notes                                                                                             |
| ------------------- | ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `__base/`           | `@moonwitness/addon-base`             | Foundation        | `AddonRuntimeController`, IR system models, `_meta/*`, tenant-scoped `/m/:model`, `ops.job` queue |
| `ai/`               | `@moonwitness/addon-ai`               | AI / Memory       | `riot_ai.*` provider/usage models and `memory.record` IR model                                    |
| `audit/`            | `@moonwitness/addon-audit`            | Security          | Platform mutation & access telemetry (`ops_audit_logs`)                                           |
| `auth/`             | `@moonwitness/addon-auth`             | Identity          | `auth.{user,session,oauth_token}` + `@moonwitness/mid` identity store adapter                     |
| `canon-lore/`       | `@moonwitness/addon-canon-lore`       | Domain / Story    | `canon.{codex,entity,episode}` and `sidra.edge` models & overview routes                          |
| `command-center/`   | `@moonwitness/addon-command-center`   | Operations        | `command.{workflow,alert}` synced models & cockpit views                                          |
| `control/`          | `@moonwitness/addon-control`          | Control Plane     | `control.command` ledger synchronized with `cp/arsy` V1 resource kinds                            |
| `epistemic/`        | `@moonwitness/addon-epistemic`        | Domain / Math     | `epistemic.computation` backed by `@moonwitness/canon` evaluators                                 |
| `i18n/`             | `@moonwitness/addon-i18n`             | Localization      | Bilingual string/locale catalog synced via `@moonwitness/orm`                                     |
| `probes/`           | `@moonwitness/addon-probes`           | Operations        | `probe.{target,event}` and `ops.event` synced models & views                                      |
| `radius/`           | `@moonwitness/addon-radius`           | Infrastructure    | `radius.{client,session}` IR models & audit mirror                                                |
| `snmp/`             | `@moonwitness/addon-snmp`             | Telemetry         | `snmp.{device,target,sample}` IR models                                                           |
| `storage/`          | `@moonwitness/addon-storage`          | Storage           | `storage.{bucket,object,upload_session}` S3/SigV4 metadata models                                 |
| `syslog/`           | `@moonwitness/addon-syslog`           | Telemetry         | `syslog.entry` ingestion log model                                                                |
| `timeline/`         | `@moonwitness/addon-timeline`         | Domain / Story    | Canonical `timeline.{event,era}` models; see [timeline/README.md](./timeline/README.md)           |
| `witness-research/` | `@moonwitness/addon-witness-research` | Domain / Research | `knowledge.source`, `witness.claim`, and `research.run` IR models                                 |

## Scripts (`@moonwitness/addon-base`)

```sh
pnpm --filter @moonwitness/addon-base lint
pnpm --filter @moonwitness/addon-base typecheck
pnpm --filter @moonwitness/addon-base test
```

## Ownership

- **Owner:** Backend & Addon Architecture (`packages/addons`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
