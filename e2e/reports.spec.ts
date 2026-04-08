import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Reports', () => {
  test('reports dashboard loads', async ({ page }) => {
    await page.goto('/reports')
    await page.waitForTimeout(2000)
    const content = await page.textContent('body')
    expect(content).toMatch(/reports|laporan|upgrade|RM|pendapatan|income/i)
  })

  test('monthly collection report loads', async ({ page }) => {
    await page.goto('/reports/monthly')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/monthly|kutipan|collection|upgrade/i)
  })

  test('annual tax report loads', async ({ page }) => {
    await page.goto('/reports/annual')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/tax|cukai|annual|upgrade/i)
  })

  test('aging report loads', async ({ page }) => {
    await page.goto('/reports/aging')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/aging|tunggakan|upgrade/i)
  })

  test('occupancy report loads', async ({ page }) => {
    await page.goto('/reports/occupancy')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/occupancy|penghunian|upgrade/i)
  })

  test('agreement report loads', async ({ page }) => {
    await page.goto('/reports/agreements')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/agreement|perjanjian|upgrade/i)
  })

  test('reports accessible from bottom nav', async ({ page }) => {
    await page.goto('/dashboard')
    const nav = page.locator('nav').last()
    const reportLink = nav.locator('a').filter({ hasText: /reports|laporan/i })
    await expect(reportLink).toBeVisible({ timeout: 3000 })
    await reportLink.click()
    await expect(page).toHaveURL(/reports/)
  })
})
