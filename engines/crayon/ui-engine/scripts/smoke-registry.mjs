import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

const registry = "https://registry.npmjs.org";
const rootVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
if (!rootVersion) throw new Error("Unable to resolve root release version");

for (const { name } of PUBLIC_PACKAGES) {
  const resolved = waitForAlpha(name, rootVersion);
  if (resolved !== rootVersion) throw new Error(`${name}@alpha resolved to ${resolved}, expected ${rootVersion}`);
}

const cwd = mkdtempSync(join(tmpdir(), "crayon-registry-smoke-"));
try {
  writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "crayon-registry-consumer", private: true, type: "module" }, null, 2));
  const specs = PUBLIC_PACKAGES.map(({ name }) => `${name}@${rootVersion}`);
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", `--registry=${registry}`, ...specs, "react@^19.2.7", "react-dom@^19.2.7"], { cwd, stdio: "inherit" });
  writeFileSync(join(cwd, "smoke.mjs"), `
import { simulateTransition, createTemporalRecord } from "allah-crayon-kernel";
import { explainCommitment, gravity, trace, disclosure, continuity, momentum } from "allah-crayon-physics";
import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation, renderRIRAsText, deriveSemanticTraversal, projectRIRDetail } from "allah-crayon-rir";
import { inspectRepresentation, inspectTemporalHistory } from "allah-crayon-inspector";
import { renderRIRForAgent } from "allah-crayon-agent";
import { renderRIRForVoice } from "allah-crayon-voice";
import { RIRView, deriveCommitmentInteraction } from "allah-crayon-react";
for (const [name, value] of Object.entries({ simulateTransition, createTemporalRecord, explainCommitment, gravity, trace, disclosure, continuity, momentum, createSemanticSnapshot, planSituationRepresentation, renderRIRAsText, deriveSemanticTraversal, projectRIRDetail, inspectRepresentation, inspectTemporalHistory, renderRIRForAgent, renderRIRForVoice, RIRView, deriveCommitmentInteraction })) {
  if (typeof value !== "function") throw new Error(name + " is not importable from the public npm registry release");
}
console.log("CRAYON real-registry consumer smoke passed");
`);
  execFileSync("node", ["smoke.mjs"], { cwd, stdio: "inherit" });
} finally {
  rmSync(cwd, { recursive: true, force: true });
}

function waitForAlpha(name, expected) {
  const attempts = 12;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const output = execFileSync("npm", ["view", `${name}@alpha`, "version", "--json", `--registry=${registry}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const version = JSON.parse(output);
      if (version === expected) {
        console.log(`${name}@alpha -> ${version}`);
        return version;
      }
      console.log(`${name}@alpha currently resolves to ${version}; waiting for ${expected}`);
    } catch (error) {
      const stderr = String(error?.stderr ?? error?.message ?? error);
      console.log(`${name}@alpha not visible yet (${compact(stderr)})`);
    }
    if (attempt < attempts) sleep(5000);
  }
  throw new Error(`${name}@alpha did not resolve to ${expected} after registry propagation window`);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function compact(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}
