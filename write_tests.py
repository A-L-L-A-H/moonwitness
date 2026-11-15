import os

test_file = r"Z:\\repo\\isrockfeel\\moonwitness\\apps\\web\\e2e\\operations-routes.spec.ts"

new_tests = """

// ============================================================
// ADDED: Accessibility & Regression Coverage (MW-0016 #105)
// ============================================================

test.describe(\"Navigation & Active-Route\", () => {
  const routes = [
    { path: \"/control\", breadcrumb: \"Control Center\" },
    { path: \"/vpn\", breadcrumb: \"VPN\" },
    { path: \"/syslog\", breadcrumb: \"Syslog\" },
    { path: \"/snmp\", breadcrumb: \"SNMP\" },
    { path: \"/storage\", breadcrumb: \"Storage\" },
    { path: \"/radius\", breadcrumb: \"RADIUS\" },
  ];

  for (const { path, breadcrumb } of routes) {
    test(`${path} shows breadcrumb and sidebar highlight`, async ({ page }) => {
      await page.route(\"**/api/v1/control/auth/me\", async (route) => {
        await route.fulfill({
          json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } },
        });
      });
      // stub child APIs to avoid 404 noise
      await page.route(\"**/api/v1/**\", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.goto(path);
      await expect(page.getByRole(\"link\", { name: breadcrumb })).toHaveAttribute(\"aria-current\", \"page\");
      await expect(page.getByRole(\"navigation\").getByRole(\"link\", { name: breadcrumb })).toHaveClass(/active|selected/);
    });
  }
});

test.describe(\"Keyboard Navigation & Focus\", () => {
  test(\"Syslog page has logical tab order and visible focus styles\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/syslog/**\", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto(\"/syslog\");

    // Tab through focusable elements
    await page.keyboard.press(\"Tab\");
    let focused = await page.locator(\":focus\").first();
    await expect(focused).toBeVisible();

    // Focus should land on first interactive element (search input or filter)
    const firstFocusable = page.getByLabel(\"Message search\").or(page.getByLabel(\"Severity\")).first();
    await expect(firstFocusable).toBeFocused();

    // Verify visible focus ring (not outline: none)
    const focusStyles = await firstFocusable.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return { outline: styles.outline, outlineWidth: styles.outlineWidth, boxShadow: styles.boxShadow };
    });
    const hasVisibleFocus = focusStyles.outline !== \"none\" || focusStyles.boxShadow !== \"none\";
    expect(hasVisibleFocus).toBe(true);
  });
});

test.describe(\"Reduced Motion\", () => {
  const routes = [\"/control\", \"/vpn\", \"/syslog\", \"/snmp\", \"/storage\", \"/radius\"];

  for (const path of routes) {
    test(`${path} respects prefers-reduced-motion`, async ({ page }) => {
      await page.route(\"**/api/v1/control/auth/me\", async (route) => {
        await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
      });
      await page.route(\"**/api/v1/**\", async (route) => {
        await route.fulfill({ json: [] });
      });

      await page.emulateMedia({ reducedMotion: \"reduce\" });
      await page.goto(path);

      // Check that CSS transitions/animations are disabled or instant
      const animatedElements = page.locator(\"*\").filter({ hasNot: page.locator(\"script, style\") });
      const count = await animatedElements.count();
      // At minimum, verify no layout-shifting animations run
      await expect(page).not.toHaveCSS(\"animation-duration\", /[0-9.]+s/);
    });
  }
});

test.describe(\"ARIA Live Regions & Accessible Status\", () => {
  test(\"Syslog announces loading state via role=status\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });

    let resolveRoute = (value) => { };
    const routePromise = new Promise((resolve) => { resolveRoute = resolve; });

    await page.route(\"**/api/v1/syslog/messages**\", async (route) => {
      await routePromise;
      await route.fulfill({ json: [] });
    });

    await page.goto(\"/syslog\");

    // Verify loading status region exists and is announced
    const statusRegion = page.getByRole(\"status\");
    await expect(statusRegion).toBeVisible();
    await expect(statusRegion).toContainText(/loading|memuat/i);

    // Resolve the route to complete loading
    resolveRoute(undefined);
    await page.waitForLoadState(\"networkidle\");

    // Status should update to empty/ready state
    await expect(statusRegion).not.toContainText(/loading|memuat/i);
  });

  test(\"Empty state is announced for SNMP devices\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/snmp/stats\", async (route) => {
      await route.fulfill({ json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 } });
    });
    await page.route(\"**/api/v1/snmp/devices\", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto(\"/snmp\");
    await expect(page.getByText(\"No SNMP devices are configured.\")).toBeVisible();
    const emptyAnnouncement = page.getByRole(\"status\").or(page.getByRole(\"alert\"));
    await expect(emptyAnnouncement).toContainText(/no|tidak ada/i);
  });

  test(\"Error state is announced for failed API calls\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/syslog/messages**\", async (route) => {
      await route.fulfill({ status: 500, json: { error: \"Internal Server Error\" } });
    });

    await page.goto(\"/syslog\");
    const errorAnnouncement = page.getByRole(\"alert\");
    await expect(errorAnnouncement).toBeVisible();
    await expect(errorAnnouncement).toContainText(/error|gagal|kesalahan/i);
  });

  test(\"Denied state is announced for unauthorized mutations\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"viewer\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/radius/users\", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route(\"**/api/v1/radius/users\", async (route) => {
      if (route.request().method() === \"POST\") {
        await route.fulfill({ status: 403, json: { error: \"Forbidden\" } });
      }
    });

    await page.goto(\"/radius\");
    // Viewer should see denied message
    await expect(page.getByText(/cannot manage|tidak dapat mengelola|denied|ditolak/i)).toBeVisible();
  });
});

test.describe(\"Viewport - No Horizontal Overflow\", () => {
  const viewports = [
    { name: \"mobile\", width: 390, height: 844 },
    { name: \"tablet\", width: 768, height: 1024 },
    { name: \"desktop\", width: 1440, height: 900 },
  ];

  const routes = [\"/control\", \"/vpn\", \"/syslog\", \"/snmp\", \"/storage\", \"/radius\"];

  for (const vp of viewports) {
    for (const path of routes) {
      test(`${vp.name} ${vp.width}px - ${path} no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.route(\"**/api/v1/control/auth/me\", async (route) => {
          await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
        });
        await page.route(\"**/api/v1/**\", async (route) => {
          await route.fulfill({ json: [] });
        });

        await page.goto(path);

        // Check body scroll width does not exceed viewport
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(vp.width + 1); // +1px tolerance for scrollbar

        // Also check html element
        const htmlScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(htmlScrollWidth).toBeLessThanOrEqual(vp.width + 1);
      });
    }
  }
});

test.describe(\"Mutation Failure States\", () => {
  test(\"SNMP device creation shows error toast on API failure\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/snmp/stats\", async (route) => {
      await route.fulfill({ json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 } });
    });
    await page.route(\"**/api/v1/snmp/devices\", async (route) => {
      if (route.request().method() === \"POST\") {
        await route.fulfill({ status: 500, json: { error: \"Database error\" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto(\"/snmp\");
    await page.getByRole(\"button\", { name: \"Add device\" }).click();
    await page.getByLabel(\"Name\").fill(\"Test Device\");
    await page.getByLabel(\"Host\").fill(\"192.0.2.1\");
    await page.getByRole(\"button\", { name: \"Create device\" }).click();

    await expect(page.getByRole(\"alert\").or(page.getByText(/error|gagal|failed/i))).toBeVisible();
  });

  test(\"RADIUS user creation shows error toast on API failure\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/radius/users\", async (route) => {
      if (route.request().method() === \"POST\") {
        await route.fulfill({ status: 500, json: { error: \"Duplicate username\" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto(\"/radius\");
    await page.getByRole(\"button\", { name: \"Add user\" }).click();
    await page.getByLabel(\"Username\").fill(\"testuser\");
    await page.getByLabel(\"Password\").fill(\"password123\");
    await page.getByRole(\"button\", { name: \"Create user\" }).click();

    await expect(page.getByRole(\"alert\").or(page.getByText(/error|gagal|failed|duplicate/i))).toBeVisible();
  });

  test(\"Storage mutation failure shows error state\", async ({ page }) => {
    await page.route(\"**/api/v1/control/auth/me\", async (route) => {
      await route.fulfill({ json: { user: { id: \"1\", name: \"Operator\", email: \"op@test\", role: \"admin\", created_at: \"2026-01-01T00:00:00Z\" } } });
    });
    await page.route(\"**/api/v1/storage/**\", async (route) => {
      if (route.request().method() !== \"GET\") {
        await route.fulfill({ status: 500, json: { error: \"Storage backend unavailable\" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto(\"/storage\");
    // Attempt any mutation if available (e.g., create bucket, upload)
    const createBtn = page.getByRole(\"button\", { name: /create|add|upload/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await expect(page.getByRole(\"alert\").or(page.getByText(/error|gagal|failed|unavailable/i))).toBeVisible();
    }
  });
});
"""

with open(test_file, "r", encoding="utf-8") as f:
    content = f.read()

# Append new tests
with open(test_file, "w", encoding="utf-8") as f:
    f.write(content + new_tests)

print(f"Appended new tests to {test_file}")
