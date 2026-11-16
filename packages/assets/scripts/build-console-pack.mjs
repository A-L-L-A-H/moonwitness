import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const OUT = path.join(ROOT, "packages/assets/packs/living-story-console-v1");
const definitions = [
  ["shadow-command-hero", "Scene", "Command scene", "cover", "50% 50%"],
  ["crew-rooftop", "Scene", "Rooftop crew scene", "cover", "50% 50%"],
  ["world-map-atlas", "Atlas", "Illustrated atlas backdrop", "contain", "50% 50%"],
  ["command-eye", "HUD", "Command eye accent", "contain", "50% 50%"],
  ["city-shadow", "Scene", "City establishing scene", "cover", "50% 50%"],
  ["sidebar-witness", "HUD", "Witness rail artwork", "cover", "50% 50%"],
  ["hero-moon-v2", "HUD", "Transparent moon overlay", "contain", "50% 50%"],
];
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

async function describe(data, file) {
  const meta = await sharp(data).metadata();
  assert(meta.width && meta.height, `Missing dimensions: ${file}`);
  return {
    path: file,
    format: meta.format,
    width: meta.width,
    height: meta.height,
    hasAlpha: !!meta.hasAlpha,
    bytes: data.length,
    sha256: sha256(data),
  };
}

// Read every input before writing outputs, including checking the optional overlay contract.
const inputs = await Promise.all(
  definitions.map(async ([id, role, title, fit, position]) => {
    const sourcePath = `apps/web/public/art/${id}.png`;
    const data = await readFile(path.join(ROOT, sourcePath));
    const source = await describe(data, sourcePath);
    assert.equal(source.format, "png", `Expected PNG: ${sourcePath}`);
    if (id === "hero-moon-v2") {
      assert(source.hasAlpha, "Moon overlay requires alpha");
      const stats = await sharp(data).stats();
      assert.equal(stats.isOpaque, false, "Moon overlay must be transparent");
    }
    return { id, role, title, fit, position, source, data };
  }),
);

await mkdir(OUT, { recursive: true });
const assets = [];
for (const input of inputs) {
  const { id, role, title, fit, position, source, data } = input;
  const originalPath = `${id}.png`;
  await writeFile(path.join(OUT, originalPath), data);
  const original = await describe(data, originalPath);
  const derivatives = [];
  for (const width of [...new Set([Math.min(source.width, 1440), Math.min(source.width, 480)])]) {
    const file = `${id}-${width}.webp`;
    const result = await sharp(data)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 100, effort: 6 })
      .toBuffer();
    await writeFile(path.join(OUT, file), result);
    derivatives.push(await describe(result, file));
  }
  assets.push({
    id,
    title,
    role,
    provenance: "existing project artwork",
    source,
    original,
    derivatives,
    positioning: {
      objectFit: fit,
      objectPosition: position,
      guidance:
        role === "Atlas"
          ? "Keep the whole illustration visible. Do not infer coordinates from painted landmarks."
          : fit === "cover"
            ? "Center is a starting point; review the crop at each breakpoint and keep faces unobscured."
            : "Keep the complete silhouette visible; do not stretch or flatten transparency.",
    },
    accessibility: {
      decorativeAlt: "",
      guidance:
        'Use alt="" for decorative art. Keep headings, controls and meaningful information in accessible HTML. If the image conveys unique information, supply contextual alt outside aria-hidden art slots.',
    },
  });
}

