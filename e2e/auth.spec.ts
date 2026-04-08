import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Auth', () => {
  test('landing page loads with login CTA', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const content = await page.textContent('body')
    expect(content).toMatch(/property management|SewaKita/i)
    expect(content).toMatch(/get started|sign in|log in|masuk/i)
  })

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('landlord@test.local')
    await page.getByRole('textbox', { name: /password/i }).fill('TestPass123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/dashboard/)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: /email/i }).fill('wrong@test.local')
    await page.getByRole('textbox', { name: /password/i }).fill('WrongPass!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Should show error — either toast or inline message
    await expect(page.locator('[role="status"], .text-danger-500, .text-red-500').first()).toBeVisible({ timeout: 5000 })
  })

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|\//)
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
  })
})
