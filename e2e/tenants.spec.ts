import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Tenants', () => {
  test('tenant list shows seeded tenant', async ({ page }) => {
    await page.goto('/tenants')
    await expect(page.getByText('Test Tenant')).toBeVisible()
  })

  test('tenant card opens detail modal', async ({ page }) => {
    await page.goto('/tenants')
    await page.getByText('Test Tenant').click()
    // Modal should show profile
    await expect(page.getByText('0198765432')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/Room A/i)).toBeVisible()
    await expect(page.getByText(/WhatsApp/i)).toBeVisible()
  })

  test('edit tenant name', async ({ page }) => {
    await page.goto('/tenants')
    await page.getByText('Test Tenant').click()
    // Click edit pencil
    await page.locator('button:has(svg)').filter({ hasText: '' }).last().click()
    const nameInput = page.getByLabel(/name|nama/i)
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Tenant Updated')
      await page.getByRole('button', { name: /save|simpan/i }).click()
      await expect(page.getByText('Updated')).toBeVisible({ timeout: 3000 })
    }
  })
})
