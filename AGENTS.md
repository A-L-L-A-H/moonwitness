# MoonWitness Workspace Rules (AI & Autonomous Agents)

## Strict Branch Rule: Work Only on `dev`

- **ALWAYS stay checked out on `dev`** (`git branch --show-current` must be `dev`).
- **ONLY two local branches may exist**: `dev` and `main`. Never leave feature, docs, or topic branches in the local repository.
- **FORBIDDEN locally**: `git checkout -b`, `git switch -c`, `git branch <new>`, or working on `main` or any non-`dev` local branch.
- **How to open a PR against `dev` without leaving `dev`**:
  1. Work and commit on `dev` (or stage changes on `dev`).
  2. Push directly to a transient remote PR ref without switching local branch:
     `git push origin dev:refs/heads/<type>/<slug>`
  3. Open PR against `--base dev`, merge with `--delete-branch`, then synchronize local `dev`:
     `git fetch origin dev && git reset --hard origin/dev`
- If any extra local branch is found, delete it immediately (`pnpm branches:clean` or `git branch -D <branch>`).
