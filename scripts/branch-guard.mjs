#!/usr/bin/env node
/**
 * MoonWitness Branch Guard & Two-Branch Hygiene Engine
 * Only `dev` and `main` persist long-term; work branches are single-PR ephemeral.
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_PATH = fileURLToPath(import.meta.url);
const ROOT = resolve(MODULE_PATH, "..", "..");

export const PERSISTENT_BRANCHES = new Set(["dev", "main"]);
export const FORBIDDEN_PUSH_BRANCHES = new Set(["main", "master"]);
export const EPHEMERAL_BRANCH_PATTERN = /^(feat|fix|chore|ci|docs|refactor|test)\/[a-z0-9._-]+$/;
export const AUTOMATION_BRANCH_PREFIXES = ["release-please--", "dependabot/"];

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(level, message) {
  const prefix = {
    info: `${COLORS.cyan}[GUARD]${COLORS.reset}`,
    warn: `${COLORS.yellow}[WARN]${COLORS.reset}`,
    error: `${COLORS.red}[BLOCKED]${COLORS.reset}`,
    pass: `${COLORS.green}[OK]${COLORS.reset}`,
  };
  console.log(`${prefix[level]} ${message}`);
}

export function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf-8",
  });
  return {
    code: result.status ?? -1,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
  };
}

export function isAllowedBranchName(branch) {
  if (!branch) return false;
  if (branch === "dev") return true;
  if (EPHEMERAL_BRANCH_PATTERN.test(branch)) return true;
  return AUTOMATION_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix));
}

export function getBranchAudit(currentBranch) {
  const localRes = runGit(["for-each-ref", "--format=%(refname:short)", "refs/heads/"]);
  const localBranches =
    localRes.code === 0 && localRes.stdout ? localRes.stdout.split(/\r?\n/).filter(Boolean) : [];

  const targetBase =
    runGit(["rev-parse", "--verify", "--quiet", "origin/dev"]).code === 0 ? "origin/dev" : "dev";
  const mergedRes = runGit([
    "for-each-ref",
    `--merged=${targetBase}`,
    "--format=%(refname:short)",
    "refs/heads/",
  ]);
  const mergedSet = new Set(
    mergedRes.code === 0 && mergedRes.stdout ? mergedRes.stdout.split(/\r?\n/).filter(Boolean) : [],
  );

  const extraBranches = localBranches.filter(
    (branch) => !PERSISTENT_BRANCHES.has(branch) && branch !== currentBranch,
  );
  const staleMergedBranches = extraBranches.filter((branch) => mergedSet.has(branch));
  const activeUnmergedExtra = extraBranches.filter((branch) => !mergedSet.has(branch));

  return {
    localBranches,
    extraBranches,
    staleMergedBranches,
    activeUnmergedExtra,
    targetBase,
  };
}

function getPushTarget(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "push" && i + 1 < argv.length) {
      return argv[i + 1];
    }
  }
  return null;
}

function pruneExtraBranches(force = false) {
  const current = runGit(["branch", "--show-current"]).stdout;
  const dirty = runGit(["status", "--porcelain"]).stdout;

  if (current && !PERSISTENT_BRANCHES.has(current)) {
    if (dirty) {
      log(
        "error",
        `Worktree on "${current}" has uncommitted changes; commit or stash before running --prune.`,
      );
      return 1;
    }
    const checkout = runGit(["checkout", "dev"]);
    if (checkout.code !== 0) {
      log("error", checkout.stderr || "Failed to switch to dev.");
      return 1;
    }
    log("pass", 'Switched to integration branch "dev"');
  }

  const fetch = runGit(["fetch", "origin", "--prune"]);
  if (fetch.code !== 0) {
    log("warn", fetch.stderr || "git fetch origin --prune failed (offline?)");
  } else {
    log("pass", "Pruned stale remote-tracking refs");
  }

  if (runGit(["branch", "--show-current"]).stdout === "dev") {
    const pull = runGit(["pull", "--ff-only", "origin", "dev"]);
    if (pull.code === 0) {
      log("pass", "Synchronized local dev with origin/dev");
    } else {
      log("warn", pull.stderr || "Could not fast-forward dev from origin/dev");
    }
  }

  const active = runGit(["branch", "--show-current"]).stdout;
  const audit = getBranchAudit(active);
  const targets = active && !PERSISTENT_BRANCHES.has(active) ? [] : audit.extraBranches;

  let exitCode = 0;
  for (const branch of targets) {
    const isMerged = audit.staleMergedBranches.includes(branch);
    if (!isMerged && !force) {
      log(
        "warn",
        `Keeping unmerged local branch "${branch}" (pass --force to delete unmerged branches).`,
      );
      continue;
    }
    const del = runGit(["branch", force ? "-D" : "-d", branch]);
    if (del.code === 0) {
      log("pass", `Deleted local branch "${branch}"`);
    } else {
      log("error", del.stderr || `Failed to delete local branch "${branch}"`);
      exitCode = 1;
    }
  }

  const finalAudit = getBranchAudit(runGit(["branch", "--show-current"]).stdout);
  log("info", `Remaining local branches: ${finalAudit.localBranches.join(", ")}`);
  return exitCode;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--prune")) {
    process.exit(pruneExtraBranches(argv.includes("--force")));
  }

  const currentBranch = runGit(["branch", "--show-current"]).stdout;
  const pushTarget = getPushTarget(argv);

  log("info", `Current branch: ${currentBranch || "(detached)"}`);

  if (!currentBranch) {
    log("error", "Detached HEAD — switch to dev or create an ephemeral work branch from dev.");
    process.exit(1);
  }

  if (FORBIDDEN_PUSH_BRANCHES.has(currentBranch)) {
    log("error", `Direct pushes from '${currentBranch}' are forbidden by MoonWitness policy.`);
    log("info", 'Switch to "dev" first: git checkout dev');
    process.exit(1);
  }

  if (pushTarget && FORBIDDEN_PUSH_BRANCHES.has(pushTarget.replace(/^refs\/heads\//, ""))) {
    log("error", `Direct push to '${pushTarget}' is forbidden.`);
    log("info", "Open a PR from an ephemeral work branch into 'dev'.");
    process.exit(1);
  }

  if (!isAllowedBranchName(currentBranch)) {
    log(
      "error",
      `Branch "${currentBranch}" violates MoonWitness naming rules. Only dev, main, and single-PR ephemeral branches (feat/*, fix/*, chore/*, ci/*, docs/*, refactor/*, test/*) are allowed.`,
    );
    process.exit(1);
  }

  const remote = runGit(["remote", "get-url", "origin"]);
  if (remote.code === 0) {
    log("pass", `Remote: ${remote.stdout}`);
  }

  const audit = getBranchAudit(currentBranch);
  if (audit.staleMergedBranches.length > 0) {
    log(
      "error",
      `Merged stale local branch(es) still exist: ${audit.staleMergedBranches.join(", ")}. Run: bun run branches:clean`,
    );
    process.exit(1);
  }
  if (audit.activeUnmergedExtra.length > 0) {
    log(
      "warn",
      `Additional local branch(es) detected: ${audit.activeUnmergedExtra.join(", ")}. Keep only dev + main persistently.`,
    );
  }

  if (currentBranch === "dev") {
    log(
      "warn",
      'On integration branch "dev" — direct pushes to origin/dev are blocked by ruleset; open an ephemeral PR branch for changes.',
    );
  } else {
    log("pass", `On ephemeral PR branch "${currentBranch}" (integrates via PR -> dev -> main)`);
  }

  log("pass", "Branch guard check passed");
  process.exit(0);
}

if (process.argv[1] && resolve(process.argv[1]) === MODULE_PATH) {
  main();
}
