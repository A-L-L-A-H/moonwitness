import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

const rootVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
if (!rootVersion) throw new Error("Unable to resolve root release version");
if (!process.env.NODE_AUTH_TOKEN) throw new Error("NODE_AUTH_TOKEN is required for npm publishing");

const provenanceEnabled = process.env.CRAYON_NPM_PROVENANCE === "true";

for (const item of PUBLIC_PACKAGES) {
  const name = item.name;
  const manifest = JSON.parse(readFileSync(new URL(`../${item.workspace}/package.json`, import.meta.url), "utf8"));
  const version = manifest.version;
  if (!version) throw new Error(`Unable to resolve version for ${name}`);
  if (version !== rootVersion) throw new Error(`${name}@${version} does not match release version ${rootVersion}`);
  let alreadyPublished = false;
  try {
    const published = execFileSync("npm", ["view", `${name}@${version}`, "version", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    alreadyPublished = JSON.parse(published) === version;
  } catch (error) {
    const stderr = String(error?.stderr ?? error?.message ?? error);
    if (!stderr.includes("E404") && !stderr.includes("404 Not Found")) throw error;
  }
  if (alreadyPublished) {
    console.log(`${name}@${version}: already published, skipping`);
    continue;
  }
  console.log(`${name}@${version}: publishing with dist-tag alpha${provenanceEnabled ? " + provenance" : ""}`);
  const args = ["publish", "-w", name, "--tag", "alpha", "--access", "public"];
  if (provenanceEnabled) args.push("--provenance");
  execFileSync("npm", args, { stdio: "inherit", env: process.env });
}
console.log(`CRAYON npm publish sequence ${rootVersion} completed`);
