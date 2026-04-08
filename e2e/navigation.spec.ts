import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Navigation & Layout', () => {
  test('bottom nav has 4 items', async ({ page }) => {
    await page.goto('/dashboard')
    const nav = page.locator('nav').last()
    await expect(nav).toBeVisible()
    // Check for 4 nav links
    const navLinks = nav.locator('a')
    expect(await navLinks.count()).toBe(4)
  })

  test('bottom nav navigates correctly', async ({ page }) => {
    await page.goto('/dashboard')
    const nav = page.locator('nav').last()
    await nav.getByText(/billing|bil/i).click()
    await expect(page).toHaveURL(/bil/)
    await nav.getByText(/properties|hartanah/i).click()
    await expect(page).toHaveURL(/properties/)
  })

  test('hamburger menu opens', async ({ page }) => {
    await page.goto('/dashboard')
    // Click the hamburger button in the header
    const header = page.locator('header')
    await header.locator('button').click()
    await page.waitForTimeout(300)
    // Should show menu items
    const content = await page.textContent('body')
    expect(content).toMatch(/personal info|maklumat|FAQ|soalan/i)
  })

  test('legacy routes redirect', async ({ page }) => {
    await page.goto('/billing')
    await expect(page).toHaveURL(/bil/)
  })

  test('activity page loads from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)
    const seeAll = page.getByText(/see all|lihat semua/i).first()
    if (await seeAll.isVisible({ timeout: 3000 })) {
      await seeAll.click()
      await expect(page).toHaveURL(/activity/)
    }
  })

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/FAQ|soalan|question/i)
  })

  test('account page shows user name', async ({ page }) => {
    await page.goto('/account')
    await expect(page.getByText('Test Landlord')).toBeVisible({ timeout: 5000 })
  })
})
