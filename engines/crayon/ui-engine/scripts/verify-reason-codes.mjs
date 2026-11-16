import { readFileSync } from "node:fs";

const sources = [
  "packages/kernel/src/model.ts",
  "packages/kernel/src/execution.ts",
  "packages/store/src/index.ts",
  "packages/store/src/recovery.ts",
  "packages/adapter/src/index.ts",
  "packages/adapter/src/ingestion.ts",
  "packages/adapter/src/connector.ts",
  "packages/codec/src/index.ts",
  "packages/conformance/src/index.ts",
  "packages/renderer-web/src/safe.tsx",
  "packages/runtime/src/compensation.ts",
];
const docs = readFileSync("docs/REASON-CODES.md", "utf8");
const discovered = new Map();
for (const path of sources) {
  const source = readFileSync(path, "utf8");
  const typePattern = /export type\s+([A-Za-z0-9_]*(?:Reason|ReasonCode|ErrorCode)[A-Za-z0-9_]*)\s*=([\s\S]*?);/g;
  for (const match of source.matchAll(typePattern)) {
    const typeName = match[1];
    for (const codeMatch of match[2].matchAll(/"([A-Z][A-Z0-9_]+)"/g)) {
      const code = codeMatch[1];
      if (!discovered.has(code)) discovered.set(code, []);
      discovered.get(code).push(`${path}:${typeName}`);
    }
  }
}

const missing = [...discovered.keys()].filter((code) => !docs.includes(`\`${code}\``)).sort();
if (missing.length > 0) {
  console.error("Reason-code reference is missing source-defined codes:");
  for (const code of missing) console.error(`- ${code} (${discovered.get(code).join(", ")})`);
  process.exit(1);
}
console.log(`Reason-code catalog covers ${discovered.size} source-defined codes across ${sources.length} files.`);
