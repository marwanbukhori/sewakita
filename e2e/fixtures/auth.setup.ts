import { test as setup } from '@playwright/test'
import { cleanupAll, seedTestData } from '../helpers/supabase-admin'
import { TEST_LANDLORD, TEST_TENANT } from './test-data'

setup('seed test data and authenticate', async ({ page }) => {
  // Clean slate
  await cleanupAll()
  console.log('Cleaned up previous test data')

  // Seed fresh data
  await seedTestData()
  console.log('Seeded test data: users, property, rooms, tenancy, billing')

  // Login as landlord and save state
  await page.goto('/login')
  await page.getByPlaceholder(/email/i).fill(TEST_LANDLORD.email)
  await page.getByPlaceholder(/password/i).fill(TEST_LANDLORD.password)
  await page.getByRole('button', { name: /log in|masuk|sign in/i }).click()
  await page.waitForURL('**/dashboard')
  await page.context().storageState({ path: 'e2e/.auth/landlord.json' })
  console.log('Landlord auth state saved')

  // Logout
  await page.goto('/login')

  // Login as tenant and save state
  await page.getByPlaceholder(/email/i).fill(TEST_TENANT.email)
  await page.getByPlaceholder(/password/i).fill(TEST_TENANT.password)
  await page.getByRole('button', { name: /log in|masuk|sign in/i }).click()
  await page.waitForURL('**/tenant/dashboard')
  await page.context().storageState({ path: 'e2e/.auth/tenant.json' })
  console.log('Tenant auth state saved')
})
