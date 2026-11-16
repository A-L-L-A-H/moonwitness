import { test, expect } from '@playwright/test';

test('authenticated journey reaches dashboard and notifications', async ({ page, request }) => {
  const email = `phase7-${Date.now()}-${test.info().project.name}@example.test`;
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Phase Seven', email, password: 'phase7-password' } });
  expect(registration.ok()).toBeTruthy();
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password: 'phase7-password' } });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.token;
  await page.addInitScript((value) => localStorage.setItem('auth_token', value), token);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Command palette' })).toBeVisible();
  await expect(page.locator('input[aria-label="Search commands and resources"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open command palette' })).toBeFocused();
  await page.keyboard.press('Control+K');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  for (const [path, heading] of [['/mail', /mail/i], ['/chat', /chat/i], ['/calendar', /calendar/i], ['/ai/coding', /codex coding workspace/i], ['/ai/browser', /browser automation agent/i]] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: path === '/chat' ? 'Chat' : heading, exact: path === '/chat' })).toBeVisible();
  }
  if (test.info().project.name === 'desktop') {
    const adminLogin = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email: 'sarah.johnson@example.com', password: 'Password123!' } });
    expect(adminLogin.ok()).toBeTruthy();
    const adminToken = (await adminLogin.json()).data.token;
    const adminPage = await page.context().newPage();
    await adminPage.addInitScript((value) => localStorage.setItem('auth_token', value), adminToken);
    await adminPage.goto('/organizations');
    await expect(adminPage.getByLabel('Select all visible records')).toBeVisible();
    await adminPage.getByLabel('Select all visible records').check();
    await expect(adminPage.getByRole('status')).toContainText('selected');
    await adminPage.getByRole('button', { name: 'Clear selection' }).click();
    await adminPage.getByText('Columns', { exact: true }).click();
    const visibleColumns = adminPage.getByRole('group', { name: 'Visible columns' });
    const companyColumn = visibleColumns.getByRole('checkbox', { name: 'Show Company Name column' });
    await companyColumn.uncheck();
    await expect(adminPage.getByRole('columnheader', { name: 'Company Name' })).toHaveCount(0);
    await companyColumn.check();
    await expect(adminPage.getByRole('columnheader', { name: 'Company Name' })).toBeVisible();
    await visibleColumns.getByRole('button', { name: 'Move Company Name column down' }).click();
    const headers = await adminPage.getByRole('columnheader').allTextContents();
    expect(headers.indexOf('Company Name')).toBeGreaterThan(headers.indexOf('Code'));
    const organizationName = `Phase 7 Organization ${Date.now()}`;
    const organizationCode = `P7-${Date.now()}`;
    await adminPage.getByRole('button', { name: 'Create Organization' }).click();
    await adminPage.getByRole('textbox', { name: /Company Name/ }).fill(organizationName);
    await adminPage.getByRole('textbox', { name: 'Code *' }).fill(organizationCode);
    await adminPage.getByRole('button', { name: 'Save' }).click();
    await expect(adminPage.getByText(organizationName, { exact: true })).toBeVisible();
    await adminPage.getByRole('row').filter({ hasText: organizationName }).getByRole('button', { name: 'Edit' }).click();
    await adminPage.getByRole('textbox', { name: /Company Name/ }).fill(`${organizationName} Updated`);
    await adminPage.getByRole('button', { name: 'Save' }).click();
    await expect(adminPage.getByText(`${organizationName} Updated`, { exact: true })).toBeVisible();
    await adminPage.getByRole('row').filter({ hasText: `${organizationName} Updated` }).getByRole('button', { name: 'Delete' }).click();
    await adminPage.getByRole('button', { name: 'Delete' }).last().click();
    await expect(adminPage.getByText(`${organizationName} Updated`, { exact: true })).toHaveCount(0);
    const contextOrganizationName = `${organizationName} Context`;
    const contextOrganizationCode = `${organizationCode}-CTX`;
    const organization = await request.post('http://localhost:3000/api/v1/models/organizations', { data: { name: contextOrganizationName, code: contextOrganizationCode }, headers: { authorization: `Bearer ${adminToken}` } });
    expect(organization.ok()).toBeTruthy();
    const organizationId = (await organization.json()).data.id;
    const membership = await request.post(`http://localhost:3000/api/v1/organizations/${organizationId}/members`, { data: { userId: '1', role: 'owner' }, headers: { authorization: `Bearer ${adminToken}` } });
    expect(membership.ok()).toBeTruthy();
    await adminPage.goto('/organizations');
    await expect(adminPage.getByRole('button', { name: new RegExp(contextOrganizationName) })).toBeVisible();
    const contextButton = adminPage.getByRole('button', { name: new RegExp(contextOrganizationName) });
    await contextButton.click({ force: true });
    await expect(contextButton).toHaveAttribute('aria-pressed', 'true');
    await adminPage.close();

    await page.goto('/ai/coding');
    await page.getByRole('button', { name: 'package.json', exact: true }).click();
    await expect(page.locator('pre')).not.toContainText('Select a file to inspect');
    await page.goto('/ai/browser');
    await page.getByLabel('Public URL').fill('https://example.com');
    await page.getByRole('button', { name: 'Fetch' }).click();
    await expect(page.getByText(/HTTP 200/)).toBeVisible();

    await page.goto('/ai/chat');
    const aiRunId = `phase7-ai-run-${Date.now()}`;
    await page.route('**/api/v1/ai/runs', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { runId: aiRunId, agentId: 'assistant', status: 'pending', messages: [], createdAt: new Date().toISOString() } }),
      });
    });
    await page.route(`**/api/v1/ai/runs/${aiRunId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { runId: aiRunId, agentId: 'assistant', status: 'pending', messages: [], createdAt: new Date().toISOString() } }),
      });
    });
    await page.route(`**/api/v1/ai/runs/${aiRunId}/cancel`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { runId: aiRunId, status: 'cancelled' } }),
      });
    });
    const aiComposer = page.getByPlaceholder('Message assistant...');
    await aiComposer.fill('Cancel this deterministic run');
    await aiComposer.press('Enter');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    await page.unroute('**/api/v1/ai/runs');
    await page.unroute(`**/api/v1/ai/runs/${aiRunId}`);
    await page.unroute(`**/api/v1/ai/runs/${aiRunId}/cancel`);

    await page.goto('/calendar');
    const calendarTitle = `Phase 7 event ${Date.now()}`;
    const updatedCalendarTitle = `${calendarTitle} updated`;
    await page.getByRole('group', { name: 'Calendar view' }).getByRole('button', { name: 'Create event' }).click();
    await page.getByLabel(/Title/).fill(calendarTitle);
    await page.getByLabel(/Date/).fill(new Date().toISOString().slice(0, 10));
    await page.getByLabel(/Time/).fill('09:00');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(calendarTitle) })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(calendarTitle) }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel(/Title/).fill(updatedCalendarTitle);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('button', { name: new RegExp(updatedCalendarTitle) })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(updatedCalendarTitle) }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('button', { name: new RegExp(updatedCalendarTitle) })).toHaveCount(0);
  }
  await page.goto('/mail');
  await page.getByRole('button', { name: 'Compose' }).click();
  await page.getByLabel('Recipient').fill('recipient@example.invalid');
  await page.getByLabel('Subject').fill('Phase 7 browser verification');
  await page.getByLabel('Message').fill('Authenticated mail mutation verification');
  await page.getByRole('button', { name: 'Send' }).click({ clickCount: 2 });
  await expect(page.getByLabel('Mail folder')).toHaveValue('sent');
  await page.getByLabel('Search mail').fill('Phase 7 browser verification');
  await expect(page.getByText('Phase 7 browser verification', { exact: true })).toBeVisible();
  await page.goto('/settings/notifications');
  await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
  await expect(page.getByText('Mail sent', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open activity' })).toHaveAttribute('href', '/mail?folder=sent');
  await page.getByRole('button', { name: 'Mark read' }).click();
  await expect(page.getByRole('button', { name: 'Mark read' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Open activity' }).click();
  await expect(page).toHaveURL(/\/mail\?folder=sent/);
  await page.route('**/api/v1/models/mails**', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Session expired' }) });
  });
  await page.reload();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});
