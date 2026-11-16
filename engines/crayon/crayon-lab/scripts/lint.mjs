import { readdir } from "node:fs/promises";

const forbidden = new Set(["common", "shared", "utils", "helpers", "misc"]);
const rootEntries = await readdir(new URL("..", import.meta.url), { withFileTypes: true });
const found = rootEntries.filter((entry) => entry.isDirectory() && forbidden.has(entry.name)).map((entry) => entry.name);
if (found.length > 0) {
  throw new Error(`Forbidden unowned foundation directories: ${found.join(", ")}`);
}
