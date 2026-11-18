# packages/addons

Modular addon packages hosted by `@moonwitness/api` and backed by `@moonwitness/orm`.

## Workspace Status

| Subdirectory | Package                       | Status            | Notes                                                                                                                                                               |
| ------------ | ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__base/`    | `@moonwitness/addon-base`     | Active (`0.1.0`)  | Foundation addon (`manifest.json`): provides `_meta` & `health` routes and `users`/`settings` system tables (`exports`: `.`, `./addon`, `./registry`, `./metadata`) |
| `timeline/`  | `@moonwitness/addon-timeline` | Active            | Canonical timeline addon; see [timeline/README.md](./timeline/README.md)                                                                                            |
| `ai/`        | —                             | Staging directory | Contains generated build/dependency folders (`dist/`, `node_modules/`) only; no `package.json` or `src/` yet                                                        |
| `auth/`      | —                             | Staging directory | Contains `node_modules/` only; no `package.json` or `src/` yet                                                                                                      |
| `i18n/`      | —                             | Staging directory | Contains `node_modules/` only; no `package.json` or `src/` yet                                                                                                      |

## Scripts (`@moonwitness/addon-base`)

```sh
pnpm --filter @moonwitness/addon-base typecheck
pnpm --filter @moonwitness/addon-base test
```

## Ownership

- **Owner:** Backend & Addon Architecture (`packages/addons`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
