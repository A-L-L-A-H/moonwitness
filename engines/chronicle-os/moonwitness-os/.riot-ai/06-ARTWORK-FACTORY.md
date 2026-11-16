# 06 — R!OT Artwork Factory

## Artwork is product infrastructure

R!OT must have a substantial, recognizable library of original assets. Artwork must not be an afterthought, a collection of stock illustrations, or a single background reused everywhere. Create a repeatable art-production workflow that yields source files, optimized assets, prompts/metadata, and real use in the application.

## Minimum target inventory

Targets are quality-controlled minimums, not permission to generate duplicates. Track each deliverable in `.riot-ai/11-ASSET-MANIFEST.json`.

| Format | Minimum target | Intended use |
|---|---:|---|
| PNG | 24 original files | Hero art, module spot illustrations, transparent character poses, texture plates |
| SVG | 32 original files | Stickers, decals, frames, mascots, editorial ornaments, vector illustrations |
| p5.js | 12 distinct sketches | Procedural backgrounds/effects, generative posters, exportable textures |

Expected total: **68 distinct visual deliverables**, before responsive variants and generated exports. The asset count is not complete until files exist, pass validation, and have documented intended use. If image generation is unavailable, finish vector and procedural work and leave blocked PNG entries open with exact prompts and a reason.

## Folder structure

Adapt to the implemented package boundaries, but keep source and optimized output distinguishable:

```text
packages/artwork/
├── assets/
│   ├── png/
│   │   ├── heroes/
│   │   ├── modules/
│   │   ├── characters/
│   │   └── textures/
│   ├── svg/
│   │   ├── stickers/
│   │   ├── characters/
│   │   ├── frames/
│   │   ├── ornaments/
│   │   └── illustrations/
│   └── generated/
│       ├── posters/
│       └── textures/
├── prompts/
│   ├── image-generation/
│   └── p5-generation/
├── sketches/
│   ├── xerox-turbulence/
│   ├── manga-speedlines/
│   └── ...
├── manifest.json
└── README.md
```

If the repository requires raw art to be served by Next.js, establish a clear build/copy pipeline into a public assets directory. Do not duplicate large binary assets in multiple folders without a reason.

## Required artwork groups

### PNG — 24 minimum

Create a coherent set with consistent art direction:

1. 4 hero/poster visuals for the dashboard, welcome, command center, and documentation cover.
2. 8 module spot illustrations representing infrastructure, customer ops, finance, sales, creative studio, intelligence, projects, and communications.
3. 6 character poses: R!OT GREMLIN (3 poses), STATIC RAT, BYTE GOBLIN, WRENCH GHOST.
4. 6 texture plates: xerox paper, black photocopy grain, halftone, torn paper collage, industrial scuff, signal interference.

PNG requirements:

- Hero/poster images: 16:9 or 3:2, ideally 2048 px or higher on the long edge.
- Spot illustrations: 1:1 or 4:3, ideally 1024 px or higher.
- Character stickers: transparent background where the tool supports it, 1024 px or higher.
- Texture plates: seamless/tileable where appropriate, 2048×2048 target.
- Keep critical UI text out of generated images. Add editable typography in the interface instead.
- Never use generated fake logos, broken words, illegible interface text, or watermarks.
- Optimize image sizes and select formats according to transparency and visual requirements.

### SVG — 32 minimum

Target a coherent vector library:

- 8 expressive stickers/decals: burst, scribble arrow, warning star, tape label, stamp, ripped tab, marker circle, signal icon.
- 6 original character/mascot vector assets or carefully simplified pose illustrations.
- 6 panel/frame/border systems: torn edge, ticket edge, industrial plate, comic frame, offset corner, rough underline.
- 6 editorial ornaments: halftone corner, speed lines, crosshatch, ink splat, starburst, jagged divider.
- 6 module/scene illustrations: server rack, network antenna, data vault, creative device, finance machine, communication node.

SVG quality requirements:

- Use `viewBox`; scale without distortion; set `role`/`aria` only when needed and hide purely decorative SVGs from assistive technology.
- Keep source code readable and optimized; avoid huge inline base64 images.
- Prefer simple paths and CSS variables for themeable fills/strokes.
- Avoid excessive filters and masks that cause slow rendering.
- Ensure SVGs work in both light and dark themes.
- Do not use a raster image embedded inside SVG as a fake vector deliverable.

