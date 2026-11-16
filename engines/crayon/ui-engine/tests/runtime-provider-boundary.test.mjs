import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const rendererRoots = [
  "packages/renderer-web/src",
  "packages/renderer-agent/src",
  "packages/renderer-voice/src",
  "packages/rir/src",
];

function sourceFiles(root) {
  const output = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) output.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(name)) output.push(path);
  }
  return output;
}

test("renderers never invent semantic timestamps or identities", () => {
  const forbidden = [
    /Date\.now\s*\(/,
    /new\s+Date\s*\(/,
    /randomUUID\s*\(/,
    /createRuntimeStamp\s*\(/,
    /systemIdentityProvider/,
    /systemClock/,
  ];

  for (const root of rendererRoots) {
    for (const file of sourceFiles(root)) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.doesNotMatch(source, pattern, `${file} must not invent semantic time/identity via ${pattern}`);
      }
    }
  }
});
