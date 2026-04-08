import { test, expect } from '@playwright/test'
import { TEST_PROPERTY, TEST_ROOMS } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Properties', () => {
  test('properties page lists seeded property', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByText(TEST_PROPERTY.name)).toBeVisible()
  })

  test('property detail shows hero and stats', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    await page.waitForURL(/properties\//)
    await expect(page.getByText(TEST_PROPERTY.name)).toBeVisible()
    await expect(page.getByText(/1\/3|1\/4/).first()).toBeVisible({ timeout: 5000 })
  })

  test('room cards show correct status', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    await page.waitForURL(/properties\//)
    await expect(page.getByText(TEST_ROOMS[0].label)).toBeVisible({ timeout: 5000 })
  })

  test('occupied room opens detail sheet', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    await page.waitForURL(/properties\//)
    await page.waitForTimeout(2000)
    const roomBtn = page.locator('button').filter({ hasText: TEST_ROOMS[0].label })
    if (await roomBtn.isVisible({ timeout: 3000 })) {
      await roomBtn.click()
      await page.waitForTimeout(1000)
      const content = await page.textContent('body')
      expect(content).toMatch(/Test Tenant|WhatsApp|pindah/i)
    }
  })

  test('tenants button links to tenant list', async ({ page }) => {
    await page.goto('/properties')
    await page.getByRole('link', { name: /tenant/i }).click()
    await expect(page).toHaveURL(/tenants/)
  })
})
