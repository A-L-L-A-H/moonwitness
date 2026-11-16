import { test, expect } from '@playwright/test'

test('mail compose draft survives a reload', async ({ page, request }) => {
  const email = `mail-draft-${Date.now()}@example.test`
  const password = 'mail-draft-password'
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Mail Draft', email, password } })
  expect(registration.ok()).toBeTruthy()
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  await page.addInitScript(value => localStorage.setItem('auth_token', value), (await login.json()).data.token)
  await page.goto('/mail')
  await page.getByRole('button', { name: 'Compose' }).click()
  await page.getByLabel('Recipient').fill('draft-recipient@example.invalid')
  await page.getByLabel('Subject').fill('Draft recovery verification')
  await page.getByLabel('Message').fill('This draft must survive a reload.')
  await page.waitForTimeout(500)
  await page.reload()
  await page.getByRole('button', { name: 'Compose' }).click()
  await expect(page.getByLabel('Recipient')).toHaveValue('draft-recipient@example.invalid')
  await expect(page.getByLabel('Subject')).toHaveValue('Draft recovery verification')
  await expect(page.getByLabel('Message')).toHaveValue('This draft must survive a reload.')
})
