import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const artifactsDir = resolve("artifacts/ui");
mkdirSync(artifactsDir, { recursive: true });

const viteBin = resolve("node_modules/.bin/vite");
const server = spawn(
  viteBin,
  [
    "preview",
    "--config",
    "apps/lab/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });

const captures = [
  {
    filename: "crayon-lab-banking-desktop-dark.png",
    viewport: { width: 1440, height: 1080 },
    isMobile: false,
    state: { scenario: "banking", theme: "dark", detail: "standard", inspect: "inspector" },
  },
  {
    filename: "crayon-lab-banking-desktop-light.png",
    viewport: { width: 1440, height: 1080 },
    isMobile: false,
    state: { scenario: "banking", theme: "light", detail: "standard", inspect: "inspector" },
  },
  {
    filename: "crayon-lab-deploy-desktop-dark.png",
    viewport: { width: 1440, height: 1080 },
    isMobile: false,
    state: { scenario: "deploy", theme: "dark", detail: "standard", inspect: "inspector" },
  },
  {
    filename: "crayon-lab-banking-mobile-light.png",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    state: { scenario: "banking", theme: "light", detail: "standard", inspect: "inspector" },
  },
];

try {
  await waitForUrl("http://127.0.0.1:4173/", 20_000);
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    for (const capture of captures) {
      const page = await browser.newPage({
        viewport: capture.viewport,
        deviceScaleFactor: 1,
        isMobile: capture.isMobile,
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(labUrl(capture.state), { waitUntil: "networkidle" });
      await assertPresentationState(page, capture.state);
      await page.screenshot({
        path: resolve(artifactsDir, capture.filename),
        fullPage: true,
      });
      await page.close();
    }

    console.log("Captured reproducible real CRAYON Lab screenshots:");
    for (const capture of captures) console.log(`- artifacts/ui/${capture.filename}`);
  } finally {
    await browser.close();
  }
} catch (error) {
  if (serverOutput) console.error(serverOutput);
  throw error;
} finally {
  server.kill("SIGTERM");
}

function labUrl(state) {
  const url = new URL("http://127.0.0.1:4173/");
  for (const [key, value] of Object.entries(state)) url.searchParams.set(key, value);
  return url.toString();
}

async function assertPresentationState(page, state) {
  const url = new URL(page.url());
  for (const [key, expected] of Object.entries(state)) {
    const actual = url.searchParams.get(key);
    if (actual !== expected) throw new Error(`Lab URL state mismatch for ${key}: ${actual} !== ${expected}`);
  }
  const activeTheme = await page.getByRole("button", { name: state.theme === "dark" ? "Dark Flagship" : "Light Companion" }).getAttribute("aria-pressed");
  if (activeTheme !== "true") throw new Error(`Lab did not activate URL-selected theme ${state.theme}`);
  const scenarioButton = page.getByRole("button", { name: new RegExp(`^${state.scenario === "deploy" ? "Deploy" : "Banking"}`, "i") });
  if (!(await scenarioButton.getAttribute("class"))?.includes("is-active")) throw new Error(`Lab did not activate URL-selected scenario ${state.scenario}`);
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
