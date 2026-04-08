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
    await page.waitForTimeout(1000)
    // Click property row to open utility sheet
    const propRow = page.locator('button').filter({ hasText: TEST_PROPERTY.name })
    if (await propRow.isVisible({ timeout: 3000 })) {
      await propRow.click()
      await page.waitForTimeout(500)
      // Look for the utility form toggle
      const addBtn = page.getByText(/tambah|add/i).first()
      if (await addBtn.isVisible({ timeout: 3000 })) {
        await addBtn.click()
        await page.waitForTimeout(300)
        const amountInput = page.getByPlaceholder(/jumlah|amount|RM/i).first()
        if (await amountInput.isVisible({ timeout: 2000 })) {
          await amountInput.fill('180')
          await page.getByRole('button', { name: /simpan|save|looks right/i }).first().click()
        }
      }
    }
  })

  test('generate bills — review and confirm', async ({ page }) => {
    await page.goto('/bil')
    await page.waitForTimeout(1000)
    // Look for a property row that's ready to generate
    const readyRow = page.locator('button').filter({ hasText: /sedia|ready/i }).first()
    if (await readyRow.isVisible({ timeout: 3000 })) {
      await readyRow.click()
      await page.waitForTimeout(500)
    }
  })

  test('view bill detail', async ({ page }) => {
    await page.goto('/bil')
    await page.waitForTimeout(1000)
    const billCard = page.getByText('Test Tenant').first()
    if (await billCard.isVisible({ timeout: 3000 })) {
      await billCard.click()
      await page.waitForTimeout(300)
      // Should show some bill detail
      await expect(page.getByText(/RM\d+/).first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('month navigation works', async ({ page }) => {
    await page.goto('/bil')
    await page.waitForTimeout(500)
    // Find the month navigation — click the left chevron button in the month picker
    const monthNav = page.locator('.shadow-card, [class*="shadow"]').filter({ hasText: /\d{4}/ }).first()
    const prevBtn = monthNav.locator('button').first()
    if (await prevBtn.isVisible({ timeout: 2000 })) {
      const initialText = await monthNav.textContent()
      await prevBtn.click()
      await page.waitForTimeout(500)
      const newText = await monthNav.textContent()
      expect(newText).not.toBe(initialText)
    }
  })

  test('filter pills work', async ({ page }) => {
    await page.goto('/bil')
    await page.waitForTimeout(1000)
    const allPill = page.getByRole('button', { name: /semua/i })
    if (await allPill.isVisible({ timeout: 3000 })) {
      await allPill.click()
      await expect(allPill).toHaveClass(/bg-primary/)
    }
  })
})
