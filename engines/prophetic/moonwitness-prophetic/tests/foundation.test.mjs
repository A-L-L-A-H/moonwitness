import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("foundation package declares ESM and a public export", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(manifest.type, "module");
  assert.ok(manifest.exports["."]);
  assert.match(manifest.engines.node, /^24\./);
});
