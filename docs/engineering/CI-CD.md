# CI/CD

## Workflows

| File                 | Trigger                                  | Purpose                                                |
| -------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `ci.yml`             | push → `dev`; PR → `dev`, `main`; manual | `docs:check`, format, lint, typecheck, test, build     |
| `branch-policy.yml`  | PR → `dev`, `main`                       | target branch, promotion source, Conventional Commits  |
| `codeql.yml`         | push/PR → `dev`, `main`; weekly          | static security analysis                               |
| `auto-promote.yml`   | CI success on `dev`                      | open/refresh `dev`→`main` PR with auto-merge           |
| `release-please.yml` | push → `main`; manual                    | version bump, CHANGELOG, release PR, tag               |
| `deploy.yml`         | release published; manual                | tag-driven production deploy, health check, smoke test |

`ci.yml` is the consolidated primary CI pipeline (`Verify` Node/Turbo suite plus Go `arsy` and Rust workspace checks). Nineteen specialized workflows under `.github/workflows/*.yml` handle policy, security, browser/visual suites, release automation, and deployment:

- **Core workflows:** `ci.yml`, `branch-policy.yml`, `codeql.yml`, `auto-promote.yml`, `release-please.yml`, `deploy.yml`, `preview-deploy.yml`, `sync-main-to-dev.yml`, `branch-cleanup.yml`
- **Quality, security & governance checks:** `security-scan.yml`, `release-sbom.yml`, `playwright.yml`, `visual-regression.yml`, `lighthouse.yml`, `bundle-budget.yml`, `pact.yml`, `pr-size-guard.yml`, `auto-label.yml`, `infracost.yml`, `slack-notify.yml`

Anything that duplicates format/lint/typecheck/unit test gates belongs inside `ci.yml` so gates do not drift. `deploy.yml` requires configured `production` GitHub Environment secrets/vars and fails explicitly if any are absent. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Permissions

Every workflow starts from `permissions:` scoped to what it needs:

- `ci.yml` — `contents: read`
- `branch-policy.yml` — `contents: read`
- `codeql.yml` — `contents: read`, `security-events: write`
- `release-please.yml` — `contents: write`, `pull-requests: write`, `issues: write`
- `deploy.yml` — `contents: read`; the deploy job is bound to the `production` environment

Actions are pinned to immutable commit SHAs with the resolved version in a trailing comment.
Dependabot updates them weekly; review the diff before merging, because a pinned action cannot be
retagged under you.

## Automation

- `allow_auto_merge` is enabled on the repository.
- Release Please enables auto-merge on the release PR it creates.
- `auto-promote.yml` opens a promotion PR with auto-merge enabled.

### Limitation (GitHub rule)

Pull requests created with the default `GITHUB_TOKEN` do not trigger workflow runs, so required
status checks would never appear and auto-merge would never fire. For a fully hands-off flow, store
a PAT with `repo` scope as `AUTOMATION_TOKEN` and switch the workflows to use it. Until then, a
human (or a local `gh` call with a PAT) must open the promotion PR; auto-merge still handles the
merge once checks pass.

Additionally, the organization must enable "Allow GitHub Actions to create and approve pull
requests" (Settings > Actions > General > Workflow permissions) for Release Please to open its
release PR on its own. Until that is enabled, Release Please creates the release branch and the
version bump but cannot open the PR; open it manually with `gh pr create --base main --head release-please--branches--main`.

## Concurrency

`ci.yml` and `codeql.yml` cancel superseded runs on the same ref. `release-please.yml` does not
cancel, because cancelling a release job mid-run can leave a half-updated manifest.

## PR Preview Policy (`preview-deploy.yml`)

- **Trigger scope:** Runs strictly on `pull_request` (`opened`, `synchronize`, `reopened`, `ready_for_review`) when `github.event.pull_request.draft == false`.
- **Single-preview isolation:** Uses per-PR concurrency group `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: true` so superseded commits cancel older preview deploys automatically.
- **Execution boundary:** Runs on GitHub-hosted `ubuntu-latest` without production VPS credentials (`VPS_*` secrets live solely in `environment: production`).

## Required checks on `main`

The `main` ruleset requires these status checks before merge:

- `Verify (lint, typecheck, test, build)`
- `Enforce branch and commit policy`
- `Analyze (javascript-typescript)`

`strict_required_status_checks_policy` is on, so a promotion PR must be up to date with `main`
before it can merge.

## What CI does not do

CI does not run the local gate wrapper. It runs the same underlying commands
(`pnpm docs:check`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) so that a green
local `gate:local` and a green CI run mean the same thing. The wrapper adds local-only checks
(secret scan, branch policy, commit messages) that CI either does not need or does differently.

## Failure handling

A red `ci.yml` on `dev` blocks the next promotion. Fix forward on `dev` with a `fix:` commit; do
not force-push `dev` (the ruleset rejects it anyway).
