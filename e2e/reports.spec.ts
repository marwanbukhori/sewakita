import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Reports', () => {
  test('reports dashboard loads', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText(/reports|laporan/i).first()).toBeVisible()
  })

  test('reports dashboard shows stat cards', async ({ page }) => {
    await page.goto('/reports')
    // Should have stat cards even if values are 0
    await expect(page.getByText(/RM\d+|0%/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('monthly collection report loads', async ({ page }) => {
    await page.goto('/reports/monthly')
    await expect(page.getByText(/monthly|kutipan|collection/i).first()).toBeVisible()
  })

  test('annual tax report loads', async ({ page }) => {
    await page.goto('/reports/annual')
    await expect(page.getByText(/tax|cukai|annual/i).first()).toBeVisible()
  })

  test('aging report loads', async ({ page }) => {
    await page.goto('/reports/aging')
    await expect(page.getByText(/aging|tunggakan/i).first()).toBeVisible()
  })

  test('occupancy report loads', async ({ page }) => {
    await page.goto('/reports/occupancy')
    await expect(page.getByText(/occupancy|penghunian/i).first()).toBeVisible()
  })

  test('agreement report loads', async ({ page }) => {
    await page.goto('/reports/agreements')
    await expect(page.getByText(/agreement|perjanjian/i).first()).toBeVisible()
  })

  test('detailed report links from dashboard', async ({ page }) => {
    await page.goto('/reports')
    const links = page.getByRole('link').filter({ hasText: /kutipan|aging|occupancy|agreement|tax|tunggakan|penghunian|perjanjian/i })
    expect(await links.count()).toBeGreaterThanOrEqual(4)
  })
})
