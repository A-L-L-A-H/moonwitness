import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
if (manifest.type !== "module") throw new Error("ESM is required.");
if (!manifest.exports?.["."]) throw new Error("A public package entrypoint is required.");
const allowedCoreVersion = "0.1.0";
for (const [dependency, version] of Object.entries(manifest.dependencies ?? {})) {
  if (dependency === "@arsybelovedlabs/moonwitness-core" && version === allowedCoreVersion) continue;
  if (dependency.includes("moonwitness-")) {
    throw new Error("Cross-repository dependencies must be explicitly allowlisted and pinned.");
  }
}
