import {existsSync, readFileSync} from "node:fs";
const required=["README.md","docs/framework/CRAYON-FRAMEWORK.md","docs/PRODUCTION.md","docs/VALIDATION.md","engine/src/index.ts","engine/src/core/engine.ts","engine/tests/engine.test.ts","schemas/crayon-input.schema.json","schemas/crayon-result.schema.json","media/MANIFEST.md","media/SHA256SUMS.txt"];
const missing=required.filter((path)=>!existsSync(path));
if(missing.length){console.error("Missing required production files:\n"+missing.join("\n"));process.exit(1);}
const pkg=JSON.parse(readFileSync("package.json","utf8"));
if(pkg.version!=="1.0.0"){console.error(`Expected package version 1.0.0, got ${pkg.version}`);process.exit(1);}
const checksums=readFileSync("media/SHA256SUMS.txt","utf8").trim().split("\n").filter(Boolean);
if(checksums.length!==37){console.error(`Expected 37 production asset checksums, got ${checksums.length}`);process.exit(1);}
console.log(`Repository structure OK — ${required.length} required paths; ${checksums.length} production asset checksums.`);
