import { test, expect } from '@playwright/test';

test('production UI: primary views, API status, search, and prophet switching', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  await page.goto('/');
  await expect(page.getByText('Prophet Research Engine', { exact: true })).toBeVisible();
  await expect(page.getByText('API online')).toBeVisible();

  for (const tab of ['Profile', 'Provenance', 'Timeline & Relations', 'Leaderboards', 'Four Corpus', 'Architecture & Docs']) {
    await page.getByRole('tab', { name: tab }).click();
    const panel = page.getByRole('tabpanel');
    await expect(panel).toBeVisible();
    await expect(panel).not.toContainText('Loading', { timeout: 10_000 });
    await expect(panel).not.toContainText('API offline');
  }

  await page.getByLabel('Search prophets').fill('Mūsā');
  await page.getByRole('button', { name: /Mūsā/i }).click();
  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Mūsā');

  await page.getByLabel('Search prophets').fill('not-a-prophet');
  await expect(page.getByText('No matching profile.')).toBeVisible();

  const health = await page.request.get('/api/v2/health');
  expect(health.ok()).toBeTruthy();
  const healthJson = await health.json();
  expect(healthJson.version).toBe('2.3.0');
  expect(healthJson.prophetCount).toBe(25);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('production static server returns 404 for missing assets', async ({ request }) => {
  const response = await request.get('/assets/definitely-missing.js');
  expect(response.status()).toBe(404);
});
