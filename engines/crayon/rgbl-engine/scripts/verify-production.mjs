import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";

const run = (command, args) => {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {stdio: "inherit", shell: process.platform === "win32"});
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const major = Number(process.versions.node.split(".")[0]);
if (!Number.isFinite(major) || major < 20) {
  console.error(`Node >=20 required; found ${process.versions.node}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.version !== "1.0.0") {
  console.error(`Production verifier expects v1.0.0; found ${pkg.version}`);
  process.exit(1);
}

run("git", ["lfs", "version"]);
run("npm", ["run", "build"]);
run("npm", ["test"]);
run("node", ["scripts/repo-check.mjs"]);
run("npm", ["run", "example:allah"]);
run("npm", ["run", "example:human"]);
run("npm", ["run", "example:nature"]);
run("npm", ["run", "example:justice"]);
run("node", ["scripts/verify-media.mjs"]);

console.log("\n✓ CRAYON v1.0.0 production acceptance PASS.");
console.log("  Engine + tests + four examples + repository structure + 37 media/research assets verified.");
