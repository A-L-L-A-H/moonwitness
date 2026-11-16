import { readFile } from "node:fs/promises";

const manifest = await readFile(new URL("../package.json", import.meta.url), "utf8");
if (/(api[_-]?key|password|secret|token)\s*[:=]\s*["'][^"']+["']/i.test(manifest)) {
  throw new Error("Potential committed secret found in package manifest.");
}
