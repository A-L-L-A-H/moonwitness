import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const artifactsDir = resolve("artifacts/ui-matrix");
mkdirSync(artifactsDir, { recursive: true });
const sourceSha = process.env.CRAYON_RELEASE_SHA || process.env.GITHUB_SHA || "local-unverified";

const matrix = [
  { scenario: "Banking", theme: "Dark Flagship", detail: "standard", viewport: "desktop" },
  { scenario: "Banking", theme: "Light Companion", detail: "standard", viewport: "mobile" },
  { scenario: "File", theme: "Dark Flagship", detail: "compact", viewport: "desktop" },
  { scenario: "Email", theme: "Light Companion", detail: "expanded", viewport: "desktop" },
  { scenario: "ERP", theme: "Dark Flagship", detail: "expanded", viewport: "mobile" },
  { scenario: "Deploy", theme: "Light Companion", detail: "compact", viewport: "desktop" },
  { scenario: "AI", theme: "Dark Flagship", detail: "standard", viewport: "mobile" },
];

const viteBin = resolve("node_modules/.bin/vite");
const server = spawn(viteBin, ["preview", "--config", "apps/lab/vite.config.ts", "--host", "127.0.0.1", "--port", "4174", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });

try {
  await waitForUrl("http://127.0.0.1:4174/", 20_000);
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const manifest = [];
  try {
    for (const entry of matrix) {
      const mobile = entry.viewport === "mobile";
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: mobile,
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: entry.theme }).click();
      await page.getByRole("button", { name: new RegExp(`^${escapeRegex(entry.scenario)}\\b`, "i") }).click();
      await page.getByRole("button", { name: entry.detail, exact: true }).click();
      await page.waitForTimeout(80);

      const semantic = await page.locator(".crayon-representation").evaluate((element) => ({
        situationId: element.getAttribute("data-semantic-ref"),
        detail: element.getAttribute("data-semantic-detail"),
        paths: [...element.querySelectorAll("[data-availability]")].map((node) => ({
          semanticRef: node.getAttribute("data-semantic-ref"),
          availability: node.getAttribute("data-availability"),
          resistance: node.getAttribute("data-resistance"),
          traversalOrder: node.getAttribute("data-traversal-order"),
        })),
        epistemic: [...element.querySelectorAll("[data-epistemic]")].map((node) => ({
          semanticRef: node.getAttribute("data-semantic-ref"),
          epistemic: node.getAttribute("data-epistemic"),
        })),
        witness: [...element.querySelectorAll("[data-witness-status]")].map((node) => ({
          semanticRef: node.getAttribute("data-semantic-ref"),
          status: node.getAttribute("data-witness-status"),
        })),
        redacted: [...element.querySelectorAll("[data-redacted='true']")].map((node) => node.getAttribute("data-semantic-ref")),
      }));

      const layout = await page.evaluate(() => {
        const tolerance = 1;
        const width = window.innerWidth;
        const selectors = [
          ".orientation-strip",
          ".representation-zone",
          ".crayon-representation",
          ".crayon-consequence-field",
          ".crayon-history",
        ];
        const issues = [];
        for (const selector of selectors) {
          for (const element of document.querySelectorAll(selector)) {
            const rect = element.getBoundingClientRect();
            if (rect.left < -tolerance || rect.right > width + tolerance) {
              issues.push({
                code: "HORIZONTAL_CLIP",
                selector,
                left: Math.round(rect.left * 100) / 100,
                right: Math.round(rect.right * 100) / 100,
                viewportWidth: width,
              });
            }
          }
        }
        const rootOverflow = document.documentElement.scrollWidth - width;
        if (rootOverflow > tolerance) issues.push({ code: "DOCUMENT_HORIZONTAL_OVERFLOW", overflowPx: rootOverflow, viewportWidth: width });
        return { viewportWidth: width, documentScrollWidth: document.documentElement.scrollWidth, issues };
      });
      if (layout.issues.length > 0) {
        throw new Error(`${entry.scenario}/${entry.theme}/${entry.detail}/${entry.viewport} layout regression: ${JSON.stringify(layout.issues)}`);
      }

      const semanticJson = stableJson(semantic);
      const semanticSha256 = createHash("sha256").update(semanticJson).digest("hex");
      const slug = `${slugify(entry.scenario)}-${entry.theme.startsWith("Dark") ? "dark" : "light"}-${entry.detail}-${entry.viewport}`;
      const screenshotPath = resolve(artifactsDir, `${slug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const screenshotSha256 = createHash("sha256").update(readFileSync(screenshotPath)).digest("hex");
      manifest.push({ ...entry, sourceSha, file: `${slug}.png`, screenshotSha256, semanticSha256, semantic, layout });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  writeFileSync(resolve(artifactsDir, "manifest.json"), JSON.stringify({
    version: "1",
    sourceSha,
    policy: {
      conceptsAreBaselines: false,
      semanticAndPixelDriftAreSeparate: true,
      baselineApprovalIsExplicit: true,
    },
    captures: manifest,
  }, null, 2));
  console.log(`Captured ${manifest.length} CRAYON visual-matrix entries from ${sourceSha}`);
} catch (error) {
  if (serverOutput) console.error(serverOutput);
  throw error;
} finally {
  server.kill("SIGTERM");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
function slugify(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
