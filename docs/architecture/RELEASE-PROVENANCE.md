# Release SBOM & Build Provenance (MW-0030)

## Workflow Overview

`.github/workflows/release-sbom.yml` generates reproducible SBOM metadata and cryptographic SHA-256 manifests on every GitHub Release (or manual `workflow_dispatch` on a release tag/SHA) using GitHub-hosted `ubuntu-latest` runners.

## What Is Produced

1. **Workspace Dependency SBOM (`pnpm-sbom.json` + `pnpm-lock.yaml`)** — exported directly from `pnpm install --frozen-lockfile`.
2. **Rust & Go Lockfile Snapshots** — `Cargo.lock` (`radius`, `snmp-poller`, `syslog`, `storage`) and `cp/arsy/go.mod` / `go.sum`.
3. **Immutable Release Bundle (`moonwitness-sbom-<sha>.tar.gz` + `SHA256SUMS.txt`)** — tied to the exact commit SHA (`git rev-parse HEAD`).
4. **GitHub Artifact Attestation** — invokes `actions/attest-build-provenance` (OIDC SLSA v1 provenance).

## Entitlement & Operational Note

- Public repositories (and paid GitHub Team/Enterprise private repositories) support `actions/attest-build-provenance` natively via GitHub OIDC (`id-token: write`, `attestations: write`).
- On repositories where Artifact Attestations are restricted by plan entitlement or org policy, the step uses `continue-on-error: true` while still archiving the immutable `SHA256SUMS.txt` and `moonwitness-sbom-<sha>.tar.gz` artifact so releases never fail silently and operators do not mistake unavailable attestations for signed provenance.
- Verification of the SBOM bundle always begins with:
  ```bash
  sha256sum -c dist-release/SHA256SUMS.txt
  ```
- When OIDC attestations are enabled for the repo, verify with:
  ```bash
  gh attestation verify dist-release/moonwitness-sbom-*.tar.gz --repo A-L-L-A-H/moonwitness
  ```
