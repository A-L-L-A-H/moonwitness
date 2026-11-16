import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const targetArg = process.argv[2];
if (!targetArg) throw new Error("Usage: node scripts/create-crayon.mjs <directory>");
const target = resolve(targetArg);
if (existsSync(target)) throw new Error(`Target already exists: ${target}`);
const template = resolve("templates/starter");
mkdirSync(target, { recursive: true });
cpSync(template, target, { recursive: true });
const packagePath = resolve(target, "package.json");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
pkg.name = sanitizePackageName(basename(target));
writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Created CRAYON starter at ${target}`);
console.log("Next: npm install && npm run dev");

function sanitizePackageName(value) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "crayon-app";
}
