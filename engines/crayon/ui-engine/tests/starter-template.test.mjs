import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../templates/starter/package.json", import.meta.url), "utf8"));
const source = readFileSync(new URL("../templates/starter/src/main.jsx", import.meta.url), "utf8");

test("starter consumes only public registry packages and no workspace/private internals", () => {
  const dependencies = Object.keys(pkg.dependencies);
  assert.ok(dependencies.includes("allah-crayon-react"));
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    if (name.startsWith("allah-crayon-")) assert.equal(version, "alpha");
  }
  for (const privateName of ["allah-crayon-store", "allah-crayon-adapter", "allah-crayon-runtime", "allah-crayon-conformance", "allah-crayon-observability", "allah-crayon-codec", "allah-crayon-lab-tools"]) {
    assert.equal(dependencies.includes(privateName), false);
    assert.doesNotMatch(source, new RegExp(privateName));
  }
  assert.doesNotMatch(source, /\.\.\/\.\.\/packages|workspace:/);
});
