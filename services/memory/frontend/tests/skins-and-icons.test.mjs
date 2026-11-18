import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_ROOT = path.resolve(import.meta.dirname, "..");
const EXPECTED_SKINS = [
  "default",
  "editorial",
  "technical",
  "riot",
  "archive",
  "transmission",
  "sanctuary",
  "brutalist",
  "noir",
  "kinetic",
];

describe("services/memory/frontend 10-skin & accessibility contract", () => {
  it("exposes all 10 canonical @moonwitness/ui skins and cycles cleanly without losing state", async () => {
    const skinsModule = await import(new URL("../lib/skins.ts", import.meta.url).href);
    assert.deepEqual([...skinsModule.MEMORY_SKINS], EXPECTED_SKINS);
    assert.equal(skinsModule.resolveMemorySkin(null), "default");
    assert.equal(skinsModule.resolveMemorySkin("unknown-skin"), "default");
    assert.equal(skinsModule.resolveMemorySkin("cinema"), "default");
    assert.equal(skinsModule.resolveMemorySkin("console"), "transmission");
    assert.equal(skinsModule.resolveMemorySkin("kinetic"), "kinetic");

    let current = "default";
    const visited = new Set([current]);
    for (let i = 0; i < EXPECTED_SKINS.length; i += 1) {
      current = skinsModule.nextMemorySkin(current);
      visited.add(current);
    }
    assert.equal(visited.size, EXPECTED_SKINS.length);
    assert.equal(current, "default");
  });

  it("defines CSS rules in globals.css for all 10 canonical data-skin presets", () => {
    const css = fs.readFileSync(path.join(FRONTEND_ROOT, "app/globals.css"), "utf8");
    for (const skin of EXPECTED_SKINS) {
      assert.match(css, new RegExp(`\\[data-skin="${skin}"\\]`), `Missing CSS rule for ${skin}`);
    }
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /::view-transition-new\(root\)/);
  });

  it("wires validated 10-skin initialization, MemoryDeckMark, selector, and telemetry bars", () => {
    const layout = fs.readFileSync(path.join(FRONTEND_ROOT, "app/layout.tsx"), "utf8");
    const shell = fs.readFileSync(
      path.join(FRONTEND_ROOT, "components/memory-deck-shell.tsx"),
      "utf8",
    );
    const page = fs.readFileSync(path.join(FRONTEND_ROOT, "app/page.tsx"), "utf8");

    for (const skin of EXPECTED_SKINS) {
      assert.ok(layout.includes(`"${skin}"`), `RootLayout script missing ${skin}`);
    }
    assert.ok(shell.includes("MEMORY_SKIN_META"));
    assert.ok(shell.includes("MemoryDeckMark"));
    assert.ok(shell.includes('aria-label="Select memory skin"'));
    assert.ok(shell.includes("applyMemorySkin"));
    assert.ok(page.includes('aria-label="Overview memory telemetry bars"'));
    assert.ok(page.includes('aria-label="Queue stage distribution sparkline"'));
  });

  it("retains dark/light semantic tokens across both root and light overrides", () => {
    const css = fs.readFileSync(path.join(FRONTEND_ROOT, "app/globals.css"), "utf8");
    assert.ok(css.includes(':root[data-theme="light"]'));
    assert.ok(css.includes("--surrounding:"));
    assert.ok(css.includes("--ink:"));
  });
});
