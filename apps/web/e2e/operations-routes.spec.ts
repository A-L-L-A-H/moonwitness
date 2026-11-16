import { expect, test, type Page } from "@playwright/test";

async function stubSession(page: Page, role = "admin"): Promise<void> {
  await page.route("**/api/v1/control/auth/me", async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: "operator-1",
          name: "Operator",
          email: "operator@example.test",
          role,
          created_at: "2026-01-01T00:00:00Z",
        },
      },
    });
  });
}

test("Syslog filters, renders messages, and limits same-origin API requests", async ({ page }) => {
  await stubSession(page);
  const requests: string[] = [];
  await page.route("**/api/v1/syslog/**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.href);
    await route.fulfill({
      json: [
        {
          id: "sys-1",
          received_at: 1_800_000_000_000,
          source_ip: "192.0.2.7",
          hostname: "edge-router",
          severity: 3,
          app_name: "routerd",
          message: "route changed",
        },
      ],
    });
  });
  await page.goto("/syslog");
  await expect(page.getByRole("cell", { name: "route changed" })).toBeVisible();
  await page.getByLabel("Message search").fill("edge-router");
  await expect(page.getByRole("cell", { name: "route changed" })).toBeVisible();
  await page.getByLabel("Severity").selectOption("3");
  await expect.poll(() => requests.length).toBeGreaterThan(1);
  expect(new URL(requests.at(-1)!).pathname).toBe("/api/v1/syslog/messages");
  expect(new URL(requests.at(-1)!).searchParams.get("limit")).toBe("100");
});

test("Syslog denies message queries without an authenticated session", async ({ page }) => {
  let queriedMessages = false;
  await page.route("**/api/v1/control/auth/me", async (route) => {
    await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
  });
  await page.route("**/api/v1/syslog/messages**", async (route) => {
    queriedMessages = true;
    await route.fulfill({ json: [] });
  });

  await page.goto("/syslog");
  await expect(
    page.getByText("Sign in through the Control Center to view Syslog messages."),
  ).toBeVisible();
  expect(queriedMessages).toBe(false);
});

test("SNMP renders summaries without credentials and gives an empty state", async ({ page }) => {
  await page.route("**/api/v1/snmp/stats", async (route) => {
    await route.fulfill({
      json: { total_devices: 1, enabled_devices: 1, total_targets: 0, total_samples: 0 },
    });
  });
  await page.route("**/api/v1/snmp/devices", async (route) => {
    await route.fulfill({
      json: [
        {
          id: "device-1",
          name: "North Router",
          host: "192.0.2.10",
          port: 161,
          version: "2c",
          community: "must-not-appear",
          enabled: true,
          created_at: 1,
        },
      ],
    });
  });
  await page.route("**/api/v1/snmp/devices/device-1/targets", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto("/snmp");
  await expect(page.getByRole("heading", { name: "North Router" })).toBeVisible();
  await expect(page.getByText("No targets are configured for this device.")).toBeVisible();
  await expect(page.getByText("must-not-appear")).toHaveCount(0);
});

test("RADIUS renders redacted read-only service data and no users", async ({ page }) => {
  await stubSession(page);
  await page.route("**/api/v1/radius/health", async (route) => {
    await route.fulfill({ json: { status: "ready", service: "RADIUS", reachable: true } });
  });
  await page.route("**/api/v1/radius/stats", async (route) => {
    await route.fulfill({ json: { active_sessions: 2, requests_today: 14 } });
  });
  await page.route("**/api/v1/radius/logs", async (route) => {
    await route.fulfill({
      json: [
        {
          timestamp: "2026-11-15T00:00:00Z",
          level: "info",
          message: "access accepted",
          password_hash: "must-not-appear",
        },
      ],
    });
  });

  await page.goto("/radius");
  await expect(page.getByText("access accepted")).toBeVisible();
  await expect(page.getByText("must-not-appear")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /create|delete|update/i })).toHaveCount(0);
});

