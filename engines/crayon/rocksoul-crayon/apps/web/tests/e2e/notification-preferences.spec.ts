import { test, expect } from '@playwright/test'

test('notification severity preference survives reload', async ({ page, request }) => {
  const email = `notification-preferences-${Date.now()}@example.test`
  const password = 'notification-preferences-password'
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Notification Preferences', email, password } })
  expect(registration.ok()).toBeTruthy()
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  await page.addInitScript(({ token }) => { localStorage.setItem('auth_token', token); localStorage.setItem('rocksoul:notifications:pending', JSON.stringify({ id: 'notification-preference-fixture', kind: 'activity', title: 'Fixture activity', message: 'Notification preference fixture', readAt: null, createdAt: new Date().toISOString() })) }, { token: (await login.json()).data.token })
  await page.goto('/settings/notifications')
  const filter = page.getByLabel('Filter notifications')
  await expect(filter).toHaveValue('all')
  await expect(filter.locator('option[value="activity"]')).toBeAttached()
  await filter.selectOption('activity')
  await page.reload()
  await expect(filter).toHaveValue('activity')
})
