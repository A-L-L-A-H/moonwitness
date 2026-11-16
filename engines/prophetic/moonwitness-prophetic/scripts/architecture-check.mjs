import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
if (manifest.type !== "module") throw new Error("ESM is required.");
if (!manifest.exports?.["."]) throw new Error("A public package entrypoint is required.");
if (manifest.dependencies && Object.keys(manifest.dependencies).some((dependency) => dependency.includes("moonwitness-"))) {
  throw new Error("Foundation packages must not declare unchecked cross-repository dependencies.");
}
