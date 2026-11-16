import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { PUBLIC_PACKAGE_NAMES } from "./package-set.mjs";

const output = resolve("artifacts/supply-chain");
mkdirSync(output, { recursive: true });
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const components = [];
for (const [path, metadata] of Object.entries(lock.packages ?? {})) {
  if (!path.startsWith("node_modules/")) continue;
  const name = path.slice("node_modules/".length);
  components.push({
    type: "library",
    name,
    version: metadata.version ?? "unknown",
    license: metadata.license ?? "UNKNOWN",
    resolved: metadata.resolved ?? null,
    integrity: metadata.integrity ?? null,
    dev: metadata.dev === true,
  });
}
components.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const sbom = {
  bomFormat: "CycloneDX-inspired",
  specVersion: "0-experimental",
  generatedFrom: "package-lock.json",
  sourceSha: process.env.GITHUB_SHA ?? process.env.CRAYON_RELEASE_SHA ?? "local-unverified",
  publicPackages: [...PUBLIC_PACKAGE_NAMES],
  components,
};
writeFileSync(join(output, "sbom.json"), JSON.stringify(sbom, null, 2));
writeFileSync(join(output, "licenses.json"), JSON.stringify({
  generatedFrom: "package-lock.json",
  dependencies: components.map(({ name, version, license, dev }) => ({ name, version, license, dev })),
}, null, 2));

const packsDir = resolve(".packs");
const checksums = [];
if (existsSync(packsDir)) {
  for (const file of readdirSync(packsDir).filter((name) => name.endsWith(".tgz")).sort()) {
    const bytes = readFileSync(join(packsDir, file));
    checksums.push({ file: basename(file), sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength });
  }
}
writeFileSync(join(output, "package-checksums.json"), JSON.stringify({ algorithm: "sha256", packages: checksums }, null, 2));
console.log(`Supply-chain evidence: ${components.length} locked dependencies, ${checksums.length} package tarballs.`);
