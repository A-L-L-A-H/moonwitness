test_file = r"Z:\repo\isrockfeel\moonwitness\apps\web\e2e\operations-routes.spec.ts"

with open(test_file, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Navigation & Active-Route with correct sidebar labels
old_nav = """test.describe("Navigation & Active-Route", () => {
  const routes = [
    { path: "/syslog", breadcrumb: "Syslog Explorer", navId: "syslog" },
    { path: "/snmp", breadcrumb: "SNMP Monitor", navId: "snmp" },
    { path: "/storage", breadcrumb: "Storage Browser", navId: "storage" },
    { path: "/radius", breadcrumb: "RADIUS Console", navId: "radius" },
    { path: "/vpn", breadcrumb: "Network", navId: "vpn" },
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
      const sidebarLink = page.getByRole("navigation").getByRole("link", { name: navId === "vpn" ? "VPN" : breadcrumb });
      await expect(sidebarLink).toHaveAttribute("aria-current", "page");
      // Active link has pink background
      await expect(sidebarLink).toHaveClass(/bg-\\[var\\(--pink\\)\\]/);
      // Topbar shows breadcrumb text
      await expect(page.locator("header").getByText(breadcrumb)).toBeVisible();
    });
  }
});"""

new_nav = """test.describe("Navigation & Active-Route", () => {
  const routes = [
    { path: "/syslog", sidebarLabel: "Syslog", breadcrumb: "Syslog Explorer" },
    { path: "/snmp", sidebarLabel: "SNMP", breadcrumb: "SNMP Monitor" },
    { path: "/storage", sidebarLabel: "Storage", breadcrumb: "Storage Browser" },
    { path: "/radius", sidebarLabel: "RADIUS", breadcrumb: "RADIUS Console" },
    { path: "/vpn", sidebarLabel: "VPN", breadcrumb: "Network" },
    { path: "/intelligence", sidebarLabel: "RIOT Intelligence", breadcrumb: "RIOT Intelligence" },
  ];

  for (const { path, sidebarLabel, breadcrumb } of routes) {
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
      const sidebarLink = page.getByRole("navigation").getByRole("link", { name: sidebarLabel });
      await expect(sidebarLink).toHaveAttribute("aria-current", "page");
      // Active link has pink background
      await expect(sidebarLink).toHaveClass(/bg-\\[var\\(--pink\\)\\]/);
      // Topbar shows breadcrumb text
      await expect(page.locator("header").getByText(breadcrumb)).toBeVisible();
    });
  }
});"""

content = content.replace(old_nav, new_nav)

with open(test_file, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully")

