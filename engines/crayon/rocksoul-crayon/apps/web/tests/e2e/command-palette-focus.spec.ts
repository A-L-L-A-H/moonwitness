import { test, expect } from '@playwright/test'

test('command palette restores focus to its trigger when dismissed', async ({ page, request }) => {
  const email = `command-focus-${Date.now()}@example.test`
  const password = 'command-focus-password'
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Command Focus', email, password } })
  expect(registration.ok()).toBeTruthy()
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  await page.addInitScript(value => localStorage.setItem('auth_token', value), (await login.json()).data.token)
  await page.goto('/dashboard')

  const trigger = page.getByRole('button', { name: 'Open command palette' })
  await trigger.focus()
  await trigger.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('input[aria-label="Search commands and resources"]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})
