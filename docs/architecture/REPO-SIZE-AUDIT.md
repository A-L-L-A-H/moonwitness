# Repository Size & History Audit (MW-0031)

**Measured at:** `dev` commit `484fcc6` (2026-11-17)
**Constraint:** Measurement and proposal only — no history rewrite, deletion, or split performed in this task.

## 1. Git Object Store Measurements

Measured via `git count-objects -vH` on the local working repository:

| Metric                     | Value          | Notes                                                                      |
| -------------------------- | -------------- | -------------------------------------------------------------------------- |
| Loose objects (`count`)    | 32,011         | Local unpacked objects from active worktrees & PR branches                 |
| Loose size (`size`)        | 2.10 GiB       | Reclaimable locally via `git gc` / pruning stale objects                   |
| Packed objects (`in-pack`) | 5,927          | Stored across 3 packfiles                                                  |
| Pack size (`size-pack`)    | 413.44 MiB     | Core packed Git history size (~413 MiB)                                    |
| Prune-packable             | 146            | Objects present in both loose store and packs                              |
| Git LFS                    | Not configured | `.gitattributes` marks `*.png`/`*.db` as `binary`, zero `filter=lfs` rules |

> [!NOTE]
> Local `size: 2.10 GiB` is inflated by 32,011 unpacked loose objects; packed history (`size-pack`) is **413.44 MiB**. GitHub's reported ~1.85 GB metadata figure reflects historical uncompressed/unrepacked trees plus unpruned media commits.

## 2. Working Tree Size by Top-Level Path (`HEAD`)

Measured via `git ls-tree -r -l HEAD` across all **16,950 tracked files** (~404.0 MB checked-out payload):

| Path                 | Tracked Files | Checked-out Size (MB) | Classification                                                                                                |
| -------------------- | ------------: | --------------------: | ------------------------------------------------------------------------------------------------------------- |
| `apps/`              |           773 |                121.31 | Active product runtime + static PNG/audio assets (`apps/web/public/art`, `apps/memory/frontend/public/audio`) |
| `engines/`           |        13,766 |                109.22 | Multi-file static game/narrative engine (`engines/empire-origin`)                                             |
| `packages/`          |           512 |                 84.34 | Shared libraries + duplicated raw reference PNGs (`packages/assets/references/raw`, `packages/assets/packs`)  |
| `vibe_images/`       |            11 |                 38.65 | Historical image-generation raw PNG outputs                                                                   |
| `ARTS/`              |            11 |                 29.56 | Historical art raw PNG assets                                                                                 |
| `content/`           |         1,236 |                 14.94 | Active story/chronicle corpus (`content/chronicles`)                                                          |
| `docs/`              |           453 |                  4.68 | Documentation & architecture records                                                                          |
| `services/` + `cp/`  |           128 |                  0.77 | Rust & Go control-plane source                                                                                |
| All other root files |           ~70 |                 ~0.55 | Configs, lockfile (`0.45 MB`), scripts, workflows                                                             |

## 3. Top Tracked Blobs & Duplication Findings

The largest tracked files in `HEAD` are uncompressed PNGs (3.8–4.5 MB each) and an MP3 file stored **redundantly in multiple directories**:

| Asset Group                                                                                                     | Single Copy (bytes) | Duplicate Copies in `HEAD` |                                              Combined Size in `HEAD` |
| --------------------------------------------------------------------------------------------------------------- | ------------------: | -------------------------- | -------------------------------------------------------------------: |
| `fog-voices.png` (`packages/assets/references/raw`, `vibe_images`, `apps/web/public/art`)                       |           4,461,568 | 3× identical blobs         | ~13.38 MB (deduped in Git object store, 3× on disk/tarball checkout) |
| `signal-sky.png`                                                                                                |           4,362,480 | 3× copies                  |                                                ~13.09 MB on checkout |
| `are-we-having-fun-yet.mp3` (`apps/memory/Are_We_Having_Fun_Yet.mp3` + `apps/memory/frontend/public/audio/...`) |           4,333,594 | 2× copies                  |                                                 ~8.67 MB on checkout |
| `night-shift.png`                                                                                               |           4,330,625 | 3× copies                  |                                                ~12.99 MB on checkout |
| `crowd-moon.png`                                                                                                |           4,216,875 | 3× copies                  |                                                ~12.65 MB on checkout |
| `crew-wall.png`                                                                                                 |           4,086,718 | 3× copies                  |                                                ~12.26 MB on checkout |
| `mirror-archive.png`                                                                                            |           4,029,026 | 3× copies                  |                                                ~12.09 MB on checkout |
| `crew-rooftop.png`                                                                                              |           4,014,254 | 4× copies                  |                                                ~16.06 MB on checkout |

Even though Git deduplicates identical SHA-1 content inside packs when unchanged, modified or uncompressed source PNGs across `vibe_images/`, `ARTS/`, and `packages/assets/references/raw/` accumulate rapidly across commits and bloat container build contexts unless `.dockerignore` excludes them (currently mitigated at Docker build time via `.dockerignore`).

## 4. Keep / Move / Delete Recommendations

| Candidate                                                                             | Classification                    | Recommendation                                                                                                                  | Owner / Impact                                        |
| ------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `vibe_images/` (38.65 MB, 11 PNGs)                                                    | Historical raw generation scratch | **Move / Archive** to external S3 (`services/storage` / R2 bucket) or delete duplicates already copied to `apps/web/public/art` | Owner: Frontend/Art. Saves ~38.6 MB on every checkout |
| `ARTS/` (29.56 MB, 11 PNGs)                                                           | Historical raw art assets         | **Move** raw sources to external object storage; keep compressed WebP/AVIF derivatives in `apps/web/public/art`                 | Owner: Frontend/Art. Saves ~29.5 MB + speeds clones   |
| `packages/assets/references/raw/` & duplicate `apps/memory/Are_We_Having_Fun_Yet.mp3` | Duplicated raw assets             | **Deduplicate** single source of truth; remove `apps/memory/Are_We_Having_Fun_Yet.mp3` root duplicate                           | Owner: Platform/Memory. Zero functional loss          |
| `apps/web/public/art/*.png` (~4 MB each)                                              | Active product runtime assets     | **Optimize (Convert PNG → WebP/AVIF)** in-repo for web delivery (typical 70–85% reduction)                                      | Owner: Web. Improves LCP and cuts ~60 MB              |
| `engines/` (13,766 files, 109.22 MB)                                                  | Embedded engine corpus            | **Keep for now**; review whether `engines/empire-origin` should move to its own release tarball or submodule in a dedicated RFC | Owner: Core/Product                                   |
| `content/` + `apps/` + `services/` + `cp/` + `docs/`                                  | Active source & canon corpus      | **Keep in Git**                                                                                                                 | Owner: Engineering                                    |
| Local loose Git objects (2.10 GiB)                                                    | Local developer object cache      | Run `git worktree prune && git gc --prune=now` locally (non-destructive)                                                        | Local dev disk hygiene only                           |
