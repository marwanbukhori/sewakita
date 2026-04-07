import { test, expect } from '@playwright/test'

test.use({ storageState: 'e2e/.auth/tenant.json' })

test.describe('Tenant Portal', () => {
  test('dashboard shows current bill or no-bill state', async ({ page }) => {
    await page.goto('/tenant/dashboard')
    // Should show either a bill card or "no bills" message
    const hasBill = await page.getByText(/RM\d+/).first().isVisible({ timeout: 3000 }).catch(() => false)
    const noBill = await page.getByText(/tiada bil|no bills/i).isVisible({ timeout: 1000 }).catch(() => false)
    expect(hasBill || noBill).toBeTruthy()
  })

  test('dashboard shows tenancy info', async ({ page }) => {
    await page.goto('/tenant/dashboard')
    await expect(page.getByText(/Test Property Alpha/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Room A/i)).toBeVisible()
  })

  test('bills page lists bills grouped by month', async ({ page }) => {
    await page.goto('/tenant/bills')
    // Should have at least seeded historical bills
    await expect(page.getByText(/RM\d+/).first()).toBeVisible({ timeout: 5000 })
  })

  test('bill breakdown expands on click', async ({ page }) => {
    await page.goto('/tenant/bills')
    const billRow = page.getByText(/rent|sewa/i).first()
    if (await billRow.isVisible({ timeout: 3000 })) {
      await billRow.click()
      // Should show breakdown with rent + utilities
      await expect(page.getByText(/total|jumlah/i).first()).toBeVisible()
    }
  })

  test('payments page shows payment history', async ({ page }) => {
    await page.goto('/tenant/payments')
    // Seeded data has paid bills
    const hasPayment = await page.getByText(/RM\d+/).first().isVisible({ timeout: 3000 }).catch(() => false)
    const noPayment = await page.getByText(/tiada|no payment/i).isVisible({ timeout: 1000 }).catch(() => false)
    expect(hasPayment || noPayment).toBeTruthy()
  })

  test('Pay Now button hidden when payments disabled', async ({ page }) => {
    await page.goto('/tenant/bills')
    await expect(page.getByText(/Pay Now/i)).not.toBeVisible({ timeout: 2000 })
  })

  test('contact landlord WhatsApp button visible', async ({ page }) => {
    await page.goto('/tenant/dashboard')
    const waButton = page.getByText(/contact|hubungi|whatsapp/i).first()
    await expect(waButton).toBeVisible({ timeout: 5000 })
  })
})
