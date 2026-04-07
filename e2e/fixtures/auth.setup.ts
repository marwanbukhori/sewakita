import { test as setup, type Page } from '@playwright/test'
import { cleanupAll, seedTestData } from '../helpers/supabase-admin'
import { TEST_LANDLORD, TEST_TENANT } from './test-data'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: /email/i }).fill(email)
  await page.getByRole('textbox', { name: /password/i }).fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
}

setup('seed test data and authenticate', async ({ page }) => {
  await cleanupAll()
  console.log('Cleaned up previous test data')

  await seedTestData()
  console.log('Seeded test data')

  // Login as landlord and save state
  await login(page, TEST_LANDLORD.email, TEST_LANDLORD.password)
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.context().storageState({ path: 'e2e/.auth/landlord.json' })
  console.log('Landlord auth state saved')

  // Clear session before tenant login
  await page.context().clearCookies()
  await page.evaluate(() => localStorage.clear())

  // Login as tenant and save state
  await login(page, TEST_TENANT.email, TEST_TENANT.password)
  await page.waitForURL('**/tenant/dashboard', { timeout: 15000 })
  await page.context().storageState({ path: 'e2e/.auth/tenant.json' })
  console.log('Tenant auth state saved')
})