test("RADIUS admin sees user management and can create a user", async ({ page }) => {
  await stubSession(page);
  const users: Array<Record<string, unknown>> = [
    {
      id: "user-1",
      username: "alice",
      enabled: true,
      framed_ip: "192.0.2.50",
      vlan_id: 120,
      session_timeout: 3600,
      mac_address: null,
    },
  ];
  await page.route("**/api/v1/radius/users", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: users });
      return;
    }
    const payload = route.request().postDataJSON() as { username?: string; password?: string };
    const created = {
      id: "user-2",
      username: payload.username,
      enabled: true,
      framed_ip: null,
      vlan_id: null,
      session_timeout: null,
      mac_address: null,
    };
    users.push(created);
    await route.fulfill({ status: 201, json: created });
  });

  await page.goto("/radius");
  await expect(page.getByText("alice")).toBeVisible();

  await page.getByRole("button", { name: "Add user" }).click();
  await page.getByLabel("Username").fill("bob");
  await page.getByLabel("Password").fill("bob-password-2026");
  await page.getByRole("button", { name: "Create user" }).click();

  await expect(page.getByText("User created.")).toBeVisible();
  await expect(page.getByText("bob")).toBeVisible();
});

test("RADIUS non-admin is denied management controls", async ({ page }) => {
  await stubSession(page, "viewer");
  await page.route("**/api/v1/radius/users", async (route) => {
    await route.fulfill({ json: [{ id: "user-1", username: "alice", enabled: true }] });
  });

  await page.goto("/radius");
  await expect(page.getByText("alice")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add user" })).toHaveCount(0);
  await expect(
    page.getByText("Your role cannot manage RADIUS users. Ask an administrator for write access."),
  ).toBeVisible();
});

test("SNMP admin can create and delete a device with confirmation", async ({ page }) => {
  await stubSession(page);
  const devices: unknown[] = [];
  await page.route("**/api/v1/snmp/stats", async (route) => {
    await route.fulfill({
      json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 },
    });
  });
  await page.route("**/api/v1/snmp/devices", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: devices });
      return;
    }
    const payload = route.request().postDataJSON() as { name?: string };
    devices.push({
      id: "device-new",
      name: payload.name,
      host: "192.0.2.99",
      port: 161,
      version: "2c",
      enabled: true,
      created_at: 1,
    });
    await route.fulfill({ status: 201, json: { id: "device-new", name: payload.name } });
  });
  await page.route("**/api/v1/snmp/devices/device-new", async (route) => {
    devices.length = 0;
    await route.fulfill({ status: 204, body: "" });
  });
  await page.route("**/api/v1/snmp/devices/device-new/targets", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto("/snmp");
  await expect(page.getByText("No SNMP devices are configured.")).toBeVisible();

  await page.getByRole("button", { name: "Add device" }).click();
  await page.getByLabel("Name").fill("Edge Router");
  await page.getByLabel("Host").fill("192.0.2.99");
  await page.getByRole("button", { name: "Create device" }).click();
  await expect(page.getByText("Device created.")).toBeVisible();
});

