import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const manifestPath = resolve("artifacts/ui-matrix/manifest.json");
const baselinePath = resolve("docs/visual-baselines/approved-manifest.json");

if (process.env.CRAYON_APPROVE_VISUAL_BASELINE !== "YES") {
  throw new Error("Refusing baseline update. Set CRAYON_APPROVE_VISUAL_BASELINE=YES only for an intentional visual admission.");
}
if (!existsSync(manifestPath)) throw new Error("Visual matrix manifest is missing; capture a verified main build first.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== "1" || !Array.isArray(manifest.captures)) throw new Error("Unsupported visual matrix manifest.");
if (!manifest.sourceSha || manifest.sourceSha === "local-unverified") throw new Error("Approved visual baseline must identify an exact verified source SHA.");
if (process.env.CRAYON_VERIFIED_MAIN_SHA !== manifest.sourceSha) {
  throw new Error("CRAYON_VERIFIED_MAIN_SHA must exactly match the captured manifest source SHA.");
}
for (const entry of manifest.captures) {
  if ((entry.layout?.issues?.length ?? 0) > 0) throw new Error(`Cannot approve baseline with layout issues: ${entry.scenario}/${entry.theme}/${entry.detail}/${entry.viewport}`);
}

const approved = {
  version: "1",
  approvedSourceSha: manifest.sourceSha,
  policy: {
    conceptImageryExcluded: true,
    updateRequiresExplicitEnvironmentGate: true,
    semanticAndVisualHashesStoredSeparately: true,
  },
  captures: manifest.captures.map((entry) => ({
    scenario: entry.scenario,
    theme: entry.theme,
    detail: entry.detail,
    viewport: entry.viewport,
    file: entry.file,
    semanticSha256: entry.semanticSha256,
    screenshotSha256: entry.screenshotSha256,
  })),
};
mkdirSync(dirname(baselinePath), { recursive: true });
writeFileSync(baselinePath, `${JSON.stringify(approved, null, 2)}\n`);
console.log(`Approved CRAYON visual baseline from ${manifest.sourceSha}. Commit ${baselinePath} intentionally after review.`);
