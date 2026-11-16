import { execFileSync } from "node:child_process";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

for (const item of PUBLIC_PACKAGES) {
  console.log(`Building ${item.name}`);
  execFileSync("npm", ["run", "build", "-w", item.name], { stdio: "inherit" });
}
