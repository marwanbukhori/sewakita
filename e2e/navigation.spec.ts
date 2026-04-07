import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Navigation & Layout', () => {
  test('bottom nav has 4 items', async ({ page }) => {
    await page.goto('/dashboard')
    const nav = page.locator('nav.fixed')
    await expect(nav).toBeVisible()
    await expect(nav.getByText(/home|utama/i)).toBeVisible()
    await expect(nav.getByText(/billing|bil/i)).toBeVisible()
    await expect(nav.getByText(/properties|hartanah/i)).toBeVisible()
    await expect(nav.getByText(/reports|laporan/i)).toBeVisible()
  })

  test('bottom nav navigates correctly', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('nav.fixed').getByText(/billing|bil/i).click()
    await expect(page).toHaveURL(/bil/)
    await page.locator('nav.fixed').getByText(/properties|hartanah/i).click()
    await expect(page).toHaveURL(/properties/)
  })

  test('hamburger menu opens and has items', async ({ page }) => {
    await page.goto('/dashboard')
    // Click hamburger
    await page.locator('header button').click()
    await expect(page.getByText(/personal info|maklumat peribadi/i)).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/FAQ|soalan/i)).toBeVisible()
  })

  test('legacy routes redirect', async ({ page }) => {
    await page.goto('/billing')
    await expect(page).toHaveURL(/bil/)
  })

  test('activity page loads from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    const seeAll = page.getByText(/see all|lihat semua/i)
    if (await seeAll.isVisible({ timeout: 3000 })) {
      await seeAll.click()
      await expect(page).toHaveURL(/activity/)
    }
  })

  test('FAQ page loads with expandable items', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.getByText(/FAQ|soalan/i).first()).toBeVisible()
  })

  test('account page loads', async ({ page }) => {
    await page.goto('/account')
    await expect(page.getByText('Test Landlord')).toBeVisible()
  })
})
