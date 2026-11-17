import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.ALLAH_TEST_URL ?? "http://127.0.0.1:3005";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.ALLAH_TEST_URL
    ? undefined
    : {
        command: "pnpm start -p 3005",
        url: "http://127.0.0.1:3005",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
