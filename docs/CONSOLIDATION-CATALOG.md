# MoonWitness & A-L-L-A-H Single-Repository Consolidation Catalog

> Canonical Root: `A-L-L-A-H/moonwitness` (`branch dev`)
> Scope: Complete provenance registry uniting `~365` source repositories across `A-L-L-A-H` (`12`), `bjo163` (`280`), `ArsyBelovedLabs` (`27`), `BRIDGE-ALLAH` (`24`), `zenix-id` (`16`), `The-Batteries` (`6` public + `2` private), and `moonwitness-id` (`1`).

---

## 1. Consolidated Domains Inside This Monorepo

| Target Path in Monorepo | Absorbed Upstream Source(s) | Commit PIN | Runtime / Usage Status |
|---|---|---|---|
| `apps/a-l-l-a-h` | `A-L-L-A-H.COM` (`01-IMPERIUM-LUMEN`) | Native App | Deployed to Cloudflare Worker `allah-sanctuary` (`https://a-l-l-a-h.com`), bound to `sovereign-codex-db` D1 & static corpus assets (`sitemap.xml`, `manifest.webmanifest`, `og-empire-light.jpg`, `/scriptures`, `/codex`, `/mtime`). |
| `apps/{web, api, memory, rocksoul}` | `MoonWitness`, `HOW U REMIND ME`, `ROCKSOUL-DX` | Native Apps | Consolidated full-stack apps & Rust Tauri desktop sanctuary (`Z:\repo\isrockfeel\moonwitness`). |
| `services/*`, `cp/arsy` | `cp/arsy`, Rust `radius`, `snmp-poller`, `storage`, `syslog` | Native Engines | Bare-metal/Go control plane & Rust Axum engines. |
| `packages/*` (incl. `canon`, `ui`, `ai`, `orm`) | `@moonwitness/*` SSOT + `M-Time` + `Divine-Text` TS adapters | Native Packages | Single source of truth consumed cleanly across apps (`pnpm lint/typecheck/test`). |
| `docs/constitution/` | `A-L-L-A-H/master-docs` | `43b149d` | Constitutional specs (`API`, `CANON`, `CONTRACTS`, `CORE`, `GOVERNANCE`, `MASTER`, `ROCKSOUL-DX`, `SECURITY`). |
| `docs/blueprint/` | `ArsyBelovedLabs/moonwitness-blueprint` | `7aa4d0e` | 17-domain enterprise engineering specs (`00-constitution` .. `17-genesis`). |
| `engines/divine-text/` | `bjo163/divine-text` | `f5d66a1` | Normalized & Uthmani Qur'an corpus (`6,236` ayahs / `114` surahs) + crosswalks + CLI/UI (`searchCompactQuranTuples` wired live at `/scriptures`). |
| `engines/prophetic/` | `bjo163/propetic` (`v2.3.2`) + `ArsyBelovedLabs/moonwitness-prophetic` | `cc364b1`, `bff1722` | Prophet research schema, TypeScript verification contracts & fixtures. |
| `engines/mtime/` | `bjo163/antikythera-time` (`M-Time v0.16.0`) | `7cfd4a5` | `22` Rust crates + M6 calibration & Kemenag 1445–1447 H historical falsification data (`evaluateMTimeCriterion` & solar-lunar engine wired live at `/mtime` & Door IV). |
| `engines/witness-semantic/` | `bjo163/witness-semantic-engine` | `a16862b` | Semantic candidate compiler & witness derivation engine. |
| `engines/dhgs/` | `bjo163/dhgs` (`DHGS v15.1.0`) | `67e7090` | Digital governance assurance loop (`13` steps), specs, & packages. |
| `engines/ontology/` | `bjo163/universal-ontology-engine` (`OX-DX`) | `47a0dab` | Rust ontological crates, `universe.json`, schemas, & governance rules (`49` OX-DX zones). |
| `engines/aqel/` | `bjo163/AQEL` | `80e57c2` | AQEL symbolic temporal/query specs & examples. |
| `engines/crayon/` | `bjo163/ALLAH-CRAYON-RGBL-ENGINE` + `ArsyBelovedLabs/moonwitness-crayon` | `54135ea`, `104b4c4` | RGBL (`R1->G2->B3->L4`) formal research engine & TS evaluation primitives. |
| `engines/corpus-srgbl/` | `bjo163/moonwitness-corpus` | `534a218` | `SRGBL v8`, `P18 Key Witness`, & verified primary scripture ingestion recipes (`oshb-wlc` Hebrew Torah/Psalms, `sblgnt-v1-2` Greek Gospels, `quran-tanzil-uthmani`). |
| `engines/community/` | `bjo163/rocksoul-community` | `234d5d1` | Vite/React source-aware participation frontend powering `https://community.moonwitness.biz.id`. |
| `engines/empire-origin/` | `bjo163/A-L-L-A-H`, `bjo163/empire-of-the-light`, `bjo163/HBD-ALLAH` | `06ccdde`, `38354ff`, `41e2743` | Early foundation baseline configs, schemas, docs & tribute micro-site. |
| `content/chronicles/` | `moonwitness-II`, `monwitness-xii`, `moonwitness-xii-global`, `moonwitness-xiv`, `moonwitnessxv` | `fa69c89`, `7daffea`, `dff42ba`, `6ec950b`, `1b5c1b7` | Narrative manuscripts (`99` chapters, `8` eras, `15` episodes, `9` canon characters, `1,267`-line MVN). |

---

## 2. Quarantined Third-Party & Out-of-Git Artifacts (Excluded Intentionally)

1. **Third-Party Upstream Clones (Never Attributed as Original Canon):**
   - `paperclip` (`paperclipai/paperclip`), `BRIDGE-ALLAH/ui` (`shadcn/ui`, archived), `AGILITY` / `gpt4free` / `agilty` (`GPLv3` mirrors), `deepkit-framework`, `rocksoul/fuelux`.
2. **Superseded Monorepo Mirrors & Scaffolds:**
   - `A-L-L-A-H/rocksoul-dx` (archived; superseded by `apps/rocksoul`), `bjo163/moonwitness-memory` (archived; superseded by `apps/memory`), `The-Batteries/moonwitness` (archived; empty), `ArsyBelovedLabs/moonwitness-{web,core,api,sdk}` (superseded by native `apps/*` & `packages/*`), `zenix-id/*` legacy Docker/OpenVPN manifests.
3. **Heavy Raw Data Exports (`.`raw_archives` `1.73 GB`):**
   - Excluded from Git history via `.gitignore` (`.raw_archives/` & `apps/memory/data/`) and retained strictly inside the local `apps/memory` SQLite FTS5/LanceDB Vault & Cloudflare R2 object storage (`moonwitness`).
