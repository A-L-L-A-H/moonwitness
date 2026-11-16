import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const packagesDir = resolve("packages");
const manifests = new Map();

for (const entry of readdirSync(packagesDir)) {
  const workspaceDir = join(packagesDir, entry);
  if (!statSync(workspaceDir).isDirectory()) continue;
  const manifestPath = join(workspaceDir, "package.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }
  if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    throw new Error(`${manifestPath}: workspace package requires name + version`);
  }
  manifests.set(manifest.name, { manifest, manifestPath });
}

const failures = [];
const dependencyFields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

for (const [workspaceName, { manifest, manifestPath }] of manifests) {
  for (const field of dependencyFields) {
    const dependencies = manifest[field] ?? {};
    for (const [dependencyName, declaredVersion] of Object.entries(dependencies)) {
      if (!dependencyName.startsWith("allah-crayon-")) continue;
      const local = manifests.get(dependencyName);
      if (!local) {
        failures.push(`${manifestPath}: ${field}.${dependencyName} refers to missing local CRAYON workspace`);
        continue;
      }
      if (declaredVersion !== local.manifest.version) {
        failures.push(
          `${manifestPath}: ${field}.${dependencyName}=${declaredVersion} does not match local ${dependencyName}@${local.manifest.version}`,
        );
      }
    }
  }

  if (manifest.private === true && manifest.publishConfig) {
    failures.push(`${manifestPath}: private experimental workspace must not carry publishConfig`);
  }
  if (manifest.private !== true && manifest.version === "0.0.0-experimental") {
    failures.push(`${manifestPath}: experimental workspace must be private`);
  }
  if (workspaceName !== manifest.name) {
    // Map identity assertion retained for readable diagnostics even though map key comes from manifest.name.
  }
}

if (failures.length > 0) {
  console.error("CRAYON workspace manifest guard failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`CRAYON workspace manifest guard passed (${manifests.size} workspaces)`);
