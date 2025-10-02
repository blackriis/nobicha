import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Mobile viewport settings
    viewport: { width: 375, height: 667 },
    // Mobile user agent
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['iPhone 12'],
        // Override with our custom settings
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'webkit-mobile',
      use: { 
        ...devices['iPhone 12'],
        ...devices['Desktop Safari'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
