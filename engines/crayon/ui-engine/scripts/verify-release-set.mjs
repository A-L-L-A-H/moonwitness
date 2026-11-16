import { readFileSync, readdirSync, statSync } from "node:fs";
import { PUBLIC_PACKAGES, PUBLIC_PACKAGE_NAMES } from "./package-set.mjs";

const root = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const version = root.version;
if (!version) throw new Error("Root release version is missing");

const seen = new Set();
for (const item of PUBLIC_PACKAGES) {
  if (seen.has(item.name)) throw new Error(`Duplicate public package ${item.name}`);
  seen.add(item.name);
  const manifest = JSON.parse(readFileSync(new URL(`../${item.workspace}/package.json`, import.meta.url), "utf8"));
  if (manifest.name !== item.name) throw new Error(`${item.workspace} manifest name ${manifest.name} does not match release set ${item.name}`);
  if (manifest.version !== version) throw new Error(`${item.name}@${manifest.version} does not match root ${version}`);
  if (manifest.private) throw new Error(`${item.name} is in the public release set but marked private`);
  if (manifest.publishConfig?.access !== "public") throw new Error(`${item.name} must publish with access=public`);
  assertPublicDependencyVersions(manifest, item.name);
}

const packagesDir = new URL("../packages/", import.meta.url);
for (const entry of readdirSync(packagesDir)) {
  const workspaceUrl = new URL(`../packages/${entry}/`, import.meta.url);
  if (!statSync(workspaceUrl).isDirectory()) continue;
  const manifestUrl = new URL("package.json", workspaceUrl);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
  } catch {
    continue;
  }
  if (!manifest.private) continue;
  if (PUBLIC_PACKAGE_NAMES.includes(manifest.name)) {
    throw new Error(`Private workspace ${manifest.name} cannot also belong to public release set`);
  }
  assertPublicDependencyVersions(manifest, `${manifest.name} (private workspace)`);
}

console.log(`CRAYON release set ${version}: ${PUBLIC_PACKAGES.length} public package manifests + private workspace dependencies consistent`);

function assertPublicDependencyVersions(manifest, owner) {
  for (const [dependency, range] of Object.entries({
    ...(manifest.dependencies ?? {}),
    ...(manifest.peerDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {}),
  })) {
    if (!PUBLIC_PACKAGE_NAMES.includes(dependency)) continue;
    if (range !== version) throw new Error(`${owner} depends on ${dependency}@${range}; expected exact release version ${version}`);
  }
}
