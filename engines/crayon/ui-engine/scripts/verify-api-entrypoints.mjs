import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

const baseline = JSON.parse(readFileSync("docs/API-ENTRYPOINTS.json", "utf8"));
const failures = [];
for (const item of PUBLIC_PACKAGES) {
  const pkgPath = resolve(item.workspace, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const expected = baseline.packages[item.name];
  if (!Array.isArray(expected)) {
    failures.push(`${item.name}: missing baseline entry`);
    continue;
  }
  const actual = exportKeys(pkg.exports);
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
    failures.push(`${item.name}: exports drift expected=${expected.join(",")} actual=${actual.join(",")}`);
  }
  for (const key of actual) {
    if (key === "./styles.css") continue;
    const target = resolveExportTarget(pkg.exports, key);
    if (!target) failures.push(`${item.name}:${key}: no import target`);
    else if (!target.includes("dist/")) failures.push(`${item.name}:${key}: public runtime target must live under dist/`);
  }
  const sourceIndex = resolve(item.workspace, "src", item.workspace.endsWith("renderer-web") ? "index.tsx" : "index.ts");
  if (existsSync(sourceIndex) && /export\s+default\b/.test(readFileSync(sourceIndex, "utf8"))) {
    failures.push(`${item.name}: accidental default export is forbidden at public root`);
  }
}
const publicNames = PUBLIC_PACKAGES.map((item) => item.name).sort();
const baselineNames = Object.keys(baseline.packages).sort();
if (JSON.stringify(publicNames) !== JSON.stringify(baselineNames)) failures.push("API entrypoint baseline package set differs from canonical public release set");

if (failures.length > 0) {
  console.error("Public API entrypoint verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Public API entrypoint surface verified for ${PUBLIC_PACKAGES.length} packages.`);

function exportKeys(exportsField) {
  if (typeof exportsField === "string" || (exportsField && (exportsField.import || exportsField.types))) return ["."];
  return Object.keys(exportsField ?? {}).sort();
}
function resolveExportTarget(exportsField, key) {
  const value = (typeof exportsField === "string" || (exportsField && exportsField.import)) && key === "." ? exportsField : exportsField?.[key];
  if (typeof value === "string") return value;
  return value?.import ?? value?.default ?? value?.types;
}
