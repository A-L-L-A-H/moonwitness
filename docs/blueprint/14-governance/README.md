# 14 — Governance

Governance connects architecture decisions to delivery work.

```text
Blueprint → GitHub issue → branch/PR → CI → release
```

GitHub is the source-control and work-tracking authority; GitHub Actions is the verification mechanism.

Required controls include protected branches, CODEOWNERS, required CI checks, semantic versioning, dependency review, security review, and explicit ADRs for architecture exceptions.