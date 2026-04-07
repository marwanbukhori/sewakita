import { test, expect } from '@playwright/test'
import { TEST_PROPERTY, TEST_ROOMS } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/landlord.json' })

test.describe('Properties', () => {
  test('properties page lists seeded property', async ({ page }) => {
    await page.goto('/properties')
    await expect(page.getByText(TEST_PROPERTY.name)).toBeVisible()
  })

  test('property detail shows hero and stats', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    await expect(page.getByText(TEST_PROPERTY.name)).toBeVisible()
    await expect(page.getByText(TEST_PROPERTY.address)).toBeVisible()
    // Stat cards
    await expect(page.getByText(/1\/3|penghunian|occupancy/i)).toBeVisible()
  })

  test('room cards show correct status', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    // Room A is occupied
    await expect(page.getByText(TEST_ROOMS[0].label)).toBeVisible()
    await expect(page.getByText(/dihuni|occupied/i).first()).toBeVisible()
    // Room B is vacant
    await expect(page.getByText(TEST_ROOMS[1].label)).toBeVisible()
    await expect(page.getByText(/kosong|vacant/i).first()).toBeVisible()
  })

  test('occupied room opens detail sheet', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    // Click the occupied room card (Room A)
    await page.getByText(TEST_ROOMS[0].label).click()
    // Sheet should show tenant info
    await expect(page.getByText('Test Tenant')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText(/WhatsApp/i)).toBeVisible()
  })

  test('add new room', async ({ page }) => {
    await page.goto('/properties')
    await page.getByText(TEST_PROPERTY.name).click()
    await page.getByText(/add|tambah/i).click()
    await page.getByPlaceholder(/label|nama/i).fill('Room D')
    await page.getByPlaceholder(/rent|sewa/i).fill('600')
    await page.getByRole('button', { name: /save|simpan/i }).click()
    await expect(page.getByText('Room D')).toBeVisible({ timeout: 3000 })
  })

  test('tenants button links to tenant list', async ({ page }) => {
    await page.goto('/properties')
    await page.getByRole('link', { name: /tenant/i }).click()
    await expect(page).toHaveURL(/tenants/)
  })
})
