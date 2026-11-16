# AI Agent Operating Model

**Status:** PROPOSED

## Roles

- **Owner:** sets goals, approves policy, reviews consequential outputs.
- **Planner agent:** decomposes approved goals into tasks and dependencies.
- **Research agent:** searches knowledge and attaches cited findings.
- **Builder agent:** executes scoped implementation tasks in connected repositories.
- **Reviewer agent:** checks acceptance criteria, tests, security, and evidence.
- **Coordinator:** assigns work, monitors leases, handles blockers, and summarizes status.

Roles are capability profiles, not claims that separate autonomous agents are already deployed.

## Execution protocol

1. Receive an explicit goal or task.
2. Retrieve relevant knowledge and cite source revisions.
3. Produce a plan and acceptance criteria.
4. Request approval when scope, risk, or external impact requires it.
5. Claim task with a time-bounded lease.
6. Execute only within granted tools and repositories.
7. Attach outputs, commits, test results, and known limitations.
8. Request review.
9. Mark done only when acceptance criteria are satisfied.
10. Record decisions and lessons without silently changing canon.

## Parallel execution

Parallelize independent tasks only. Declare dependencies before starting. Avoid multiple agents editing the same files or schema concurrently. Coordinator resolves ownership and merge conflicts.

## Stop conditions

Stop and ask the owner when credentials are missing, access is denied, source conflicts materially affect correctness, scope expands, destructive action is requested, or an irreversible external effect is involved.
