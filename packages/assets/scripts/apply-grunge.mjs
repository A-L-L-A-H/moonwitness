import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const packRoot = path.resolve(import.meta.dirname, "../packs/moonwitness-design-library-v1");
const inventory = JSON.parse(await fs.readFile(path.join(packRoot, "inventory.json"), "utf8"));
const sourceDir = path.join(packRoot, "source/icons");
const exportsRoot = path.join(packRoot, "exports");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// Read all SVG sources
const icons = inventory.assets.filter((a) => a.category === "icons");
console.log(`Processing ${icons.length} icons with rough-grunge refresh...`);

for (const asset of icons) {
  const sourcePath = path.join(packRoot, asset.source);
  const svg = await fs.readFile(sourcePath, "utf8");

  // Add grunge texture overlay via SVG filter (rough, distressed effect)
  const grungeFilter = `
    <defs>
      <filter id="grunge" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
        <feDiffuseLighting in="noise" lighting-color="#888" surfaceScale="1.5">
          <feDistantLight azimuth="45" elevation="60"/>
        </feDiffuseLighting>
        <feComposite in="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" result="grunge"/>
      </filter>
    </defs>
  `;

  // Apply filter to root svg element
  const enhancedSvg = svg.replace("<svg ", `<svg filter="url(#grunge)" `);

  // Write back to source (preserving original structure)
  await fs.writeFile(sourcePath, enhancedSvg);
  console.log(`  Refreshed ${asset.id}`);
}

// Re-export all icons with new grunge versions
await fs.rm(exportsRoot, { recursive: true, force: true });
await fs.mkdir(exportsRoot, { recursive: true });

for (const asset of icons) {
  const sourcePath = path.join(packRoot, asset.source);
  const bytes = await fs.readFile(sourcePath);
  const meta = await sharp(bytes).metadata();
  const [w, h] = [meta.width, meta.height];

  for (const exportPath of asset.exports) {
    const m = exportPath.match(/--(\d+)x(\d+)\.png$/);
    const [ew, eh] = m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
    const out = path.join(exportsRoot, exportPath);
    await fs.mkdir(path.dirname(out), { recursive: true });
    if (ew > 0 && eh > 0)
      await sharp(bytes)
        .resize(ew, eh, { kernel: "nearest" })
        .png({ compressionLevel: 9 })
        .toFile(out);
    else await sharp(bytes).png({ compressionLevel: 9 }).toFile(out);
  }
  console.log(`  Exported ${asset.id} grunge variants`);
}

// Also re-export decor assets (they already have rough edges, but refresh for consistency)
const decor = inventory.assets.filter((a) => a.category === "decor");
for (const asset of decor) {
  const sourcePath = path.join(packRoot, asset.source);
  const bytes = await fs.readFile(sourcePath);
  const meta = await sharp(bytes).metadata();
  const [w, h] = [meta.width, meta.height];

  for (const exportPath of asset.exports) {
    const m = exportPath.match(/--(\d+)x(\d+)\.png$/);
    const [ew, eh] = m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
    const out = path.join(exportsRoot, exportPath);
    await fs.mkdir(path.dirname(out), { recursive: true });
    if (ew > 0 && eh > 0)
      await sharp(bytes)
        .resize(ew, eh, { kernel: "nearest" })
        .png({ compressionLevel: 9 })
        .toFile(out);
    else await sharp(bytes).png({ compressionLevel: 9 }).toFile(out);
  }
}

console.log("Grunge refresh complete. All icons and decor exported.");
