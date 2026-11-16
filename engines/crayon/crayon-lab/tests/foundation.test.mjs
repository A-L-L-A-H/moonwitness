import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createLabState, transitionLab } from "../dist/index.js";

test("foundation package declares ESM and a public export", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(manifest.type, "module");
  assert.ok(manifest.exports["."]);
  assert.match(manifest.engines.node, /^24\./);
});

test("lab workspace preserves explicit execution states", () => {
  const running = transitionLab(createLabState("sample"), "running");
  assert.equal(running.input, "sample");
  assert.equal(transitionLab(running, "completed", { result: { score: 4 } }).phase, "completed");
});
