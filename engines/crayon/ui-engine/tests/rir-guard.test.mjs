import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : entry.name.endsWith(".ts") ? [full] : [];
  });
}

const forbiddenTokens = new Set(["button", "card", "modal", "sidebar", "hover", "pixel", "css", "react"]);

function findLeakage(source) {
  const tokens = source.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [];
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (forbiddenTokens.has(normalized)) return normalized;
  }

  const imports = [...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)].map((match) => match[1].toLowerCase());
  for (const specifier of imports) {
    if (specifier === "react" || specifier.startsWith("react/")) return "react import";
    if (specifier.endsWith(".css")) return "css import";
  }
  return null;
}

test("RIR remains semantic and does not become a visual component tree", () => {
  for (const file of sourceFiles("packages/rir/src")) {
    const source = fs.readFileSync(file, "utf8");
    assert.equal(findLeakage(source), null, `${file} leaked ${findLeakage(source)}`);
  }
});

test("RIR guard rejects real visual vocabulary without substring false positives", () => {
  assert.equal(findLeakage("export interface PhysicsSignal { score: number }"), null);
  assert.equal(findLeakage("const button = 1"), "button");
  assert.equal(findLeakage('import React from "react"'), "react");
  assert.equal(findLeakage('import "./styles.css"'), "css");
});
