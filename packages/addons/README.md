# @moonwitness/addons

Unified domain addon pack hosted by `@moonwitness/api` and running on [Addon Runtime (@moonwitness/addon-runtime)](../addon-runtime/README.md). Each Odoo-style domain module keeps its own manifest, IR models, views, rules, and menus exposed under subpath exports (`@moonwitness/addons/<domain>`).

## Consolidated Modules (`15` Domains under `src/<domain>/`)

| Subpath              | Domain Directory        | Category          | Notes                                                                         |
| -------------------- | ----------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `./ai`               | `src/ai/`               | AI / Memory       | `riot_ai.*` provider/usage models and `memory.record` IR model                |
| `./audit`            | `src/audit/`            | Security          | Platform mutation & access telemetry (`ops_audit_logs`)                       |
| `./auth`             | `src/auth/`             | Identity          | `auth.{user,session,oauth_token}` + `@moonwitness/mid` identity store adapter |
| `./canon-lore`       | `src/canon-lore/`       | Domain / Story    | `canon.{codex,entity,episode}` and `sidra.edge` models & overview routes      |
| `./command-center`   | `src/command-center/`   | Operations        | `command.{workflow,alert}` synced models & cockpit views                      |
| `./control`          | `src/control/`          | Control Plane     | `control.command` ledger synchronized with `cp/arsy` V1 resource kinds        |
| `./epistemic`        | `src/epistemic/`        | Domain / Math     | `epistemic.computation` backed by `@moonwitness/canon` evaluators             |
| `./i18n`             | `src/i18n/`             | Localization      | Bilingual string/locale catalog synced via `@moonwitness/orm`                 |
| `./probes`           | `src/probes/`           | Operations        | `probe.{target,event}` and `ops.event` synced models & views                  |
| `./radius`           | `src/radius/`           | Infrastructure    | `radius.{client,session}` IR models & audit mirror                            |
| `./snmp`             | `src/snmp/`             | Telemetry         | `snmp.{device,target,sample}` IR models                                       |
| `./storage`          | `src/storage/`          | Storage           | `storage.{bucket,object,upload_session}` S3/SigV4 metadata models             |
| `./syslog`           | `src/syslog/`           | Telemetry         | `syslog.entry` ingestion log model                                            |
| `./timeline`         | `src/timeline/`         | Domain / Story    | Canonical `timeline.{event,era}` models; see [TIMELINE.md](./TIMELINE.md)     |
| `./witness-research` | `src/witness-research/` | Domain / Research | `knowledge.source`, `witness.claim`, and `research.run` IR models             |

## Scripts

```sh
pnpm --filter @moonwitness/addons lint
pnpm --filter @moonwitness/addons typecheck
pnpm --filter @moonwitness/addons test
```

## Ownership

- **Owner:** Backend & Addon Architecture (`packages/addons` & `packages/addon-runtime`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