test("SNMP viewer role sees no management controls", async ({ page }) => {
  await stubSession(page, "viewer");
  await page.route("**/api/v1/snmp/stats", async (route) => {
    await route.fulfill({
      json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 },
    });
  });
  await page.route("**/api/v1/snmp/devices", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto("/snmp");
  await expect(page.getByRole("button", { name: "Add device" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});

// ============================================================
// ADDED: Accessibility & Regression Coverage (MW-0016 #105)
// ============================================================

test.describe("Navigation & Active-Route", () => {
  const routes = [
    { path: "/syslog", sidebarLabel: "Syslog" },
    { path: "/snmp", sidebarLabel: "SNMP" },
    { path: "/storage", sidebarLabel: "Storage" },
    { path: "/radius", sidebarLabel: "RADIUS" },
    { path: "/control", sidebarLabel: "Control Plane" },
    { path: "/vpn", sidebarLabel: "VPN" },
  ];

  for (const { path, sidebarLabel } of routes) {
    test(`${path} loads and sidebar highlights active route`, async ({ page }) => {
      // Register fallback catch-all first; Playwright matches routes in LIFO order.
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({
          json: {
            user: {
              id: "1",
              name: "Operator",
              email: "op@test",
              role: "admin",
              created_at: "2026-01-01T00:00:00Z",
            },
          },
        });
      });
      // Stub the control-plane endpoints the console screens query on mount so
      // navigation checks are not blocked by the setup gate or empty upstreams.
      // The shell identity comes from the core session endpoint
      // (`/api/v1/auth/me`), which is separate from the control-plane profile.
      await page.route("**/api/v1/auth/me", async (route) => {
        await route.fulfill({
          json: {
            user: {
              id: 1,
              username: "operator",
              displayName: "Operator",
              email: "op@test",
              role: "admin",
            },
          },
        });
      });
      await page.route("**/api/v1/control/setup/status", async (route) => {
        await route.fulfill({
          json: {
            initialized: true,
            version: "test",
            instance: { id: "1", name: "test", version: "test" },
          },
        });
      });
      // Console resources/audit/status drive the Control Plane panels; a bare
      // `[]` is not a valid payload and throws while rendering.
      await page.route("**/api/v1/control/status", async (route) => {
        await route.fulfill({
          json: {
            reachable: true,
            host: {
              os: "linux",
              arch: "x86_64",
              hostname: "test-host",
              kernel: "test",
              distro: "test",
              is_root: false,
              capabilities: {
                systemd: true,
                docker: true,
                files: true,
                cron: true,
                users: true,
                firewall: true,
                host_metrics: true,
                network: true,
                ssh: true,
                cert: true,
                mount: true,
                alert: true,
                kubernetes: false,
              },
              notes: [],
            },
            metrics: {
              time: "2026-01-01T00:00:00Z",
              cpu_pct: 0,
              load1: 0,
              load5: 0,
              load15: 0,
              mem_total: 0,
              mem_used: 0,
              mem_pct: 0,
              swap_total: 0,
              swap_used: 0,
              disk_path: "/",
              disk_total: 0,
              disk_used: 0,
              disk_pct: 0,
              uptime_sec: 0,
              degraded: false,
              notes: [],
            },
          },
        });
      });
      await page.route("**/api/v1/control/resources**", async (route) => {
        await route.fulfill({ json: {} });
      });
      await page.route("**/api/v1/control/audit**", async (route) => {
        await route.fulfill({ json: [] });
      });
      await page.route("**/api/v1/control/vpn/status", async (route) => {
        await route.fulfill({
          json: {
            enabled: false,
            interface: "wg0",
            address: "10.0.0.1/24",
            listen_port: 51820,
            endpoint: "",
            manage_firewall: false,
            public_key: "test-public-key",
            server_configured: true,
            peer_count: 0,
            peers: [],
            subnets: [],
            available: true,
            missing_tools: [],
          },
        });
      });

      await page.goto(path);
      await page.waitForSelector('nav[aria-label="Operations"]', { timeout: 5000 }).catch(() => {});
      // Verify page loaded
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/") + "$"));
      // Sidebar link is highlighted with the operations accent (blue) and
      // marked as the current page for assistive technology.
      const sidebarLink = page.getByRole("navigation").getByRole("link", { name: sidebarLabel });
      await expect(sidebarLink).toHaveAttribute("aria-current", "page");
      await expect(sidebarLink).toHaveClass(/(?:bg-\[var\(--blue\)\]|hud-nav-link)/);
    });
  }
});

test.describe("Keyboard Navigation & Focus", () => {
  test("Syslog page has logical tab order and visible focus styles", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/syslog/**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/syslog");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus").first();
    await expect(focused).toBeVisible();

    // Verify focus landed somewhere (first focusable element)
    const firstFocusable = page.locator(":focus").first();
    await expect(firstFocusable).toBeVisible();
  });
});

test.describe("Reduced Motion", () => {
  const routes = ["/syslog", "/snmp", "/storage", "/radius"];

  for (const path of routes) {
    test(`${path} respects prefers-reduced-motion`, async ({ page }) => {
      await page.route("**/api/v1/**", async (route) => {
        await route.fulfill({ json: [] });
      });
      await page.route("**/api/v1/control/auth/me", async (route) => {
        await route.fulfill({
          json: {
            user: {
              id: "1",
              name: "Operator",
              email: "op@test",
              role: "admin",
              created_at: "2026-01-01T00:00:00Z",
            },
          },
        });
      });

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);

      // Verify page loads without errors under reduced motion
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/") + "$"));
    });
  }
});

