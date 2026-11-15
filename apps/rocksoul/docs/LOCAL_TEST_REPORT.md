# Local Test Report

**Date:** 2026-11-15
**Target:** Windows x64 personal-use build

## Results

| Check | Command | Result |
| --- | --- | --- |
| Frozen dependency install | `pnpm install --frozen-lockfile` | PASS, completed earlier in this execution |
| Frontend lint | `pnpm lint` | PASS, clean |
| Frontend typecheck | `pnpm typecheck` | PASS, strict IPC adapter and state orchestration |
| Native command/model parity | `pnpm check:commands` | PASS, 20 registered and implemented commands with Rust model field parity |
| Frontend tests | `pnpm test:coverage` | PASS, 26 tests across 6 files |
| Frontend coverage | `pnpm test:coverage` | PASS; per-module floors enforced, 55.19% lines overall |
| Frontend production build | `pnpm build` | PASS |
| Dependency security audit | `pnpm audit --audit-level high` | PASS, no known vulnerabilities |
| Project configuration | `pnpm check:config` | PASS, JSON/TOML/YAML and project invariants |
| Frontend module boundaries | `pnpm check:boundaries` | PASS |
| Rust tests | `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS, 24 tests including mocked remote operations and temporary-repository conflict coverage |
| Rust check | `cargo check --manifest-path src-tauri/Cargo.toml --locked` | PASS |
| Rust lint | `cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets --all-features -- -D warnings` | PASS |
| Windows release packaging | `pnpm tauri build` | Prior run passed; not rebuilt in this hardening pass |
| All local quality gates | `pnpm gate:check` | PASS, including typecheck and Clippy |
| Gated Windows release build | `pnpm gate:release` | Not rerun in this hardening pass |
| Installer install and app launch | Not run | NOT TESTED |
| Native CRUD/Git workflow smoke test | CRUD and installed Git controls not run | NOT TESTED |
| Restart, upgrade, and uninstall data retention | Not run | NOT TESTED |
| Installer signature verification | Not run | NOT TESTED; treat as unsigned |

## Artifacts

- `src-tauri/target/release/bundle/msi/ROCKSOUL - DX_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/ROCKSOUL - DX_0.1.0_x64-setup.exe`
- `src-tauri/target/release/rocksoul-dx.exe`

Artifacts listed above were generated in the prior release run on 2026-11-15 and were not rebuilt during this hardening pass. The user reports that install and uninstall of the previous build succeeded; the current native workflow smoke test remains unverified.

## Data safety

The database is stored in Tauri's per-user application data directory, outside the application installation directory. The user reports installation/uninstallation works safely on their machine. Upgrade data retention has not been tested. Back up app data before manual cleanup.

Do not treat packaging success as proof of successful installation, runtime operation, or data retention.
