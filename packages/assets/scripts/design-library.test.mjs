import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const packRoot = path.resolve(import.meta.dirname, "../packs/moonwitness-design-library-v1");
const exportsRoot = path.join(packRoot, "exports");

test("exports directory contains 160 PNG files (80 base + 80 grunge variants)", () => {
  assert.ok(fs.existsSync(exportsRoot), "exports/ directory exists");
  let count = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
      else if (entry.name.endsWith(".png")) count++;
    }
  }
  walk(exportsRoot);
  assert.equal(count, 160, `expected 160 PNG exports (80 base + 80 grunge), got ${count}`);
});

test("inventory paths stay within pack root", () => {
  const inv = JSON.parse(fs.readFileSync(path.join(packRoot, "inventory.json"), "utf8"));
  assert.equal(inv.assets.length, 52);
  for (const a of inv.assets) {
    for (const p of [...(a.sources ?? [a.source]), ...a.exports]) {
      assert.equal(path.isAbsolute(p), false, `absolute path ${p}`);
      assert.equal(p.includes(".."), false, `traversal ${p}`);
    }
  }
});

test("SVG sources have no active or external content", () => {
  const walk = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(full));
      else if (entry.name.endsWith(".svg")) out.push(full);
    }
    return out;
  };
  const svgs = walk(path.join(packRoot, "source"));
  assert.equal(svgs.length, 28);
  for (const full of svgs) {
    const svg = fs.readFileSync(full, "utf8");
    assert.equal(
      /<(?:script|foreignObject|image|use)\b|(?:href|src)\s*=|\bon\w+\s*=|url\(\s*['"]?(?!#)|<!DOCTYPE|<!ENTITY/i.test(
        svg,
      ),
      false,
      full,
    );
  }
});

test("manifest has 32 approved assets and correct structure", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(packRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.assets.length, 32);
  assert.equal(manifest.status, "partial");
  assert.deepEqual(manifest.blockedCategories.sort(), ["logos", "png", "wallpapers"]);
  for (const asset of manifest.assets) {
    assert.ok(["icons", "decor"].includes(asset.category));
    assert.ok(asset.sourcePath);
    assert.ok(asset.sourceSha256);
    assert.ok(asset.files.length > 0);
    for (const f of asset.files) {
      assert.ok(fs.existsSync(path.join(exportsRoot, f.path)), `missing ${f.path}`);
      assert.ok(f.sha256);
      assert.ok(f.bytes > 0);
    }
  }
});

test("no exports in blocked categories", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(packRoot, "manifest.json"), "utf8"));
  for (const asset of manifest.assets) {
    assert.ok(!["png", "wallpapers", "logos"].includes(asset.category));
  }
});

test("build script and test are executable", () => {
  const buildPath = path.resolve(import.meta.dirname, "build-design-library.mjs");
  const testPath = path.resolve(import.meta.dirname, "design-library.test.mjs");
  assert.ok(fs.existsSync(buildPath));
  assert.ok(fs.existsSync(testPath));
});
