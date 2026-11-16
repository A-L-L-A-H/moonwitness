import { test, expect } from '@playwright/test';

test('chat message mutation uses the AEP application capability', async ({ page, request }) => {
  const email = `aep-chat-${Date.now()}@example.test`;
  const password = 'aep-chat-password';
  expect((await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'AEP Chat', email, password } })).ok()).toBeTruthy();
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.token as string;
  await page.addInitScript(value => localStorage.setItem('auth_token', value), token);
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chat actions' }).first().click();
  await page.getByRole('menuitem', { name: 'New Chat' }).click();
  const content = `AEP chat smoke ${Date.now()}`;
  await page.getByPlaceholder(/Message /).fill(content);
  await page.getByPlaceholder(/Message /).press('Enter');
  await expect(page.locator('textarea[aria-label="Message"]')).toHaveValue('');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
