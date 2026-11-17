import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop-wide", width: 1440, height: 900 },
  { name: "desktop-standard", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-narrow", width: 360, height: 800 },
] as const;

test.describe("A-L-L-A-H.COM Homepage (01-imperium-lumen)", () => {
  for (const vp of VIEWPORTS) {
    test(`renders cleanly without horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "networkidle" });

      // Hero & primary CTA visible
      const hero = page.locator("section#the-gate");
      await expect(hero).toBeVisible();
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();

      const cta = hero.locator("a, button").first();
      await expect(cta).toBeVisible();

      // No horizontal overflow
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

      // Zero runtime/console errors
      expect(errors).toEqual([]);
    });
  }

  test("loads all visible images cleanly and supports all 9 worlds", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    // Check images loaded
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute("src") ?? "unknown");
    });
    expect(brokenImages).toEqual([]);

    // Check all 9 world tiles are rendered and selectable
    const worldTiles = page.locator(".mw-world-tile");
    await expect(worldTiles).toHaveCount(9);
  });

  test("supports keyboard navigation and prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });

    // Tab to skip link or first interactive element
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(["A", "BUTTON"]).toContain(activeTag);
  });
});
