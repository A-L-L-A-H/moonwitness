import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_ROOT = path.resolve(import.meta.dirname, "..");
const EXPECTED_SKINS = [
  "archive",
  "technical",
  "editorial",
  "riot",
  "cinema",
  "console",
  "sanctuary",
  "brutalist",
  "noir",
  "kinetic",
];

describe("services/memory/frontend 10-skin & accessibility contract", () => {
  it("exposes all 10 skins and cycles cleanly without losing state", async () => {
    const skinsModule = await import(new URL("../lib/skins.ts", import.meta.url).href);
    assert.deepEqual([...skinsModule.MEMORY_SKINS], EXPECTED_SKINS);
    assert.equal(skinsModule.resolveMemorySkin(null), "archive");
    assert.equal(skinsModule.resolveMemorySkin("unknown-skin"), "archive");
    assert.equal(skinsModule.resolveMemorySkin("kinetic"), "kinetic");

    let current = "archive";
    const visited = new Set([current]);
    for (let i = 0; i < EXPECTED_SKINS.length; i += 1) {
      current = skinsModule.nextMemorySkin(current);
      visited.add(current);
    }
    assert.equal(visited.size, EXPECTED_SKINS.length);
    assert.equal(current, "archive");
  });

  it("defines CSS rules in globals.css for all 10 data-skin presets", () => {
    const css = fs.readFileSync(path.join(FRONTEND_ROOT, "app/globals.css"), "utf8");
    for (const skin of EXPECTED_SKINS) {
      assert.match(css, new RegExp(`\\[data-skin="${skin}"\\]`), `Missing CSS rule for ${skin}`);
    }
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /::view-transition-new\(root\)/);
  });

  it("wires validated 10-skin initialization in RootLayout and MemoryDeckShell", () => {
    const layout = fs.readFileSync(path.join(FRONTEND_ROOT, "app/layout.tsx"), "utf8");
    const shell = fs.readFileSync(
      path.join(FRONTEND_ROOT, "components/memory-deck-shell.tsx"),
      "utf8",
    );
    for (const skin of EXPECTED_SKINS) {
      assert.ok(layout.includes(`"${skin}"`), `RootLayout script missing ${skin}`);
    }
    assert.ok(shell.includes("MEMORY_SKIN_META"));
    assert.ok(shell.includes("applyMemorySkin"));
  });

  it("retains dark/light semantic tokens across both root and light overrides", () => {
    const css = fs.readFileSync(path.join(FRONTEND_ROOT, "app/globals.css"), "utf8");
    assert.ok(css.includes(':root[data-theme="light"]'));
    assert.ok(css.includes("--surrounding:"));
    assert.ok(css.includes("--ink:"));
  });
});
