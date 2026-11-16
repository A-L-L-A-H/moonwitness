# Repository Structure — v2.3 Handoff

```text
/
├─ HANDOFF.md
├─ RELEASE-MANIFEST.json
├─ CHECKSUMS.sha256
├─ INSTALL-WINDOWS.cmd / RUN-WINDOWS.cmd / VERIFY-WINDOWS.cmd
├─ INSTALL.sh / RUN.sh / VERIFY.sh
├─ package.json
├─ playwright.config.ts
├─ apps/
│  ├─ web/                  # PRIMARY React + Vite + TypeScript + Tailwind/shadcn-source UI
│  └─ api/                  # Node local API + SQLite adapter
├─ src/
│  ├─ engine/               # research/scoring/provenance/uncertainty engines
│  ├─ data/                 # canonical research schema/data + registries
│  └─ db/                   # research DB contracts
├─ data/sqlite/             # derived local SQLite read-model
├─ e2e/                     # Playwright production browser tests
├─ tests/                   # TypeScript core regression tests
├─ tests-v2.3/              # runtime/API/UI/scoring/handoff contracts
├─ scripts/                 # setup/start/doctor/verify/generator utilities
├─ web/                     # generated public registries + legacy compatibility, NOT primary frontend
├─ docs/
│  ├─ architecture/
│  ├─ corpus/
│  ├─ research/
│  ├─ scoring/
│  ├─ api/
│  ├─ project/
│  └─ archive/              # historical, non-active release docs
├─ reports/
│  ├─ current/
│  └─ archive/
├─ handoff/                 # generated verification result returned by tester
└─ archive/                 # historical inactive tests/reports
```

Active specifications are those referenced by `src/data/v2/documentation-registry.v2.3.json`.
