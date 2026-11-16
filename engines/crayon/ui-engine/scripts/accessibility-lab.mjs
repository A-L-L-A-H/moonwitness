import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const viteBin = resolve("node_modules/.bin/vite");
const server = spawn(
  viteBin,
  ["preview", "--config", "apps/lab/vite.config.ts", "--host", "127.0.0.1", "--port", "4174", "--strictPort"],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });

try {
  await waitForUrl("http://127.0.0.1:4174/", 20_000);
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });

    const dark = page.getByRole("button", { name: "Dark Flagship" });
    const light = page.getByRole("button", { name: "Light Companion" });
    await assertAttribute(dark, "aria-pressed", "true", "Dark Flagship must be selected by default");
    await assertAttribute(light, "aria-pressed", "false", "Light Companion must expose unselected state");

    await verifyThemeContrast(page, "dark");
    await light.focus();
    await page.keyboard.press("Enter");
    await assertAttribute(light, "aria-pressed", "true", "Theme must be keyboard-selectable");
    const theme = await page.locator("html").getAttribute("data-theme");
    if (theme !== "light") throw new Error(`Keyboard theme activation failed; html data-theme=${theme}`);
    await verifyThemeContrast(page, "light");

    const focusLabels = [];
    await page.locator("body").focus();
    for (let index = 0; index < 40; index += 1) {
      await page.keyboard.press("Tab");
      focusLabels.push(await page.evaluate(() => {
        const active = document.activeElement;
        return (active?.getAttribute("aria-label") || active?.textContent || active?.tagName || "").trim().replace(/\s+/g, " ").slice(0, 140);
      }));
    }
    for (const expected of ["Dark Flagship", "Light Companion", "Banking", "compact", "inspector", "commitment"]) {
      if (!focusLabels.some((label) => label.toLowerCase().includes(expected.toLowerCase()))) {
        throw new Error(`Keyboard traversal did not reach ${expected}. Observed: ${focusLabels.join(" | ")}`);
      }
    }

    const trajectoryOrder = await page.locator(".crayon-trajectory").evaluateAll((nodes) => nodes.map((node) => ({
      order: Number(node.getAttribute("data-traversal-order")),
      tabIndex: node.tabIndex,
      label: node.getAttribute("aria-label"),
    })));
    if (trajectoryOrder.length === 0) throw new Error("No semantic trajectory was rendered for focus-order verification.");
    for (const item of trajectoryOrder) {
      if (!Number.isFinite(item.order) || item.order <= 0) throw new Error(`Trajectory is missing semantic traversal order: ${JSON.stringify(item)}`);
      if (item.tabIndex !== 0) throw new Error(`Trajectory is not keyboard focusable: ${JSON.stringify(item)}`);
    }
    const orders = trajectoryOrder.map((item) => item.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
      throw new Error(`Trajectory DOM/focus order diverges from semantic traversal: ${orders.join(", ")}`);
    }

    for (const label of ["Current orientation", "Present state", "Available semantic trajectories"]) {
      if (await page.getByLabel(label).count() === 0) throw new Error(`Missing accessible semantic region: ${label}`);
    }

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    for (const semanticToken of ["unknown", "partial", "witness", "resistance"]) {
      if (!bodyText.includes(semanticToken)) throw new Error(`Semantic state ${semanticToken} is not available as text; it may be color-only.`);
    }

    const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!reduced) throw new Error("Reduced-motion media preference was not observable by the Lab.");
    const transitionMs = await page.locator(".lab-shell").evaluate((element) => {
      const value = getComputedStyle(element).transitionDuration.split(",")[0]?.trim() ?? "0s";
      return value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
    });
    if (!Number.isFinite(transitionMs) || transitionMs > 1) {
      throw new Error(`Reduced-motion mode leaves a material Lab transition (${transitionMs}ms).`);
    }

    const forced = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await forced.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await forced.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });
    const forcedActive = await forced.evaluate(() => matchMedia("(forced-colors: active)").matches);
    if (!forcedActive) throw new Error("Forced-colors mode was not observable by the Lab.");
    const forcedAdjust = await forced.getByRole("button", { name: "Dark Flagship" }).evaluate((element) => getComputedStyle(element).forcedColorAdjust);
    if (forcedAdjust !== "auto") throw new Error(`Lab controls do not participate in forced colors; forced-color-adjust=${forcedAdjust}`);
    const forcedText = (await forced.locator("body").innerText()).toLowerCase();
    for (const semanticToken of ["unknown", "witness", "resistance"]) {
      if (!forcedText.includes(semanticToken)) throw new Error(`Forced-colors mode lost textual semantic state ${semanticToken}.`);
    }
    await forced.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await mobile.goto("http://127.0.0.1:4174/", { waitUntil: "networkidle" });
    const overflow = await mobile.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    if (overflow.scrollWidth > overflow.width + 1) {
      throw new Error(`Mobile Lab has horizontal overflow: scrollWidth=${overflow.scrollWidth}, viewport=${overflow.width}`);
    }

    console.log("CRAYON Lab accessibility smoke passed: keyboard, semantic order, contrast, reduced motion, forced colors, mobile overflow");
  } finally {
    await browser.close();
  }
} catch (error) {
  if (serverOutput) console.error(serverOutput);
  throw error;
} finally {
  server.kill("SIGTERM");
}

async function verifyThemeContrast(page, expectedTheme) {
  const current = await page.locator("html").getAttribute("data-theme");
  if (current !== expectedTheme) throw new Error(`Expected ${expectedTheme} theme for contrast verification; got ${current}`);
  const variables = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries([
      "--lab-bg",
      "--lab-surface",
      "--lab-text",
      "--lab-muted",
      "--lab-accent-strong",
      "--lab-witness",
      "--lab-semantic",
      "--lab-danger",
    ].map((name) => [name, style.getPropertyValue(name).trim()]));
  });
  const pairs = [
    ["--lab-text", "--lab-bg", 4.5],
    ["--lab-muted", "--lab-surface", 4.5],
    ["--lab-accent-strong", "--lab-surface", 4.5],
    ["--lab-witness", "--lab-surface", 4.5],
    ["--lab-semantic", "--lab-surface", 4.5],
    ["--lab-danger", "--lab-surface", 4.5],
  ];
  for (const [foreground, background, minimum] of pairs) {
    const ratio = contrastRatio(variables[foreground], variables[background]);
    if (ratio < minimum) {
      throw new Error(`${expectedTheme} contrast ${foreground} on ${background} is ${ratio.toFixed(2)}:1; requires >= ${minimum}:1`);
    }
  }
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) throw new Error(`Accessibility contrast requires six-digit hex theme token; got ${color}`);
  const hex = match[1];
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

async function assertAttribute(locator, name, expected, explanation) {
  const actual = await locator.getAttribute(name);
  if (actual !== expected) throw new Error(`${explanation}; ${name}=${actual}`);
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