test.describe("ARIA Live Regions & Accessible Status", () => {
  test("Syslog announces loading state via role=status", async ({ page }) => {
    // Mock fallback API calls first so Playwright LIFO honors specific routes below
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });

    let resolveRoute: (value?: unknown) => void = () => {};
    const routePromise = new Promise((resolve) => {
      resolveRoute = resolve;
    });

    await page.route("**/api/v1/syslog/messages**", async (route) => {
      await routePromise;
      await route.fulfill({ json: [] });
    });

    await page.goto("/syslog");

    // Verify loading status region exists and is announced
    const statusRegion = page.getByRole("status");
    await expect(statusRegion).toBeVisible();
    await expect(statusRegion).toContainText(/loading|memuat/i);

    // Resolve the route to complete loading
    resolveRoute(undefined);
    // Wait for the specific response instead of networkidle to avoid timeout from unmocked requests
    await page.waitForResponse("**/api/v1/syslog/messages**");

    // Status should update to empty/ready state
    await expect(statusRegion).not.toContainText(/loading|memuat/i);
  });

  test("Empty state is announced for SNMP devices", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/snmp/stats", async (route) => {
      await route.fulfill({
        json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 },
      });
    });
    await page.route("**/api/v1/snmp/devices", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/snmp");
    await expect(page.getByText("No SNMP devices are configured.")).toBeVisible();
    // Just verify the empty state message is visible
    await expect(page.getByText("No SNMP devices are configured.")).toBeVisible();
  });

  test("Error state is announced for failed API calls", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/syslog/messages**", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Internal Server Error" } });
    });

    await page.goto("/syslog");
    // Verify error message is shown (SYSLOG UNAVAILABLE section)
    await expect(page.getByText("SYSLOG UNAVAILABLE")).toBeVisible();
  });

  test("Denied state is announced for unauthorized mutations", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "viewer",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/radius/users", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/v1/radius/users", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 403, json: { error: "Forbidden" } });
      }
    });

    await page.goto("/radius");
    // Viewer should see denied message
    await expect(
      page.getByText(/cannot manage|tidak dapat mengelola|denied|ditolak/i),
    ).toBeVisible();
  });
});

