import { test, expect } from '@playwright/test';

test('mail compose uses the AEP application execution path', async ({ page, request }) => {
  const email = `aep-fabric-${Date.now()}@example.test`;
  const password = 'aep-fabric-password';
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'AEP Fabric', email, password } });
  expect(registration.ok()).toBeTruthy();
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.token as string;
  await page.addInitScript(value => localStorage.setItem('auth_token', value), token);
  await page.goto('/mail');
  await expect(page.getByRole('heading', { name: 'Mail' })).toBeVisible();
  await page.getByRole('button', { name: 'Compose' }).click();
  await expect(page.getByLabel('Recipient')).toBeFocused();
  await page.getByLabel('Recipient').fill('receiver@example.com');
  await page.getByLabel('Subject').fill(`AEP ${Date.now()}`);
  await page.getByLabel('Message').fill('Application Fabric execution smoke test');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(async () => {
    const mails = await request.get('http://localhost:3000/api/v1/models/mails?limit=25&folder=sent', { headers: { authorization: `Bearer ${token}` } });
    if (!mails.ok()) return false;
    const body = await mails.json();
    return body.data.items.some((mail: { name?: string; text?: string }) => mail.name === 'receiver@example.com' && mail.text === 'Application Fabric execution smoke test');
  }, { timeout: 15_000 }).toBeTruthy();
  await expect(page.getByLabel('Mail folder')).toHaveValue('sent', { timeout: 5_000 });
});
