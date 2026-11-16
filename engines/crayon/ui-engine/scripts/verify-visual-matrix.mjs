import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve("artifacts/ui-matrix/manifest.json");
const baselinePath = resolve("docs/visual-baselines/approved-manifest.json");

if (!existsSync(manifestPath)) throw new Error("Visual matrix manifest is missing; run npm run capture:matrix first.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== "1" || !Array.isArray(manifest.captures)) throw new Error("Unsupported visual matrix manifest.");
if (process.env.GITHUB_ACTIONS === "true" && manifest.sourceSha === "local-unverified") {
  throw new Error("CI visual evidence must identify an exact source SHA.");
}

const requiredScenarios = new Set(["Banking", "File", "Email", "ERP", "Deploy", "AI"]);
const scenarios = new Set(manifest.captures.map((entry) => entry.scenario));
for (const scenario of requiredScenarios) {
  if (!scenarios.has(scenario)) throw new Error(`Visual matrix missing scenario ${scenario}.`);
}
for (const theme of ["Dark Flagship", "Light Companion"]) {
  if (!manifest.captures.some((entry) => entry.theme === theme)) throw new Error(`Visual matrix missing theme ${theme}.`);
}
for (const detail of ["compact", "standard", "expanded"]) {
  if (!manifest.captures.some((entry) => entry.detail === detail)) throw new Error(`Visual matrix missing semantic detail ${detail}.`);
}
for (const viewport of ["desktop", "mobile"]) {
  if (!manifest.captures.some((entry) => entry.viewport === viewport)) throw new Error(`Visual matrix missing viewport ${viewport}.`);
}
for (const entry of manifest.captures) {
  if (!entry.semanticSha256 || !entry.screenshotSha256) throw new Error(`Visual matrix capture ${key(entry)} lacks semantic/pixel hashes.`);
  if ((entry.layout?.issues?.length ?? 0) > 0) throw new Error(`LAYOUT_DRIFT ${key(entry)}: ${JSON.stringify(entry.layout.issues)}`);
}

if (!existsSync(baselinePath)) {
  console.log("Visual matrix structure is valid; no approved baseline exists yet. Use explicit baseline admission after a verified main build.");
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
if (baseline.version !== "1" || !Array.isArray(baseline.captures)) throw new Error("Unsupported approved visual baseline manifest.");
const approved = new Map(baseline.captures.map((entry) => [key(entry), entry]));
const failures = [];
for (const current of manifest.captures) {
  const previous = approved.get(key(current));
  if (!previous) {
    failures.push(`BASELINE_MISSING ${key(current)} has no approved baseline.`);
    continue;
  }
  if (previous.semanticSha256 !== current.semanticSha256) {
    failures.push(`SEMANTIC_DRIFT ${key(current)} ${previous.semanticSha256} -> ${current.semanticSha256}`);
  }
  if (previous.screenshotSha256 !== current.screenshotSha256) {
    failures.push(`VISUAL_DRIFT ${key(current)} ${previous.screenshotSha256} -> ${current.screenshotSha256}`);
  }
}
for (const approvedKey of approved.keys()) {
  if (!manifest.captures.some((entry) => key(entry) === approvedKey)) failures.push(`BASELINE_ORPHAN ${approvedKey} is approved but no longer captured.`);
}
if (failures.length > 0) throw new Error(`CRAYON visual regression gate failed:\n${failures.join("\n")}`);

console.log(`CRAYON visual regression matrix matches approved baseline ${baseline.approvedSourceSha ?? "<unknown>"}.`);

function key(entry) {
  return [entry.scenario, entry.theme, entry.detail, entry.viewport].join("|");
}
