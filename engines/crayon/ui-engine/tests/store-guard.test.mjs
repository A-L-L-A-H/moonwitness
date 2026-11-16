import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

test("Kernel never depends on the temporal store package", () => {
  for (const file of sourceFiles("packages/kernel/src")) {
    const source = readFileSync(file, "utf8").toLowerCase();
    assert.equal(source.includes("allah-crayon-store"), false, `${file} depends on store`);
  }
});

test("Temporal store remains renderer and platform-storage implementation agnostic", () => {
  const source = readFileSync("packages/store/src/index.ts", "utf8").toLowerCase();
  for (const forbidden of ["react", "document.", "window.", "indexeddb", "node:fs", "localstorage", "button", "modal", "css"]) {
    assert.equal(source.includes(forbidden), false, `store leaked ${forbidden}`);
  }
});
