import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5179',
    viewport: { width: 390, height: 844 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'tests',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev:test -- --port 5179',
    url: 'http://localhost:5179',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