const manifest = {
  schemaVersion: 1,
  id: "living-story-console-v1",
  title: "MoonWitness living story console",
  provenance:
    "Curated copies and resized derivatives of existing project artwork. No new artwork generated.",
  license: "UNLICENSED",
  licensingNote: "Project UNLICENSED; no external licensing or redistribution rights are claimed.",
  generation: {
    status: "NOT GENERATED",
    reason:
      "Prior provider request denied with HTTP 403 (pricing), as reported in the task. This build makes no external calls.",
  },
  build: {
    script: "packages/assets/scripts/build-console-pack.mjs",
    sharp: sharp.versions.sharp,
    libvips: sharp.versions.vips,
    widths: [1440, 480],
    withoutEnlargement: true,
    webp: { quality: 82, alphaQuality: 100, effort: 6 },
    reproducibility:
      "No timestamps. Byte reproducibility requires identical source bytes and sharp/libvips versions.",
  },
  guidance: {
    effects:
      "Effects are opt-in; source artwork is already textured. Avoid stacking grain, halftone or scanlines.",
    componentBoundary:
      "ScenePanel art and AtlasStage backdrop are aria-hidden. Current working-tree components use explicit effects; older versions may also inherit skin preset effects. Review the installed UI version before adding effects.",
    paths: "Source paths are repository-relative; original and derivative paths are pack-relative.",
  },
  assets,
};
await writeFile(path.join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const scene = assets.find((asset) => asset.id === "shadow-command-hero").derivatives[0];
const atlas = assets.find((asset) => asset.id === "world-map-atlas").derivatives[0];
const snippets = `import { ScenePanel, AtlasStage } from "@moonwitness/ui";

// Copy the pack into your public asset directory and set its deployed URL.
const packUrl = "/packs/living-story-console-v1";

<ScenePanel
  scrim="left"
  art={<img src={\`${"${packUrl}"}/${scene.path}\`} alt=""
    width={${scene.width}} height={${scene.height}}
    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%" }} />}
>
  <div style={{ minHeight: "20rem", padding: "2rem" }}>
    <h2>Command scene</h2>
    <p>Keep live information in HTML, not in the artwork.</p>
  </div>
</ScenePanel>

<AtlasStage
  backdrop={<img src={\`${"${packUrl}"}/${atlas.path}\`} alt=""
    width={${atlas.width}} height={${atlas.height}}
    style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 50%" }} />}
>
  <div style={{ minHeight: "24rem" }}>
    <h2>World atlas</h2>
    <p>Illustrated backdrop, not geographic data.</p>
  </div>
</AtlasStage>`;

const sections = assets
  .map((asset, index) => {
    const full = asset.derivatives[0];
    return `<section aria-labelledby="${asset.id}">
<h2 id="${asset.id}">${escapeHtml(asset.title)} <small>${asset.role}</small></h2>
<figure><img src="${full.path}" width="${full.width}" height="${full.height}" alt="${escapeHtml(asset.title)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} style="object-fit:${asset.positioning.objectFit};object-position:${asset.positioning.objectPosition}">
<figcaption>${escapeHtml(asset.positioning.guidance)}</figcaption></figure>
<p>${full.width} × ${full.height} WebP. ${escapeHtml(asset.accessibility.guidance)}</p>
<div class="downloads">${[asset.original, ...asset.derivatives].map((file) => `<a href="${file.path}" download>${file.format.toUpperCase()} ${file.width} × ${file.height} (${file.bytes.toLocaleString("en-US")} bytes)</a>`).join("\n")}</div>
</section>`;
  })
  .join("\n");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>MoonWitness | Living story console asset pack</title>
<style>
:root { color-scheme: dark; --ink:#121219; --paper:#f4f0e6; --accent:#f7d65a; }
* { box-sizing:border-box; }
body { margin:0; background:var(--ink); color:var(--paper); font:1rem/1.65 system-ui,sans-serif; }
header,main,footer { max-width:74rem; margin:auto; padding:2rem clamp(1rem,4vw,3rem); }
h1 { font-size:clamp(2rem,5vw,3.5rem); line-height:1.15; max-width:24ch; }
h2 { font-size:1.5rem; line-height:1.3; } small { display:block; font-size:1rem; font-weight:400; }
p,figcaption { max-width:75ch; } section { padding-block:2rem; border-top:1px solid var(--paper); }
figure { margin:1.5rem 0; } img { display:block; width:100%; height:auto; max-height:38rem; }
figcaption { margin-top:1rem; } a { color:var(--accent); cursor:pointer; display:inline-block; padding:.65rem .25rem; overflow-wrap:anywhere; }
a:hover { text-decoration-thickness:3px; } a:active { text-decoration-style:double; }
a:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
.downloads,nav { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; }
pre { white-space:pre-wrap; overflow-wrap:anywhere; padding:1rem; border:1px solid var(--paper); font-size:.9rem; }
</style></head><body>
<header><h1>Living story console</h1>
<p>Reusable MoonWitness artwork for Scene, Atlas and HUD surfaces. Curated from existing project artwork, not newly generated art. The prior generation request was denied with HTTP 403 (pricing).</p>
<p>Project UNLICENSED. No external licensing or redistribution rights are claimed.</p>
<nav aria-label="Pack resources"><a href="manifest.json">Asset manifest</a><a href="#usage">Component usage</a></nav></header>
<main>${sections}
<section id="usage"><h2>Component usage</h2>
<p>Effects are opt-in; source artwork is already textured. This preview adds no texture or motion. Current working-tree ScenePanel and AtlasStage components use explicit effects. Older versions may inherit skin preset effects even when the effects prop is omitted. Check the installed UI version before adding effects.</p>
<p>These JSX examples require the existing MoonWitness UI styles and skin setup. Copy this folder into your application's public assets before using the example URL. Art slots are decorative and hidden from assistive technology; keep meaningful content outside them. Verify text contrast and cropping in the consuming layout.</p>
<pre><code>${escapeHtml(snippets)}</code></pre></section></main>
<footer><p>Preview design: dark ink isolates the existing textured artwork; paper-colored system typography keeps technical guidance readable offline. Spacious catalogue rows make crops and download sizes easy to compare. Yellow marks links only. No external requests, fonts or scripts.</p></footer>
</body></html>\n`;
await writeFile(path.join(OUT, "preview.html"), html);

// Validate the serialized deliverables, not just the buffers used to create them.
const saved = JSON.parse(await readFile(path.join(OUT, "manifest.json"), "utf8"));
let fileCount = 0;
let imageBytes = 0;
for (const asset of saved.assets) {
  assert.deepEqual(
    await describe(await readFile(path.join(ROOT, asset.source.path)), asset.source.path),
    asset.source,
  );
  assert.equal(asset.original.sha256, asset.source.sha256);
  for (const file of [asset.original, ...asset.derivatives]) {
    const data = await readFile(path.join(OUT, file.path));
    assert.deepEqual(await describe(data, file.path), file, `Manifest mismatch: ${file.path}`);
    assert.equal(file.hasAlpha, asset.source.hasAlpha);
    assert(file.width <= asset.source.width && file.height <= asset.source.height);
    if (file.format === "webp") {
      assert.equal(
        file.height,
        Math.round((asset.source.height * file.width) / asset.source.width),
      );
    }
    fileCount++;
    imageBytes += data.length;
  }
  assert.deepEqual(
    asset.derivatives.map((file) => file.width),
    [...new Set([Math.min(1440, asset.source.width), Math.min(480, asset.source.width)])],
  );
}
const preview = await readFile(path.join(OUT, "preview.html"), "utf8");
let links = 0;
for (const [, target] of preview.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (target.startsWith("#")) assert(preview.includes(`id="${target.slice(1)}"`));
  else {
    assert(
      !target.includes(":") && !target.startsWith("/") && !target.includes(".."),
      `Nonlocal link: ${target}`,
    );
    await readFile(path.join(OUT, target));
  }
  links++;
}
assert(!/<script\b|@import|url\(/i.test(preview), "Unexpected external resource mechanism");
const totalBytes =
  imageBytes +
  Buffer.byteLength(preview) +
  (await readFile(path.join(OUT, "manifest.json"))).length;
console.log(
  `Validated ${saved.assets.length} sources, ${fileCount} images (${imageBytes} bytes), ${links} preview links. Pack: ${fileCount + 2} files, ${totalBytes} bytes. Output: ${OUT}`,
);
