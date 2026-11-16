import { test, expect } from '@playwright/test';

test('mail and chat avoid duplicate initial requests on a large-ish live list', async ({ page, request }) => {
  const nonce = Date.now();
  const email = `phase7-performance-${nonce}@example.test`;
  const password = 'phase7-performance-password';
  await expect((await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Performance User', email, password } })).ok()).toBeTruthy();
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const token = (await login.json()).data.token;
  await page.addInitScript((value) => localStorage.setItem('auth_token', value), token);

  await Promise.all(Array.from({ length: 100 }, (_, index) => request.post('http://localhost:3000/api/v1/mail/send', {
    data: { to: `large-list-${index}@example.invalid`, subject: `Large list ${index}`, text: `Performance fixture ${index}`, draft: true },
    headers: { authorization: `Bearer ${token}` },
  })));

  const mailRequests: string[] = [];
  page.on('request', (requestEvent) => {
    if (requestEvent.method() === 'GET' && requestEvent.url().includes('/api/v1/models/mails')) mailRequests.push(requestEvent.url());
  });
  const mailStart = Date.now();
  await page.goto('/mail');
  await expect(page.getByRole('heading', { name: 'Mail' })).toBeVisible();
  expect(Date.now() - mailStart).toBeLessThan(5000);
  expect(mailRequests).toHaveLength(1);

  mailRequests.length = 0;
  await page.getByLabel('Mail folder').selectOption('draft');
  await expect(page.getByText('Draft', { exact: true }).last()).toBeVisible();
  expect(mailRequests).toHaveLength(1);

  const chatRequests: string[] = [];
  page.on('request', (requestEvent) => {
    if (requestEvent.method() === 'GET' && (requestEvent.url().includes('/api/v1/models/chat_conversations') || requestEvent.url().includes('/api/v1/models/chat_messages'))) chatRequests.push(requestEvent.url());
  });
  const chatStart = Date.now();
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible();
  expect(Date.now() - chatStart).toBeLessThan(5000);
  expect(chatRequests.filter(url => url.includes('/chat_conversations'))).toHaveLength(1);
  expect(chatRequests.filter(url => url.includes('/chat_messages')).length).toBeLessThanOrEqual(1);
});
