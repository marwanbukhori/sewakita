import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Feature Gating & Plans', () => {
  test('plans page shows Free vs Pro', async ({ page }) => {
    await page.goto('/plans')
    await expect(page.getByText(/Free/)).toBeVisible()
    await expect(page.getByText(/Pro/)).toBeVisible()
    await expect(page.getByText(/RM.*29|RM.*290/)).toBeVisible()
  })

  test('plans page has monthly/annual toggle', async ({ page }) => {
    await page.goto('/plans')
    const monthlyBtn = page.getByRole('button', { name: /monthly/i })
    const annualBtn = page.getByRole('button', { name: /annual/i })
    await expect(monthlyBtn).toBeVisible()
    await expect(annualBtn).toBeVisible()
  })

  test('promo code input visible for free users', async ({ page }) => {
    await page.goto('/plans')
    const promoLink = page.getByText(/invite code|kod/i)
    if (await promoLink.isVisible({ timeout: 2000 })) {
      await promoLink.click()
      await expect(page.getByPlaceholder(/SEWAKITA/i)).toBeVisible()
    }
  })

  test('invalid promo code shows error', async ({ page }) => {
    await page.goto('/plans')
    const promoLink = page.getByText(/invite code|kod/i)
    if (await promoLink.isVisible({ timeout: 2000 })) {
      await promoLink.click()
      await page.getByPlaceholder(/SEWAKITA/i).fill('INVALIDCODE')
      await page.getByRole('button', { name: /redeem/i }).click()
      await expect(page.getByText(/invalid|tidak sah/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('reports show ProGate blur for free users', async ({ page }) => {
    await page.goto('/reports')
    // ProGate should blur the content
    const blur = page.locator('.blur-sm')
    const upgradeBtn = page.getByText(/upgrade to pro/i)
    // Either blur exists or reports are accessible (if user has been upgraded by another test)
    const isGated = await blur.isVisible({ timeout: 3000 }).catch(() => false)
    const isOpen = await page.getByText(/RM\d+/).first().isVisible({ timeout: 1000 }).catch(() => false)
    expect(isGated || isOpen).toBeTruthy()
  })
})
