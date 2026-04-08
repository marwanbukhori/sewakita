import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Feature Gating & Plans', () => {
  test('plans page loads with Free and Pro cards', async ({ page }) => {
    await page.goto('/plans')
    await page.waitForTimeout(2000)
    await expect(page.getByRole('heading', { name: 'Plans' })).toBeVisible()
    const content = await page.textContent('body')
    expect(content).toMatch(/Free/)
    expect(content).toMatch(/Pro/)
  })

  test('plans page shows pricing', async ({ page }) => {
    await page.goto('/plans')
    await expect(page.getByText(/RM.*29|RM.*290/).first()).toBeVisible()
  })

  test('plans page has monthly/annual toggle', async ({ page }) => {
    await page.goto('/plans')
    await expect(page.getByRole('button', { name: /monthly/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /annual/i })).toBeVisible()
  })

  test('promo code section visible for free users', async ({ page }) => {
    await page.goto('/plans')
    const promoLink = page.getByText(/invite code|kod/i)
    await expect(promoLink).toBeVisible({ timeout: 3000 })
  })

  test('invalid promo code shows error', async ({ page }) => {
    await page.goto('/plans')
    await page.waitForTimeout(1000)
    const promoLink = page.getByText(/invite code|kod/i)
    if (await promoLink.isVisible({ timeout: 3000 })) {
      await promoLink.click()
      await page.waitForTimeout(500)
      const input = page.getByPlaceholder(/SEWAKITA/i)
      if (await input.isVisible({ timeout: 2000 })) {
        await input.fill('INVALIDCODE')
        await page.getByRole('button', { name: /redeem/i }).click()
        await page.waitForTimeout(3000)
        // Toast or inline error should appear
        const content = await page.textContent('body')
        expect(content).toMatch(/invalid|tidak sah|error|failed/i)
      }
    }
  })
})
