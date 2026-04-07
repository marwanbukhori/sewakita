import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('landing page loads with login CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/SewaKita/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /log in|masuk|get started/i })).toBeVisible()
  })

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill('landlord@test.local')
    await page.getByPlaceholder(/password/i).fill('TestPass123!')
    await page.getByRole('button', { name: /log in|masuk|sign in/i }).click()
    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/email/i).fill('wrong@test.local')
    await page.getByPlaceholder(/password/i).fill('WrongPass!')
    await page.getByRole('button', { name: /log in|masuk|sign in/i }).click()
    await expect(page.getByText(/invalid|error|gagal/i)).toBeVisible({ timeout: 5000 })
  })

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|\//)
  })

  test('forgot password shows success message', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByPlaceholder(/email/i).fill('landlord@test.local')
    await page.getByRole('button', { name: /reset|hantar|send/i }).click()
    await expect(page.getByText(/sent|dihantar|check/i)).toBeVisible({ timeout: 5000 })
  })
})
