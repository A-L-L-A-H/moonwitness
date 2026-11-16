import {cpSync, existsSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

const shell = process.platform === "win32";
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {encoding: options.capture ? "utf8" : undefined, stdio: options.capture ? "pipe" : "inherit", shell});
  if (result.status !== 0) process.exit(result.status ?? 1);
  return options.capture ? result.stdout.trim() : "";
};

const bundleArg = process.argv[2];
if (!bundleArg) {
  console.error("Usage: npm run go-live -- /path/to/unzipped/CRAYON_PRODUCTION_MEDIA_LFS_READY");
  process.exit(2);
}
const bundle = resolve(bundleArg);
if (!existsSync(resolve(bundle, "media/SHA256SUMS.txt")) || !existsSync(resolve(bundle, "docs/research/CRAYON-Framework-v1.9.docx"))) {
  console.error(`Invalid production bundle root: ${bundle}`);
  process.exit(3);
}

const current = run("git", ["branch", "--show-current"], {capture: true});
if (current !== "dev") {
  console.error(`Go-live must start from dev; current branch: ${current}`);
  process.exit(4);
}

const dirty = run("git", ["status", "--porcelain"], {capture: true});
if (dirty) {
  console.error("Working tree must be clean before importing production media.");
  console.error(dirty);
  process.exit(5);
}

run("git", ["lfs", "version"]);
run("node", ["scripts/verify-media.mjs", bundle]);
run("git", ["lfs", "install"]);

cpSync(resolve(bundle, "media"), resolve("media"), {recursive: true, force: true});
cpSync(resolve(bundle, "docs/research"), resolve("docs/research"), {recursive: true, force: true});

run("git", ["add", ".gitattributes", "media", "docs/research"]);
run("node", ["scripts/verify-media.mjs"]);

const staged = run("git", ["diff", "--cached", "--name-only"], {capture: true});
if (staged) {
  run("git", ["commit", "-m", "media: publish CRAYON Four Worlds production assets"]);
} else {
  console.log("Production media already matches the repository; no media commit needed.");
}

if (!existsSync("node_modules")) {
  console.log("Installing development dependencies for production verification...");
  run("npm", ["install"]);
}

run("npm", ["run", "verify:production"]);
run("node", ["scripts/release-production.mjs"]);