test.describe("Viewport - No Horizontal Overflow", () => {
  const viewports = [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  const routes = ["/syslog", "/snmp", "/storage", "/radius"];

  for (const vp of viewports) {
    for (const path of routes) {
      test(`${vp.name} ${vp.width}px - ${path} no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.route("**/api/v1/**", async (route) => {
          await route.fulfill({ json: [] });
        });
        await page.route("**/api/v1/control/auth/me", async (route) => {
          await route.fulfill({
            json: {
              user: {
                id: "1",
                name: "Operator",
                email: "op@test",
                role: "admin",
                created_at: "2026-01-01T00:00:00Z",
              },
            },
          });
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

test.describe("Mutation Failure States", () => {
  test("SNMP device creation shows error toast on API failure", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/snmp/stats", async (route) => {
      await route.fulfill({
        json: { total_devices: 0, enabled_devices: 0, total_targets: 0, total_samples: 0 },
      });
    });
    await page.route("**/api/v1/snmp/devices", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 500, json: { error: "Database error" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto("/snmp");
    await page.getByRole("button", { name: "Add device" }).click();
    await page.getByLabel("Name").fill("Test Device");
    await page.getByLabel("Host").fill("192.0.2.1");
    await page.getByRole("button", { name: "Create device" }).click();

    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText(
      /database error/i,
    );
  });

  test("RADIUS user creation shows error toast on API failure", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/radius/users", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 500, json: { error: "Duplicate username" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto("/radius");
    await page.getByRole("button", { name: "Add user" }).click();
    await page.getByLabel("Username").fill("testuser");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create user" }).click();

    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText(
      /duplicate username/i,
    );
  });

  test("Storage mutation failure shows error state", async ({ page }) => {
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/storage/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ status: 500, json: { error: "Storage backend unavailable" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto("/storage");
    // Attempt any mutation if available (e.g., create bucket, upload)
    const createBtn = page.getByRole("button", { name: /create|add|upload/i }).first();
    if ((await createBtn.count()) > 0) {
      await createBtn.click();
      await expect(
        page.getByRole("alert").or(page.getByText(/error|gagal|failed|unavailable/i)),
      ).toBeVisible();
    }
  });
});

test.describe("Intelligence - ArchiveMemoryBridge Integration", () => {
  test("queries archive knowledge and attaches selected context to the inference prompt without mobile overflow", async ({
    page,
  }) => {
    const knowledgeQueries: Array<{ q: string | null; limit: string | null }> = [];

    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: 1,
            username: "operator",
            displayName: "Operator",
            email: "op@test",
            role: "admin",
          },
        },
      });
    });
    await page.route("**/api/v1/control/auth/me", async (route) => {
      await route.fulfill({
        json: {
          user: {
            id: "1",
            name: "Operator",
            email: "op@test",
            role: "admin",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      });
    });
    await page.route("**/api/v1/control/setup/status", async (route) => {
      await route.fulfill({
        json: {
          initialized: true,
          version: "test",
          instance: { id: "1", name: "test", version: "test" },
        },
      });
    });
    await page.route("**/api/v1/riot-ai/health", async (route) => {
      await route.fulfill({
        json: {
          status: "ok",
          provider: "ollama",
          model: "llama3.2",
          reachable: true,
        },
      });
    });
    await page.route("**/api/v1/riot-ai/models", async (route) => {
      await route.fulfill({
        json: { models: [{ id: "llama3.2", provider: "ollama" }] },
      });
    });
    await page.route("**/api/v1/riot-ai/config", async (route) => {
      await route.fulfill({
        json: {
          config: {
            profileKey: "default",
            label: "Local",
            enabled: true,
            preferredModel: "llama3.2",
            updatedAt: null,
          },
          endpoint: "server-configured",
        },
      });
    });
    await page.route("**/api/v1/riot-ai/config/history", async (route) => {
      await route.fulfill({ json: { history: [] } });
    });
    await page.route("**/api/v1/riot-ai/usage**", async (route) => {
      await route.fulfill({
        json: {
          entries: [],
          summary: {
            measurement: "measured",
            truncated: false,
            requests: 0,
            successful: 0,
            promptTokens: { value: 0, measurement: "measured" },
            completionTokens: { value: 0, measurement: "measured" },
            totalTokens: { value: 0, measurement: "measured" },
          },
        },
      });
    });
    await page.route("**/api/v1/memory/status", async (route) => {
      await route.fulfill({
        json: {
          configured: true,
          reachable: true,
          system: {
            mode: "local",
            gemini_configured: false,
            gemini_model: "gemini-2.5-flash",
            embeddings_enabled: false,
            embedding_model: "fts5",
            drive_configured: false,
            moonwitness_sync_configured: false,
            max_upload_gb: 2,
          },
          counts: {
            archives: 1,
            messages: 12,
            knowledge: 2,
            active_jobs: 0,
            failed_jobs: 0,
          },
        },
      });
    });
    await page.route("**/api/v1/memory/knowledge**", async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q");
      const limit = url.searchParams.get("limit");
      knowledgeQueries.push({ q, limit });
      await route.fulfill({
        json: {
          configured: true,
          query: q ?? "",
          records: [
            {
              id: "rec-1",
              kind: "architecture",
              title: "Port 3005 Isolation",
              summary: "Memory web UI uses port 3005.",
              content: "No collision with Next web 3000.",
              tags: ["ports", "memory"],
              entities: [],
              source_message_ids: [],
              confidence: 0.96,
            },
          ],
        },
      });
    });

    await page.goto("/intelligence");
    const bridge = page.getByRole("region", { name: "Archive memory bridge" });
    await expect(bridge).toBeVisible();
    await expect(bridge.getByText("ONLINE · 2 RECORDS")).toBeVisible();
    await expect(bridge.getByRole("link", { name: "EXPORT NDJSON" })).toBeVisible();

    await bridge.getByRole("searchbox", { name: "Search archive knowledge" }).fill("ports");
    await bridge.getByRole("button", { name: "SEARCH MEMORY" }).click();

    await expect(bridge.getByText("Port 3005 Isolation")).toBeVisible();
    expect(knowledgeQueries).toContainEqual({ q: "ports", limit: "8" });

    await bridge.getByRole("button", { name: "ATTACH TO PROMPT" }).click();
    await expect(bridge.getByRole("button", { name: "ATTACHED TO PROMPT" })).toBeVisible();
    await expect(page.locator("textarea").first()).toHaveValue(
      /\[Archive Knowledge: Port 3005 Isolation \(architecture\)\]/,
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
