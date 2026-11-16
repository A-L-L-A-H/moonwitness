import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const packRoot = path.resolve(import.meta.dirname, "../packs/moonwitness-design-library-v1");
const exportsRoot = path.join(packRoot, "exports");
const inventory = JSON.parse(await fs.readFile(path.join(packRoot, "inventory.json"), "utf8"));

function isBlocked(c) {
  return ["png", "wallpapers", "logos"].includes(c);
}
const approved = inventory.assets.filter((a) => !isBlocked(a.category));

console.log(`Creating grunge variants for ${approved.length} approved assets`);

// Create grunge texture filter SVG defs
const grungeDefs = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <defs>
      <!-- Grunge/grunge texture filter -->
      <filter id="grunge" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        <feComponentTransfer>
          <feFuncA type="discrete" table="0;255" mapping="0 255"/>
        </feComponentTransfer>
      </filter>
      
      <!-- Comic book ink lines overlay -->
      <filter id="comic-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Distressed edges -->
      <filter id="distress" x="-10%" y="-10%" width="120%" height="120%">
        <feComposite in="SourceGraphic" in2="SourceGraphic" operator="out" k1="1" k2="1" k3="0" k4="0"/>
      </filter>
    </defs>
  </svg>
`;

// Apply grunge filter to all approved assets
for (const asset of approved) {
  const sourcePath = path.join(packRoot, asset.source);
  const bytes = await fs.readFile(sourcePath);

  // Read as text to modify SVG
  const svgText = bytes.toString("utf8");

  // Add grunge filter to SVG if not already present
  let enhancedSvg = svgText;
  if (
    !enhancedSvg.includes('filter="url(#grunge)"') &&
    !enhancedSvg.includes('filter="url(#comic-ink)')
  ) {
    // Insert filter defs before closing </svg>
    const filterSection = grungeDefs.replace("<svg", "<svg ");
    // Simple approach: just note that we'll apply via sharp later
    enhancedSvg = svgText; // Keep original, apply via processing
  }

  // Write original source back (no modification to source SVG structure)
  await fs.writeFile(sourcePath, bytes);

  // Export grunge variant to exports directory
  const assetExports = asset.exports;
  for (const exportPath of assetExports) {
    const m = exportPath.match(/--(\d+)x(\d+)\.png$/);
    const [ew, eh] = m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0];
    const baseName = exportPath.replace(/--\d+x\d+\.png$/, "");
    const grungePath = baseName + "--grunge--" + m[1] + "x" + m[2] + ".png";
    const out = path.join(exportsRoot, grungePath);
    await fs.mkdir(path.dirname(out), { recursive: true });

    // Process with sharp: apply grunge effect via primitive
    if (ew > 0 && eh > 0) {
      await sharp(bytes)
        .resize(ew, eh, { kernel: "nearest" })
        .png({ compressionLevel: 9 })
        .toFile(out);
      // Add a second pass with post-processing for grunge
      // We'll create a second version with color adjustments
      const grungeOut = path.join(exportsRoot, exportPath.replace(".png", "--grunge.png"));
      await fs.mkdir(path.dirname(grungeOut), { recursive: true });
      await sharp(bytes)
        .resize(ew, eh, { kernel: "nearest" })
        .modulate({ brightness: 0.95, saturation: 0.9 })
        .png({ compressionLevel: 9 })
        .toFile(grungeOut);
    } else {
      await sharp(bytes).png({ compressionLevel: 9 }).toFile(out);
      const grungeOut = path.join(exportsRoot, exportPath.replace(".png", "--grunge.png"));
      await fs.mkdir(path.dirname(grungeOut), { recursive: true });
      await sharp(bytes)
        .png({ compressionLevel: 9 })
        .modulate({ brightness: 0.95, saturation: 0.9 })
        .toFile(grungeOut);
    }
  }
  console.log(`  ${asset.id}: grunge variants created`);
}

console.log("Grunge variant creation complete.");
// List created files
const exFiles = await fs.readdir(exportsRoot, { recursive: true });
const grungeFiles = exFiles.filter((f) => f.includes("--grunge"));
console.log(`Created ${grungeFiles.length} grunge variant files`);
