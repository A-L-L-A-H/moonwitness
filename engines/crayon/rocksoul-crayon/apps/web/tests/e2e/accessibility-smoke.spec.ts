import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const CRITICAL_ONLY_ROUTES = ['/auth/sign-in', '/auth/sign-up', '/projects']
const PRODUCT_ROUTES = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/errors/unauthorized', '/errors/forbidden', '/errors/not-found', '/errors/internal-server-error', '/dashboard', '/projects', '/tasks', '/settings/notifications', '/mail', '/chat', '/calendar', '/ai/coding', '/ai/browser', '/organizations', '/settings/user', '/settings/account', '/settings/appearance', '/settings/api-keys']

test('primary product routes meet their automated accessibility gates', async ({ page, request }) => {
  const email = `a11y-${Date.now()}-${test.info().project.name}@example.test`
  const registration = await request.post('http://localhost:3000/api/v1/auth/register', { data: { name: 'Accessibility Smoke', email, password: 'a11y-password' } })
  expect(registration.ok()).toBeTruthy()
  const login = await request.post('http://localhost:3000/api/v1/auth/login', { data: { email, password: 'a11y-password' } })
  expect(login.ok()).toBeTruthy()
  await page.addInitScript(value => localStorage.setItem('auth_token', value), (await login.json()).data.token)

  for (const path of PRODUCT_ROUTES) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
    const results = await new AxeBuilder({ page }).analyze()
    const blockingImpacts = CRITICAL_ONLY_ROUTES.includes(path) ? ['critical'] : ['critical', 'serious']
    const blocking = results.violations.filter(violation => violation.impact && blockingImpacts.includes(violation.impact))
    expect(blocking, `${path}\n${blocking.map(violation => `${violation.impact}: ${violation.id}: ${violation.help}`).join('\n')}`).toEqual([])
  }
})
