import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { PUBLIC_PACKAGES } from "./package-set.mjs";

execFileSync("node", ["scripts/build-packages.mjs"], { stdio: "inherit" });
rmSync(".packs", { recursive: true, force: true });
mkdirSync(".packs", { recursive: true });
for (const item of PUBLIC_PACKAGES) {
  execFileSync("npm", ["pack", "-w", item.name, "--pack-destination", ".packs"], { stdio: "inherit" });
}
