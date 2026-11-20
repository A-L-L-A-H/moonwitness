import { test, expect, type Page } from "@playwright/test";

async function mockChronicleApi(page: Page): Promise<void> {
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/api/v1/auth/me")) {
      return route.fulfill({
        status: 200,
        json: {
          user: {
            id: "chronicle-e2e",
            displayName: "Chronicle QA",
            username: "chronicle-qa",
            role: "admin",
          },
        },
      });
    }
    return route.fulfill({ json: { data: [], total: 0 } });
  });
}

test.describe("Chronicle navigation & search localization", () => {
  test("desktop locale selector switches EN -> ID -> AR on /[lang]/moonwitness preserving query and hash", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/moonwitness?view=grid#signals");

    const switcher = page.getByRole("group", { name: "Switch Language" });
    await expect(switcher.getByRole("button", { name: "EN", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await switcher.getByRole("button", { name: "ID", exact: true }).click();
    await expect(page).toHaveURL(/\/id\/moonwitness\?view=grid#signals$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "BERANDA" }),
    ).toBeVisible();

    await page
      .getByRole("group", { name: "Ganti Bahasa" })
      .getByRole("button", { name: "AR", exact: true })
      .click();
    await expect(page).toHaveURL(/\/ar\/moonwitness\?view=grid#signals$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "الرئيسية" }),
    ).toBeVisible();
  });

  test("SearchDialog submits localized /ar/dock?q= route on /ar/moonwitness", async ({ page }) => {
    await mockChronicleApi(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ar/moonwitness");

    await page.getByRole("button", { name: "ابحث في الأرشيف" }).click();
    const dialog = page.getByRole("dialog", { name: "ابحث في الأرشيف" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox", { name: "ابحث في الإشارات" }).fill("moon signal");
    await dialog.getByRole("button", { name: "انطلق" }).click();

    await expect(page).toHaveURL(/\/ar\/dock\?/);
    expect(new URL(page.url()).searchParams.get("q")).toBe("moon signal");
  });

  test("mobile menu locale selector switches locale cleanly on /[lang]/moonwitness", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/id/moonwitness");

    const toggle = page.getByRole("button", { name: "Buka menu" });
    await toggle.click();

    const mobileNav = page.getByRole("navigation", { name: "Mobile", exact: true });
    await expect(mobileNav.getByRole("link", { name: "BERANDA", exact: true })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "SINYAL", exact: true })).toBeVisible();

    const arButton = mobileNav.getByRole("button", { name: "AR", exact: true });
    const box = await arButton.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await arButton.click();
    await expect(page).toHaveURL(/\/ar\/moonwitness$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("unprefixed /moonwitness updates locale in place and keeps /dock?q= search path", async ({
    page,
  }) => {
    await mockChronicleApi(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/moonwitness");

    await page
      .getByRole("group", { name: "Switch Language" })
      .getByRole("button", { name: "ID", exact: true })
      .click();

    await expect(page).toHaveURL(/\/moonwitness$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "BERANDA" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cari di arsip" }).click();
    const dialog = page.getByRole("dialog", { name: "Cari di arsip" });
    await dialog.getByRole("textbox", { name: "CARI SINYAL" }).fill("signal / moon");
    await dialog.getByRole("button", { name: "CARI" }).click();

    await expect(page).toHaveURL(/\/dock\?/);
    expect(new URL(page.url()).pathname).toBe("/dock");
    expect(new URL(page.url()).searchParams.get("q")).toBe("signal / moon");
  });
});
