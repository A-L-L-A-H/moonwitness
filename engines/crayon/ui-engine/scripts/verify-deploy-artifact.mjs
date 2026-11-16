import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const rootPath = new URL("../dist-lab/", import.meta.url).pathname;
const indexPath = join(rootPath, "index.html");
if (!existsSync(indexPath)) throw new Error("CRAYON deploy artifact missing index.html");

const html = readFileSync(indexPath, "utf8");
if (!html.includes("CRAYON Lab")) throw new Error("Deploy artifact is not the CRAYON Lab build");
if (!html.includes("type=\"module\"") && !html.includes("type='module'")) {
  throw new Error("Deploy artifact has no module entrypoint");
}

const expectedSha = process.env.EXPECTED_RELEASE_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "";
if (expectedSha && !html.includes(expectedSha)) {
  throw new Error(`Deploy artifact does not identify expected source SHA ${expectedSha}`);
}

const assetsDir = join(rootPath, "assets");
if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) throw new Error("Deploy artifact has no assets directory");
const assets = readdirSync(assetsDir);
if (!assets.some((name) => name.endsWith(".js"))) throw new Error("Deploy artifact has no JavaScript bundle");
if (!assets.some((name) => name.endsWith(".css"))) throw new Error("Deploy artifact has no stylesheet bundle");

console.log(`CRAYON deploy artifact verified: ${assets.length} asset(s), index + exact-source metadata present`);
