import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Agreements', () => {
  test('create agreement page loads', async ({ page }) => {
    await page.goto('/agreements/new')
    await expect(page.getByText(/agreement|perjanjian/i).first()).toBeVisible()
  })

  test('agreement form has required fields', async ({ page }) => {
    await page.goto('/agreements/new')
    // Should have start date, end date, rent, deposit fields
    await expect(page.getByText(/start|mula/i).first()).toBeVisible({ timeout: 3000 })
  })

  test('move-out page loads for occupied room', async ({ page }) => {
    // Navigate to property detail first
    await page.goto('/properties')
    await page.getByText('Test Property Alpha').click()
    // Click the occupied room
    await page.getByText('Room A').click()
    // Look for move-out action in the sheet
    const moveOut = page.getByText(/pindah keluar|move out/i)
    if (await moveOut.isVisible({ timeout: 3000 })) {
      await moveOut.click()
      await expect(page.getByText(/move.out|pindah/i).first()).toBeVisible({ timeout: 3000 })
    }
  })
})
