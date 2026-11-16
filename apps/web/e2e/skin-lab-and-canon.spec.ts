import { expect, test } from "@playwright/test";

test.describe("Skin Laboratory & Canon Integration", () => {
  test("renders 7 Master DNA Worlds and passes comparison grid in /skin-lab", async ({ page }) => {
    await page.goto("/skin-lab");
    await expect(page.getByRole("heading", { name: "SKIN LABORATORY" })).toBeVisible();

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).not.toBe("rgba(0, 0, 0, 0)");

    for (const label of [
      "IMPERIUM LUMEN",
      "LUNAR CHRONICLES",
      "ROCKSOUL",
      "NEXUS PARADOX",
      "RIOT ANARCHY",
      "MYCELIUM",
      "SIMPUL NUSANTARA",
    ]) {
      const btn = page.getByRole("button", { name: new RegExp(label, "i") });
      await expect(btn).toBeVisible();
    }

    // Activate 01-imperium-lumen world and assert SkinScope renders scoped [data-dna] & Imperium CTA
    await page.getByRole("button", { name: /IMPERIUM LUMEN/i }).click();
    const scope = page.locator('[data-dna="01-imperium-lumen"]').first();
    await expect(scope).toBeVisible();
    await expect(scope.locator(".btn-chamfer").first()).toBeVisible();

    await page.getByRole("tab", { name: "7-WORLD AUDIT GRID" }).click();
    await expect(page.getByText("ALL PASS")).toHaveCount(7);
  });

  test("preserves Chronicle Events default in /dock and opens Canon Lore Archive tab", async ({
    page,
  }) => {
    await page.route("**/api/v1/timeline/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/timeline/stats")) {
        await route.fulfill({ json: { data: { total: 0, byEra: {}, byKind: {} } } });
        return;
      }
      if (path.endsWith("/timeline/eras")) {
        await route.fulfill({ json: { data: [] } });
        return;
      }
      await route.fulfill({ json: { data: [], total: 0 } });
    });

    await page.goto("/dock");
    await expect(page.getByRole("tab", { name: "CHRONICLE EVENTS" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.getByRole("tab", { name: "CANON LORE ARCHIVE" }).click();
    await expect(page.getByText("DISCLOSED #014 NUMBER CONFLICT")).toBeVisible();
    await expect(page.getByText("FAMILY WITHOUT FEAR").first()).toBeVisible();
    await expect(page.getByText("THE WRONG WAY — HELLROAD").first()).toBeVisible();
  });

  test("expands WINGS 10 and DHGS 13-step matrix on /mission-control", async ({ page }) => {
    await page.goto("/mission-control");
    const toggle = page.getByRole("button", { name: "OPEN STEWARDSHIP MATRIX" });
    await toggle.click();
    await expect(page.getByText(/SKYLINK/i).first()).toBeVisible();
    await expect(page.getByText("DHGS 13-STEP ASSURANCE LOOP (RECEIVE → LEARN)")).toBeVisible();

    const overflowCount = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("[data-wing-card]"));
      return cards.filter((c) => c.scrollWidth > c.clientWidth + 1).length;
    });
    expect(overflowCount).toBe(0);
  });
});
