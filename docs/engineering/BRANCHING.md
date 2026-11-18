# Branching model

MoonWitness enforces a strict **two persistent branches (`dev` and `main`)** policy. No long-lived
feature or topic branches may remain after a pull request closes. The rules below are enforced by
GitHub rulesets, `branch-policy.yml`, `branch-cleanup.yml`, and the local gate (`pnpm branch:guard`),
so drift is caught both locally and in CI.

## Topology

| Branch                                                                 | Purpose                                        | Lifetime                  | Force push | Delete   |
| ---------------------------------------------------------------------- | ---------------------------------------------- | ------------------------- | ---------- | -------- |
| `dev`                                                                  | Integration (repository default, PR-protected) | Persistent                | blocked    | blocked  |
| `main`                                                                 | Released, deployable code (promotion PR only)  | Persistent                | blocked    | blocked  |
| `feat/*`, `fix/*`, `chore/*`, `ci/*`, `docs/*`, `refactor/*`, `test/*` | Single-PR ephemeral work branch                | Deleted on PR merge/close | allowed    | required |

`dev` is the repository default branch. Direct pushes to `dev` and `main` are blocked by GitHub
rulesets; all changes enter `dev` via pull request and are immediately cleaned up on merge.

> **Legacy:** `master` was frozen and later removed. All its history is preserved in `dev`, in
> `main`, and in the tag `backup/20261112/master` (kept permanently as an archive).

## The rules that matter

1. **Only `dev` and `main` persist.** Delete ephemeral PR branches locally and remotely immediately after merge (run `pnpm branches:clean` locally; `branch-cleanup.yml` + `delete_branch_on_merge` handle `origin`).
2. **Never reuse a merged branch.** Always branch fresh from updated `dev` and delete it once merged.
3. **All development lands on `dev`.** Work branches from `dev` and merges back into `dev` through a pull request with CI green.
4. **Nobody pushes to `main` directly.** `main` only moves by a promotion PR from `dev`.
5. **Promotion is automatic.** As soon as CI on `dev` succeeds, `auto-promote.yml` opens (or refreshes) the `dev` → `main` PR with auto-merge enabled.

## Day-to-day flow

```sh
git switch dev
git pull --ff-only origin dev
git switch -c feat/timeline-filters
# ...work...
pnpm gate:quick            # fast loop
git commit -m "feat(timeline): add era filter"
pnpm gate:push             # full verification (also checks branch hygiene)
git push -u origin feat/timeline-filters
gh pr create --base dev    # CI must be green before merge
# after PR merges:
pnpm branches:clean        # switches to dev, fast-forwards, prunes merged branches
```

## Promotion flow

Automatic:

```
push to dev -> CI green -> auto-promote.yml -> PR dev -> main (auto-merge) -> release-please -> tag
```

Manual fallback (only needed if the org disallows Actions from creating PRs):

```sh
gh pr create --base main --head dev --title "chore(release): promote dev to main"
gh pr merge --auto --squash <number>
```

Then `release-please.yml` runs on `main` and opens the release PR; merging it creates the tag and
`deploy.yml` takes over.

## Required checks

`dev` and `main` both require:

- `Verify (lint, typecheck, test, build)`
- `Verify arsy control plane (Go)`
- `Enforce branch and commit policy`
- `Analyze (javascript-typescript)` (CodeQL)

## Local guard

`pnpm gate:push` refuses to run when the current branch is `main`. The optional pre-push hook
(`.githooks/pre-push`, installed with `pnpm hooks:install`) refuses to push to `refs/heads/main`
from any branch.

## Naming work branches

| Prefix              | Use for                                    |
| ------------------- | ------------------------------------------ |
| `feat/`             | new behaviour                              |
| `fix/`              | bug fixes                                  |
| `chore/`            | tooling, deps, config                      |
| `docs/`             | documentation only                         |
| `release-please--*` | Release Please's own branches (automation) |