### p5.js — 12 minimum

Create distinct deterministic sketches:

1. `xerox-turbulence` — photocopier-like noise and rough print field.
2. `manga-speedlines` — radial and directional comic motion lines.
3. `halftone-field` — responsive dot/shape halftone patterns.
4. `signal-glitch` — signal disruption and chromatic displacement.
5. `ink-splatter` — seeded organic ink/splatter distribution.
6. `acid-orbit` — eccentric orbit paths and electric signal nodes.
7. `industrial-waveform` — waveform, grid, and telemetry movement.
8. `chaos-grid` — controlled modular grid with randomized breaks.
9. `paper-rip` — procedural torn-paper edges.
10. `crosshatch-ritual` — layered hand-drawn hatch fields.
11. `static-creature` — abstract procedural creature/signal silhouette.
12. `riot-poster-engine` — composition engine for reproducible poster backgrounds.

p5 requirements:

- Each sketch has a unique name, purpose, source, preview, and configuration contract.
- Use a seedable random source so the same seed produces the same artwork.
- Expose width/height, seed, palette, intensity, and motion settings where relevant.
- Support export to PNG at a chosen scale/resolution.
- Use `noLoop()` or pause when static; animate only when needed.
- Stop or pause animation when offscreen or when reduced motion is enabled.
- Use dynamic/client-only loading; never break server rendering.
- Avoid unbounded particle counts, runaway draw loops, and device-pixel-ratio explosions.
- Provide a static SVG/PNG fallback for every production use of a p5 canvas.
- Avoid requiring p5 for basic app navigation or information display.

## Asset production pipeline

1. Plan: select manifest ID, target use, format, aspect ratio, palette, and visual prompt.
2. Generate/create: use the available image-generation tool for PNG, hand-author SVG, and implement p5 sketches.
3. Curate: reject duplicates, malformed composition, incoherent characters, broken typography, and artifacts.
4. Normalize: apply file naming, dimensions, transparency, viewBox, palette, and folder placement.
5. Optimize: compress responsibly without destroying texture or edge quality.
6. Document: record prompt, generator/tool if known, seed for p5, source path, output dimensions, intended use, and status.
7. Integrate: use the asset in a real screen or gallery with responsive sizing and a fallback.
8. Verify: inspect the rendered output in light/dark modes, small/large viewports, and reduced-motion mode.

## Asset naming

Use stable kebab-case names with clear purpose, e.g.:

- `hero-command-deck-xerox-01.png`
- `module-infrastructure-signal-rig.png`
- `character-riot-gremlin-stance-01.png`
- `texture-photocopy-grain-02.png`
- `sticker-warning-burst.svg`
- `frame-comic-panel.svg`
- `sketch-manga-speedlines.ts`

Never name files `final-final-2`, `new-image`, or `asset1`.

## Asset metadata

Each artwork entry should track:

- stable ID
- file path
- format
- dimensions/aspect ratio
- transparency/tileability if applicable
- visual preset(s)
- intensity suitability
- intended screen/use
- prompt/source notes
- p5 seed/config for procedural assets
- status: `planned | generated | curated | integrated | verified | blocked`

The manifest is the source of truth. Do not mark an asset `verified` because it merely exists.

## Character consistency bible

For every character, lock:

- name and personality
- silhouette and proportions
- face/eye style
- palette and material texture
- signature object/accessory
- line weight and shadow treatment
- allowed pose variations

Generate a reference sheet first, then variations. Keep the character recognizable across all images. Do not generate each pose from an unrelated prompt.

## Integration rules

- Hero PNGs belong in defined hero/cover composition components, not as arbitrary page backgrounds.
- Stickers and SVG ornaments use reusable graphic components with controlled placement and accessibility behavior.
- Textures are opt-in by theme/intensity and can be disabled.
- p5 canvases are optional enhancements and never the only way to understand a page.
- Use `next/image` or the repository's image abstraction for PNG where appropriate; do not bypass optimization without a reason.
- Give images useful alt text when meaningful; use empty alt/hidden semantics for decorative images.
