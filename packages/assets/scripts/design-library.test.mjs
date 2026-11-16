import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packRoot = path.resolve(__dirname, "../packs/moonwitness-design-library-v1");

test("inventory has 52 unique assets across five categories", () => {
  const inv = JSON.parse(fs.readFileSync(path.join(packRoot, "inventory.json"), "utf8"));
  assert.equal(inv.assets.length, 52);
  assert.equal(new Set(inv.assets.map((a) => a.id)).size, 52);
  for (const c of ["icons", "png", "wallpapers", "logos", "decor"]) {
    assert.ok(
      inv.assets.some((a) => a.category === c),
      `missing ${c}`,
    );
  }
});

test("available-category inventory source paths exist on disk", () => {
  const inv = JSON.parse(fs.readFileSync(path.join(packRoot, "inventory.json"), "utf8"));
  const blocked = new Set(["png", "wallpapers", "logos"]);
  for (const a of inv.assets) {
    if (blocked.has(a.category)) continue; // provider/identity gate: absent is expected until unblocked
    const sources = a.sources ?? [a.source];
    for (const s of sources) {
      assert.ok(fs.existsSync(path.join(packRoot, s)), `missing source ${s}`);
    }
  }
});

test("no path escapes the pack root", () => {
  const inv = JSON.parse(fs.readFileSync(path.join(packRoot, "inventory.json"), "utf8"));
  const paths = [...inv.assets.flatMap((a) => [...(a.sources ?? [a.source]), ...a.exports])];
  for (const p of paths) {
    assert.equal(path.isAbsolute(p), false, `absolute path ${p}`);
    assert.equal(p.includes(".."), false, `traversal ${p}`);
  }
});

test("all icons are 24x24 and border-contained", async () => {
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  const sharp = req("sharp");
  const iconDir = path.join(packRoot, "source/icons");
  const files = fs.readdirSync(iconDir).filter((f) => f.endsWith(".svg"));
  assert.equal(files.length, 24, "expected 24 icons");
  for (const f of files) {
    const meta = await sharp(path.join(iconDir, f)).metadata();
    assert.deepEqual([meta.width, meta.height], [24, 24], f);
    const { data, info } = await sharp(path.join(iconDir, f))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let edge = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {
          edge = Math.max(edge, data[(y * info.width + x) * 4 + 3]);
        }
      }
    assert.equal(edge, 0, `border leak in ${f}`);
  }
});

test("SVG sources have no active or external content", () => {
  const { walk } = collectFiles();
  const svgs = walk().filter((p) => p.startsWith("source/") && p.endsWith(".svg"));
  assert.equal(svgs.length, 28); // 24 icons + 4 decor SVGs
  for (const p of svgs) {
    const svg = fs.readFileSync(path.join(packRoot, p), "utf8");
    assert.equal(
      /<(?:script|foreignObject|image|use)\b|(?:href|src)\s*=|\bon\w+\s*=|url\s*\(|<!DOCTYPE|<!ENTITY/i.test(
        svg,
      ),
      false,
      p,
    );
  }
});

function collectFiles() {
  function walk(dir = packRoot) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      out.push(
        ...(entry.isDirectory() ? walk(p) : [path.relative(packRoot, p).replaceAll(path.sep, "/")]),
      );
    }
    return out.sort();
  }
  return { walk };
}
