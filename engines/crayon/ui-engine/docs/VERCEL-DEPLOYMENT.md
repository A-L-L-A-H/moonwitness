# CRAYON Live Lab — Vercel

Status: Vercel is the active public deployment target. The connected Vercel team currently has no project, so no live URL is claimed yet.

## Hard deployment invariant

Only `main` may produce a public deployment.

```text
dev
  development only
  no automatic CI
  no Vercel preview deployment
  no public environment

      ↓ merge

main
  verified release boundary
      ↓
  Vercel production build
      ↓
  dist-lab/
```

`vercel.json` enforces this twice:

1. `git.deploymentEnabled.dev = false`;
2. `ignoreCommand` exits successfully for every branch whose `VERCEL_GIT_COMMIT_REF` is not `main`, which tells Vercel to skip that build.

The second rule is intentionally broader than the two-branch convention so accidental legacy/temporary branches also do not create public previews.

## Build contract

Vercel builds the static Lab with:

```bash
CRAYON_RELEASE_SHA=$VERCEL_GIT_COMMIT_SHA \
EXPECTED_RELEASE_SHA=$VERCEL_GIT_COMMIT_SHA \
npm run build:lab && npm run verify:deploy && npm run performance:web
```

Output directory:

```text
dist-lab/
```

The deploy verifier requires the executable Lab HTML, JavaScript/CSS assets, and exact-source metadata matching the Git commit when a release SHA is available.

## Static delivery policy

`vercel.json` configures immutable caching for hashed `/assets/*` and response protections including content-type protection, frame denial, restrictive referrer policy, and disabled camera/microphone/geolocation permissions.

## Project creation / Git connection

Vercel account connection is available, but the current team has no project yet. Create/import one project named `allah-crayon-ui-engine` from the private GitHub repository and set the production branch to `main`. Repository `vercel.json` then supplies the build/output/branch-skip contract.

No Vercel token, org ID, or project ID is committed to source control.

## Production evidence

After the first successful `main` deployment record:

- canonical production URL;
- Vercel project ID/slug (non-secret metadata only);
- deployment ID;
- exact source SHA;
- deployment timestamp;
- HTTP smoke result;
- rollback target / known-good prior deployment.

Deployment success proves only that the static Lab artifact is live. It does not prove semantic correctness, npm publication, or a domain action outcome.

Generated showcase boards remain **EXPECTATION / CONCEPT**. The Vercel URL is **LIVE LAB BUILD** evidence.
