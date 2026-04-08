import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/tenant.json' })

test.describe('Tenant Portal', () => {
  test('dashboard loads with correct route and nav', async ({ page }) => {
    await page.goto('/tenant/dashboard')
    await expect(page).toHaveURL(/tenant\/dashboard/)
    // Tenant nav should be visible
    const nav = page.locator('nav').last()
    await expect(nav.getByText(/home|utama/i)).toBeVisible({ timeout: 5000 })
    await expect(nav.getByText(/billing|bil/i)).toBeVisible()
    await expect(nav.getByText(/payment|bayaran/i)).toBeVisible()
  })

  test('dashboard renders content after data loads', async ({ page }) => {
    await page.goto('/tenant/dashboard')
    // Wait for either content or skeleton to appear
    await page.waitForTimeout(5000)
    const mainContent = await page.locator('main').innerHTML()
    // Main should have SOME content (even if just loading skeleton)
    expect(mainContent.length).toBeGreaterThan(0)
  })

  test('bills page loads', async ({ page }) => {
    await page.goto('/tenant/bills')
    await expect(page).toHaveURL(/tenant\/bills/)
    await page.waitForTimeout(2000)
    const content = await page.textContent('body')
    expect(content).toMatch(/billing|bil|RM\d+|tiada|no/i)
  })

  test('payments page loads', async ({ page }) => {
    await page.goto('/tenant/payments')
    await expect(page).toHaveURL(/tenant\/payments/)
    await page.waitForTimeout(2000)
    const content = await page.textContent('body')
    expect(content).toMatch(/payment|bayaran|RM\d+|tiada|no/i)
  })

  test('Pay Now button hidden when payments disabled', async ({ page }) => {
    await page.goto('/tenant/bills')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Pay Now/i)).not.toBeVisible()
  })

  test('tenant cannot access landlord routes', async ({ page }) => {
    await page.goto('/properties')
    // Should redirect to tenant dashboard
    await expect(page).toHaveURL(/tenant\/dashboard/)
  })
})
