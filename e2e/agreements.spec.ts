import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Agreements', () => {
  test('create agreement page loads', async ({ page }) => {
    await page.goto('/agreements/new')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/agreement|perjanjian/i)
  })

  test('agreement form has key fields', async ({ page }) => {
    await page.goto('/agreements/new')
    await page.waitForTimeout(1000)
    const content = await page.textContent('body')
    expect(content).toMatch(/start|mula|rent|sewa|deposit/i)
  })

  test('move-out accessible from room detail', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText('Test Property Alpha').click()
    await page.waitForURL(/properties\//)
    await page.waitForTimeout(1000)
    // Click occupied room
    const roomBtn = page.locator('button').filter({ hasText: 'Room A' })
    if (await roomBtn.isVisible({ timeout: 3000 })) {
      await roomBtn.click()
      await page.waitForTimeout(500)
      // Move out action should be in the sheet
      const moveOut = page.getByText(/pindah keluar|move out/i).first()
      await expect(moveOut).toBeVisible({ timeout: 3000 })
    }
  })
})
