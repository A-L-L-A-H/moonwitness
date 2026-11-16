import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const dist = resolve("dist-lab");
const assets = join(dist, "assets");

const budgets = Object.freeze({
  javascriptRawBytes: 650_000,
  javascriptGzipBytes: 220_000,
  cssRawBytes: 220_000,
  cssGzipBytes: 55_000,
  assetCount: 40,
});

const files = readdirSync(assets).filter((name) => statSync(join(assets, name)).isFile());
const js = summarize(files.filter((name) => name.endsWith(".js")));
const css = summarize(files.filter((name) => name.endsWith(".css")));

assertBudget("JavaScript raw", js.raw, budgets.javascriptRawBytes);
assertBudget("JavaScript gzip", js.gzip, budgets.javascriptGzipBytes);
assertBudget("CSS raw", css.raw, budgets.cssRawBytes);
assertBudget("CSS gzip", css.gzip, budgets.cssGzipBytes);
assertBudget("asset count", files.length, budgets.assetCount);

console.log(JSON.stringify({
  budgetVersion: "0",
  files: files.length,
  javascript: js,
  css,
  budgets,
}, null, 2));

function summarize(names) {
  let raw = 0;
  let gzip = 0;
  for (const name of names) {
    const bytes = readFileSync(join(assets, name));
    raw += bytes.byteLength;
    gzip += gzipSync(bytes, { level: 9 }).byteLength;
  }
  return { files: names.length, raw, gzip };
}

function assertBudget(label, actual, maximum) {
  if (actual > maximum) {
    throw new Error(`${label} budget exceeded: ${actual} > ${maximum}`);
  }
}
