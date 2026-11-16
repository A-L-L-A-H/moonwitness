#!/usr/bin/env node
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createCrayonEngine, CrayonValidationError, ENGINE_VERSION} from "./index.js";
import type {CrayonInput} from "./core/types.js";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`CRAYON RGBL Engine v${ENGINE_VERSION}\nUsage: npm run crayon -- <input.json> [--compact]`);
  process.exit(0);
}
const file = args.find((arg) => !arg.startsWith("-"));
const compact = args.includes("--compact");
if (!file) { console.error("Usage: npm run crayon -- <input.json> [--compact]"); process.exit(1); }
try {
  const path = resolve(process.cwd(), file);
  const raw = await readFile(path, "utf-8");
  const input = JSON.parse(raw) as CrayonInput;
  const result = createCrayonEngine().analyze(input);
  console.log(JSON.stringify(result, null, compact ? 0 : 2));
} catch (error) {
  if (error instanceof SyntaxError) console.error(`Invalid JSON: ${error.message}`);
  else if (error instanceof CrayonValidationError) console.error(`${error.code}: ${error.message}`);
  else console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
