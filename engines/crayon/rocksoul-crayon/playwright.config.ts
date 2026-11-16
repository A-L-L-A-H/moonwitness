import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/webtransport',
  timeout: 15_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'artifacts/webtransport/results.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://webtransport.localhost',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
