import { execFileSync } from "node:child_process";
import { PUBLIC_PACKAGE_NAMES } from "./package-set.mjs";

const expectedRepository = "bjo163/ALLAH-CRAYON-UI-ENGINE".toLowerCase();

for (const name of PUBLIC_PACKAGE_NAMES) {
  try {
    const stdout = execFileSync("npm", ["view", name, "name", "version", "repository.url", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const data = JSON.parse(stdout || "{}");
    const repository = String(data["repository.url"] ?? data.repository?.url ?? "").toLowerCase();
    if (!repository.includes(expectedRepository)) throw new Error(`${name} already exists on npm and is not linked to this repository`);
    console.log(`${name}: existing CRAYON package ${data.version ?? "unknown version"}`);
  } catch (error) {
    const stderr = String(error?.stderr ?? error?.message ?? error);
    if (stderr.includes("E404") || stderr.includes("404 Not Found")) {
      console.log(`${name}: available for first publish`);
      continue;
    }
    throw error;
  }
}
