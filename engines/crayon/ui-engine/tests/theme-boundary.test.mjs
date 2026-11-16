import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const semanticRoots = [
  "packages/kernel/src",
  "packages/physics/src",
  "packages/snapshot/src",
  "packages/rir/src",
];

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function visualThemeLeak(source) {
  if (/data-theme/i.test(source)) return "data-theme";
  const tokens = source.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [];
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (normalized === "visualtheme" || normalized === "darktheme" || normalized === "lighttheme") return token;
  }
  const themeLiterals = [...source.matchAll(/["'`](dark|light)["'`]/gi)].map((match) => match[1].toLowerCase());
  return themeLiterals[0] ?? null;
}

test("semantic packages remain independent from visual theme names", () => {
  for (const root of semanticRoots) {
    for (const file of sourceFiles(root)) {
      const source = fs.readFileSync(file, "utf8");
      assert.equal(visualThemeLeak(source), null, `${file} leaked visual theme state`);
    }
  }
});

test("theme boundary guard catches real presentation leakage", () => {
  assert.equal(visualThemeLeak('const mode = "dark"'), "dark");
  assert.equal(visualThemeLeak('root.dataset["data-theme"] = "light"'), "data-theme");
  assert.equal(visualThemeLeak("interface VisualTheme { value: string }"), "VisualTheme");
  assert.equal(visualThemeLeak("interface Highlight { score: number }"), null);
});
