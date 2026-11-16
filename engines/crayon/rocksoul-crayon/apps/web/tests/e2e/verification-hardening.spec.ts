import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

async function authenticate(page: Page, request: APIRequestContext, label: string) {
  const email = `verification-${label}-${Date.now()}-${test.info().project.name}@example.test`
  const password = 'verification-password'
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Verification Coverage', email, password } })
  expect(registration.ok()).toBeTruthy()
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  await page.addInitScript(value => localStorage.setItem('auth_token', value), (await login.json()).data.token)
}

test('mail compose restores focus to its trigger when dismissed', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'desktop', 'Inline mail compose focus coverage runs on desktop.')
  await authenticate(page, request, 'compose-focus')
  await page.goto('/mail')

  const trigger = page.getByRole('button', { name: 'Compose', exact: true })
  await trigger.focus()
  await trigger.click()
  await expect(page.getByLabel('Recipient')).toBeFocused()
  await trigger.click()
  await expect(trigger).toBeFocused()
})

test('mobile app sidebar closes with Escape and restores focus to its trigger', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'mobile', 'Mobile sidebar coverage runs on the mobile project.')
  await authenticate(page, request, 'mobile-sidebar')
  await page.goto('/dashboard')

  const trigger = page.getByRole('button', { name: 'Toggle Sidebar' })
  await trigger.click()
  const sidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]')
  await expect(sidebar).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sidebar).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('mobile chat drawer closes with Escape and restores focus to its trigger', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'mobile', 'Mobile chat coverage runs on the mobile project.')
  await authenticate(page, request, 'mobile-chat')
  await page.goto('/chat')
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible({ timeout: 15000 })

  const trigger = page.getByRole('button', { name: 'Open conversations' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Conversations' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close conversations' }).last()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Conversations' })).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('mail exposes a recoverable alert when its initial request fails', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'desktop', 'Mail failure recovery coverage runs on desktop.')
  await authenticate(page, request, 'mail-error')
  let failNext = true
  await page.route('**/api/v1/models/mails**', async route => {
    if (!failNext) return route.continue()
    failNext = false
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Service unavailable' }) })
  })
  await page.goto('/mail')
  await expect(page.getByRole('alert')).toContainText('service is unavailable', { timeout: 15000 })
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('chat exposes an unavailable alert when its initial request fails', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'desktop', 'Chat failure coverage runs on desktop.')
  await authenticate(page, request, 'chat-error')
  await page.route('**/api/v1/models/chat_conversations**', async route => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Service unavailable' }) })
  })
  await page.goto('/chat')
  await expect(page.getByRole('alert')).toContainText('Chat unavailable', { timeout: 15000 })
  await expect(page.getByRole('alert')).toContainText('service is unavailable')
})
