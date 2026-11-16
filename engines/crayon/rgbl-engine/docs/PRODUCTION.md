# v7 Release Model

The repository uses only `dev` and `main`.

```text
dev → npm run verify:v7 → fast-forward → main
```

v7 is the stable research-specification release. `npm run verify:v7` checks build, tests, and the v7 research audit. Media publication through Git LFS remains an independent operational workflow and does not change the scientific validation status of RGBL.

Release metadata must preserve `releaseStatus = stable-research-specification` and `validationStatus = empirical-validation-pending` unless actual external evidence justifies a later change.
