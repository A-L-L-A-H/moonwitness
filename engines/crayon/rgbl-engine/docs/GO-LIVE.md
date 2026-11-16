# CRAYON v1.0.0 — Go-Live Runbook

This is the final production procedure. The repository intentionally keeps only two long-lived branches:

- `dev` — integration and acceptance
- `main` — production/stable

The release path is always:

```text
dev -> verify -> fast-forward -> main
```

## Prerequisites

Install:

- Node.js 20 or newer
- npm
- Git
- Git LFS
- optional: `ffprobe`/FFmpeg for semantic video-stream inspection

Confirm:

```bash
node --version
git --version
git lfs version
```

The canonical go-live and release commands are implemented in Node.js, so they work from Windows, macOS, and Linux. Bash wrappers remain available as convenience aliases.

## 1. Clone and enter dev

```bash
git clone https://github.com/bjo163/ALLAH-CRAYON-RGBL-ENGINE.git
cd ALLAH-CRAYON-RGBL-ENGINE
git checkout dev
git fetch origin --prune
```

The remote branch set must contain only `origin/main` and `origin/dev` (apart from the symbolic `origin/HEAD`).

## 2. Extract the production media bundle

Extract `CRAYON_PRODUCTION_MEDIA_LFS_READY.zip` outside the repository, for example:

```text
/path/to/CRAYON_PRODUCTION_MEDIA_LFS_READY/
  media/
  docs/research/
```

The bundle contains 37 production binary assets:

- 1 opener
- 32 Four Worlds posters
- 1 closing poster
- 1 BGM WAV
- 1 final MP4
- 1 Framework v1.9 DOCX

## 3. Run one-command go-live

From the repository root on `dev`:

```bash
npm install
npm run go-live -- /path/to/CRAYON_PRODUCTION_MEDIA_LFS_READY
```

On Windows PowerShell, the same `npm run go-live -- <path>` command is used.

The go-live command intentionally stops on any failed gate. It performs:

1. verify all 37 bundle SHA-256 checksums;
2. verify PNG/WAV/MP4/DOCX signatures;
3. inspect the MP4 with `ffprobe` when available;
4. install/activate Git LFS;
5. import media into canonical repository paths;
6. verify that all production binaries are covered by Git LFS attributes;
7. commit the production media to `dev`;
8. build the TypeScript engine;
9. run engine tests;
10. run repository structural checks;
11. run ALLAH, HUMAN, NATURE, and JUSTICE examples;
12. re-verify all 37 production assets from the repository;
13. push `dev`;
14. fast-forward `main` from `dev` only;
15. push `main`;
16. return the working copy to `dev`.

## 4. Final acceptance

After success:

```bash
npm run verify:production
git fetch origin --prune
git log --oneline -1 origin/main
git log --oneline -1 origin/dev
```

`origin/main` and `origin/dev` must point to the same production commit immediately after release.

The production verifier must print:

```text
CRAYON v1.0.0 production acceptance PASS
```

## Video acceptance target

The current v1.0 final video has been independently inspected as:

- duration: ~93 seconds
- video: H.264, 1280x720
- audio: AAC, stereo, 44.1 kHz
- opener: CRAYON SIN-CAN user-selected opener
- sequence: OPENER -> SOURCE -> SELF -> WORLD -> OTHERS -> DRAW AGAIN

The BGM master is WAV PCM, stereo, 44.1 kHz, ~93 seconds.

## GitHub Actions

CI is configured to perform the same production acceptance on `dev`, with Git LFS checkout enabled. If GitHub creates a job with zero steps and `runner_id: 0`, the runner/account environment is unavailable; this is not a failed code assertion. Until a runner executes normally, the local `npm run verify:production` result is the authoritative release gate.

## Do not release when

Do not promote to `main` if any of these are true:

- an RGBL level invents data instead of returning `UNKNOWN`;
- tests/build fail;
- a Four Worlds example fails;
- any media checksum differs;
- the MP4 has no audio stream;
- Git LFS is not active for production binaries;
- a third long-lived branch exists;
- `main` cannot be fast-forwarded from `dev`.

A failed gate is a stop condition, not a warning to ignore.
