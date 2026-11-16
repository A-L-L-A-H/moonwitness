import {spawnSync} from "node:child_process";

const shell = process.platform === "win32";
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {encoding: options.capture ? "utf8" : undefined, stdio: options.capture ? "pipe" : "inherit", shell});
  if (result.status !== 0) process.exit(result.status ?? 1);
  return options.capture ? result.stdout.trim() : "";
};

const current = run("git", ["branch", "--show-current"], {capture: true});
if (current !== "dev") {
  console.error(`Release must start from dev; current branch: ${current}`);
  process.exit(2);
}

const dirty = run("git", ["status", "--porcelain"], {capture: true});
if (dirty) {
  console.error("Working tree must be clean before release.");
  console.error(dirty);
  process.exit(3);
}

run("git", ["fetch", "origin", "--prune"]);
const refs = run("git", ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"], {capture: true})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((x) => x !== "origin/HEAD")
  .sort();
const expected = ["origin/dev", "origin/main"];
if (JSON.stringify(refs) !== JSON.stringify(expected)) {
  console.error("Repository must expose only origin/dev and origin/main. Found:");
  console.error(refs.join("\n"));
  process.exit(4);
}

run("npm", ["run", "verify:production"]);
run("git", ["push", "origin", "dev"]);

let switched = false;
try {
  run("git", ["checkout", "main"]);
  switched = true;
  run("git", ["pull", "--ff-only", "origin", "main"]);
  run("git", ["merge", "--ff-only", "dev"]);
  run("git", ["push", "origin", "main"]);
} finally {
  if (switched) spawnSync("git", ["checkout", "dev"], {stdio: "inherit", shell});
}

console.log("\n✓ Production promoted dev -> main with fast-forward only.");
console.log("✓ Branch policy preserved: main + dev only.");
