import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const packRoot = path.resolve(import.meta.dirname, "../packs/moonwitness-design-library-v1");
const inventory = JSON.parse(await fs.readFile(path.join(packRoot, "inventory.json"), "utf8"));
const exportsRoot = path.join(packRoot, "exports");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function isBlocked(category) {
  return ["png", "wallpapers", "logos"].includes(category);
}

// Step 1: collect approved source paths per category (icons + decor only)
const approved = inventory.assets.filter((a) => !isBlocked(a.category));
console.log(
  `Approved categories: ${approved.length} assets (icons+decor only; png/wallpapers/logos blocked)`,
);

// Step 2: build exports into staging (temp)
const stagedRoot = path.join(packRoot, "exports-staging");
await fs.rm(stagedRoot, { recursive: true, force: true });
await fs.mkdir(stagedRoot, { recursive: true });

for (const asset of approved) {
  const sourcePath = path.join(packRoot, asset.source);
  const sourceBytes = await fs.readFile(sourcePath);
  const meta = await sharp(sourceBytes).metadata();
  const [w, h] = [meta.width, meta.height];
  for (const exportPath of asset.exports) {
    const m = exportPath.match(/--(\d+)x(\d+)\.png$/);
    const [ew, eh] = m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
    const outPath = path.join(stagedRoot, exportPath);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    if (ew > 0 && eh > 0) {
      await sharp(sourceBytes)
        .resize(ew, eh, { kernel: "nearest" })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
    } else {
      await sharp(sourceBytes).png({ compressionLevel: 9 }).toFile(outPath);
    }
  }
  console.log(`Exported ${asset.id}: ${asset.exports.length} variants`);
}

// Step 3: walk staging and collect actual files
const actualExported = new Set();
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else if (entry.isFile()) {
      const rel = path.relative(dir, p).replaceAll(path.sep, "/");
      actualExported.add(rel);
    }
  }
}
await walk(stagedRoot);
console.log(`Staged unique files: ${actualExported.size}`);

// Step 3b: verify all expected exports exist
const expectedFiles = approved.flatMap((a) => a.exports);
const missing = expectedFiles.filter((f) => !actualExported.has(f));
if (missing.length > 0) throw new Error(`missing ${missing.length} expected exports`);
console.log(`All ${expectedFiles.length} expected exports present`);

// Step 3c: dimension & alpha validation on expected files only
for (const f of expectedFiles) {
  const bytes = await fs.readFile(path.join(stagedRoot, f));
  const meta = await sharp(bytes).metadata();
  const m = f.match(/--(\d+)x(\d+)\.png$/);
  const [ew, eh] = m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [meta.width, meta.height];
  if (meta.width !== ew || meta.height !== eh)
    throw new Error(
      `dimension mismatch: ${f} expected ${ew}x${eh} got ${meta.width}x${meta.height}`,
    );
  if (!meta.hasAlpha) throw new Error(`missing alpha: ${f}`);
}
console.log(`All ${expectedFiles.length} exports verified: dimensions & alpha correct`);

// Step 4: atomic swap — replace exports/ with staging
await fs.rm(exportsRoot, { recursive: true, force: true });
await fs.rename(stagedRoot, exportsRoot);
console.log(`Atomic swap complete: exports/ now contains ${actualExported.size} files`);

// Step 5: generate manifest from approved only
const manifest = {
  schemaVersion: 1,
  packId: inventory.packId,
  status: "partial",
  createdAt: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  approvalRecords: inventory.approvalRecords,
  batchApproval: inventory.batchApproval,
  palette: inventory.palette,
  blockedCategories: ["png", "wallpapers", "logos"],
  assets: [],
};
for (const asset of approved) {
  const sourcePath = path.join(packRoot, asset.source);
  const sourceBytes = await fs.readFile(sourcePath);
  const sHash = sha256(sourceBytes);
  const assetFiles = [];
  for (const exportPath of asset.exports) {
    const targetPath = path.join(exportsRoot, exportPath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const exBytes = await fs.readFile(targetPath);
    const ef = {
      path: exportPath,
      format: "png",
      bytes: exBytes.length,
      sha256: sha256(exBytes),
    };
    assetFiles.push(ef);
  }
  manifest.assets.push({
    id: asset.id,
    category: asset.category,
    sourcePath: asset.source,
    sourceSha256: sHash,
    files: assetFiles,
  });
}
await fs.writeFile(path.join(packRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Manifest written: ${manifest.assets.length} assets`);

// Final counts
const iconCount = manifest.assets.filter((a) => a.category === "icons").length;
const decorCount = manifest.assets.filter((a) => a.category === "decor").length;
console.log(
  `\nDone. Exported ${iconCount} icons + ${decorCount} decor sources = ${manifest.assets.length} assets.`,
);
console.log(
  "Blocked: png(0/12), wallpapers(0/4), logos(0/4 layouts) — provider/identity gate still closed.",
);
