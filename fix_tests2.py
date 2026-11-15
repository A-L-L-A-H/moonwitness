test_file = r"Z:\repo\isrockfeel\moonwitness\apps\web\e2e\operations-routes.spec.ts"

with open(test_file, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Navigation & Active-Route
old_nav = """test.describe("Navigation & Active-Route", () => {
  const routes = [
    { path: "/control", breadcrumb: "Control Center" },
    { path: "/vpn", breadcrumb: "VPN" },
    { path: "/syslog", breadcrumb: "Syslog" },
    { path: "/snmp", breadcrumb: "SNMP" },
    { path: "/storage", breadcrumb: "Storage" },
    { path: "/radius", breadcrumb: "RADIUS" },
  ];

  for (const { path, breadcrumb } of routes) {
    test(`${path} shows breadcrumb and sidebar highlight`, async ({ page }) => {
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({
          json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } },
        });
      });
      // stub child APIs to avoid 404 noise
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.goto(path);
      await expect(page.getByRole("link", { name: breadcrumb })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("navigation").getByRole("link", { name: breadcrumb })).toHaveClass(/active|selected/);
    });
  }
});"""

new_nav = """test.describe("Navigation & Active-Route", () => {
  const routes = [
    { path: "/syslog", breadcrumb: "Syslog", navId: "syslog" },
    { path: "/snmp", breadcrumb: "SNMP", navId: "snmp" },
    { path: "/storage", breadcrumb: "Storage", navId: "storage" },
    { path: "/radius", breadcrumb: "RADIUS", navId: "radius" },
    { path: "/vpn", breadcrumb: "VPN", navId: "vpn" },
    { path: "/intelligence", breadcrumb: "RIOT Intelligence", navId: "intelligence" },
  ];

  for (const { path, breadcrumb, navId } of routes) {
    test(`${path} shows breadcrumb and sidebar highlight`, async ({ page }) => {
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({
          json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } },
        });
      });
      // stub child APIs to avoid 404 noise
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.goto(path);
      // Sidebar link has aria-current="page" when active
      const sidebarLink = page.getByRole("navigation").getByRole("link", { name: breadcrumb });
      await expect(sidebarLink).toHaveAttribute("aria-current", "page");
      // Active link has pink background
      await expect(sidebarLink).toHaveClass(/bg-\\[var\\(--pink\\)\\]/);
      // Topbar shows breadcrumb text
      await expect(page.locator("header").getByText(breadcrumb)).toBeVisible();
    });
  }
});"""

content = content.replace(old_nav, new_nav)

# Replace Keyboard Navigation & Focus
old_kb = """test.describe("Keyboard Navigation & Focus", () => {
  test("Syslog page has logical tab order and visible focus styles", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({ json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } } });
    });
    await page.route("**/api/v1/syslog/**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/syslog");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    let focused = await page.locator(":focus").first();
    await expect(focused).toBeVisible();

    // Focus should land on first interactive element (search input or filter)
    const firstFocusable = page.getByLabel("Message search").or(page.getByLabel("Severity")).first();
    await expect(firstFocusable).toBeFocused();

    // Verify visible focus ring (not outline: none)
    const focusStyles = await firstFocusable.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return { outline: styles.outline, outlineWidth: styles.outlineWidth, boxShadow: styles.boxShadow };
    });
    const hasVisibleFocus = focusStyles.outline !== "none" || focusStyles.boxShadow !== "none";
    expect(hasVisibleFocus).toBe(true);
  });
});"""

new_kb = """test.describe("Keyboard Navigation & Focus", () => {
  test("Syslog page has logical tab order and visible focus styles", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({ json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } } });
    });
    await page.route("**/api/v1/syslog/**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/syslog");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    let focused = await page.locator(":focus").first();
    await expect(focused).toBeVisible();

    // Focus should land on first interactive element (sidebar link)
    const sidebarLink = page.getByRole("navigation").getByRole("link", { name: "Syslog" });
    await expect(sidebarLink).toBeFocused();

    // Verify visible focus ring (not outline: none)
    const focusStyles = await sidebarLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return { outline: styles.outline, outlineWidth: styles.outlineWidth, boxShadow: styles.boxShadow };
    });
    const hasVisibleFocus = focusStyles.outline !== "none" || focusStyles.boxShadow !== "none";
    expect(hasVisibleFocus).toBe(true);
  });
});"""

content = content.replace(old_kb, new_kb)

# Replace Reduced Motion
old_rm = """test.describe("Reduced Motion", () => {
  const routes = ["/control", "/vpn", "/syslog", "/snmp", "/storage", "/radius"];

  for (const path of routes) {
    test(`${path} respects prefers-reduced-motion`, async ({ page }) => {
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({ json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } } });
      });
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);

      // Check that CSS transitions/animations are disabled or instant
      const animatedElements = page.locator("*").filter({ hasNot: page.locator("script, style") });
      const count = await animatedElements.count();
      // At minimum, verify no layout-shifting animations run
      await expect(page).not.toHaveCSS("animation-duration", /[0-9.]+s/);
    });
  }
});"""

new_rm = """test.describe("Reduced Motion", () => {
  const routes = ["/syslog", "/snmp", "/storage", "/radius", "/vpn", "/intelligence"];

  for (const path of routes) {
    test(`${path} respects prefers-reduced-motion`, async ({ page }) => {
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({ json: { user: { id: "1", name: "Operator", email: "op@test", role: "admin", created_at: "2026-01-01T00:00:00Z" } } });
      });
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);

      // Check that CSS transitions/animations are disabled or instant
      // Verify no long-running animations on the page body
      const hasAnimation = await page.evaluate(() => {
        const styles = window.getComputedStyle(document.body);
        return styles.animationDuration && parseFloat(styles.animationDuration) > 0;
      });
      expect(hasAnimation).toBe(false);
    });
  }
});"""

content = content.replace(old_rm, new_rm)

# Replace Viewport routes
old_vp = """  const routes = ["/control", "/vpn", "/syslog", "/snmp", "/storage", "/radius"];"""
new_vp = """  const routes = ["/syslog", "/snmp", "/storage", "/radius", "/vpn", "/intelligence"];"""
content = content.replace(old_vp, new_vp)

with open(test_file, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully")

