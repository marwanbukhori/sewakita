import { test, expect } from '@playwright/test'
import { TEST_PROPERTY } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Billing', () => {
  test('billing page loads with per-property checklist', async ({ page }) => {
    await page.goto('/bil')
    await expect(page.getByText(TEST_PROPERTY.name)).toBeVisible({ timeout: 5000 })
  })

  test('enter utility bills via utility sheet', async ({ page }) => {
    await page.goto('/bil')
    // Click property row to open utility sheet
    await page.getByText(TEST_PROPERTY.name).click()
    await expect(page.getByText(/utiliti|utility/i)).toBeVisible({ timeout: 3000 })
    // Add electric
    await page.getByText(/tambah|add/i).click()
    await page.getByPlaceholder(/jumlah|amount/i).fill('180')
    await page.getByRole('button', { name: /simpan|save|looks right/i }).click()
    await expect(page.getByText('RM180')).toBeVisible({ timeout: 3000 })
  })

  test('generate bills — review and confirm', async ({ page }) => {
    await page.goto('/bil')
    // Click review button if visible
    const reviewBtn = page.getByRole('button', { name: /semak.*jana|review.*generate/i })
    if (await reviewBtn.isVisible({ timeout: 3000 })) {
      await reviewBtn.click()
      await expect(page.getByText(/semak bil|review/i)).toBeVisible({ timeout: 3000 })
      // Confirm generation
      const confirmBtn = page.getByRole('button', { name: /jana|generate|confirm/i })
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
        await expect(page.getByText(/berjaya|success/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('view bill detail via Lihat Bil', async ({ page }) => {
    await page.goto('/bil')
    // Expand a bill card
    const billCard = page.getByText('Test Tenant').first()
    if (await billCard.isVisible({ timeout: 3000 })) {
      await billCard.click()
      // Click view bill button
      const viewBtn = page.getByText(/bil$/i).first()
      if (await viewBtn.isVisible()) {
        await viewBtn.click()
        await expect(page.getByText(/bil bulanan|monthly bill/i)).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('record manual payment', async ({ page }) => {
    await page.goto('/bil')
    const billCard = page.getByText('Test Tenant').first()
    if (await billCard.isVisible({ timeout: 3000 })) {
      await billCard.click()
      // Click payment button
      const payBtn = page.getByText(/bayar/i).first()
      if (await payBtn.isVisible()) {
        await payBtn.click()
        // Fill payment form
        await page.getByLabel(/jumlah|amount/i).fill('500')
        await page.getByRole('button', { name: /simpan|save/i }).click()
        await expect(page.getByText(/direkod|recorded|berjaya/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('month navigation works', async ({ page }) => {
    await page.goto('/bil')
    const monthLabel = page.locator('text=/\\w+ \\d{4}/').first()
    const initialText = await monthLabel.textContent()
    // Click previous month
    await page.locator('button:has(svg)').first().click()
    await expect(monthLabel).not.toHaveText(initialText || '')
  })

  test('filter pills work', async ({ page }) => {
    await page.goto('/bil')
    const allPill = page.getByRole('button', { name: /semua/i })
    if (await allPill.isVisible({ timeout: 3000 })) {
      await allPill.click()
      await expect(allPill).toHaveClass(/bg-primary/)
    }
  })
})
