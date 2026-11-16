import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

const packsDir = resolve(".packs");
const tarballs = readdirSync(packsDir).filter((name) => name.endsWith(".tgz")).map((name) => join(packsDir, name));
if (tarballs.length !== PUBLIC_PACKAGES.length) throw new Error(`Expected ${PUBLIC_PACKAGES.length} package tarballs, found ${tarballs.length}`);
const cwd = mkdtempSync(join(tmpdir(), "crayon-pack-smoke-"));
try {
  writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "crayon-package-smoke", private: true, type: "module" }, null, 2));
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], { cwd, stdio: "inherit" });
  writeFileSync(join(cwd, "smoke.mjs"), `
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { simulateTransition, createTemporalRecord } from "allah-crayon-kernel";
import { explainCommitment, gravity, trace, disclosure, continuity, momentum } from "allah-crayon-physics";
import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation, renderRIRAsText, deriveSemanticTraversal, projectRIRDetail } from "allah-crayon-rir";
import { inspectRepresentation, inspectTemporalHistory } from "allah-crayon-inspector";
import { renderRIRForAgent } from "allah-crayon-agent";
import { renderRIRForVoice } from "allah-crayon-voice";
import { RIRView, deriveCommitmentInteraction } from "allah-crayon-react";
import { SafeRIRView, validateWebRIRInput } from "allah-crayon-react/safe";
for (const [name, value] of Object.entries({ simulateTransition, createTemporalRecord, explainCommitment, gravity, trace, disclosure, continuity, momentum, createSemanticSnapshot, planSituationRepresentation, renderRIRAsText, deriveSemanticTraversal, projectRIRDetail, inspectRepresentation, inspectTemporalHistory, renderRIRForAgent, renderRIRForVoice, RIRView, deriveCommitmentInteraction, SafeRIRView, validateWebRIRInput })) {
  if (typeof value !== "function") throw new Error(name + " is not importable from packed npm artifacts");
}
const stylesheet = fileURLToPath(import.meta.resolve("allah-crayon-react/styles.css"));
if (!existsSync(stylesheet)) throw new Error("allah-crayon-react/styles.css export does not resolve to a packed file");
const publicPackages = ${JSON.stringify(PUBLIC_PACKAGES.map((item) => item.name))};
for (const packageName of publicPackages) {
  try {
    await import(packageName + "/src/index.js");
    throw new Error(packageName + " exposed an undeclared internal deep import");
  } catch (error) {
    if (String(error?.message ?? error).includes("exposed an undeclared")) throw error;
    const code = error?.code;
    if (code !== "ERR_PACKAGE_PATH_NOT_EXPORTED" && code !== "ERR_MODULE_NOT_FOUND") {
      throw new Error(packageName + " deep-import rejection returned unexpected error " + String(code ?? error));
    }
  }
}
console.log("CRAYON npm package smoke test passed (public APIs + stylesheet + deep-import boundaries)");
`);
  execFileSync("node", ["smoke.mjs"], { cwd, stdio: "inherit" });
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
