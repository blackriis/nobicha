import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for Employee Work History E2E Tests
 * การตั้งค่า Playwright สำหรับการทดสอบ E2E ของประวัติการทำงานพนักงาน
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/work-history-results.json' }],
    ['junit', { outputFile: 'test-results/work-history-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Global test timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes timeout for server startup
  },
  // Test-specific configuration
  testMatch: [
    '**/employee-work-history*.spec.ts',
    '**/work-history*.spec.ts'
  ],
  // Global setup and teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  // Test timeout
  timeout: 60000, // 1 minute per test
  // Expect timeout
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  // Output directory for test results
  outputDir: 'test-results/',
  // Test data directory
  testDir: './e2e',
  // Ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**'
  ],
  // Environment variables for tests
  env: {
    TEST_ENV: 'e2e',
    TEST_USER_EMAIL: 'test.employee@test.com',
    TEST_USER_PASSWORD: 'testpassword123',
    TEST_ADMIN_EMAIL: 'admin@test.com',
    TEST_ADMIN_PASSWORD: 'password123',
  },
  // Parallel execution settings
  fullyParallel: true,
  // Retry settings
  retries: process.env.CI ? 2 : 0,
  // Worker settings
  workers: process.env.CI ? 1 : undefined,
  // Reporter settings
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['github']
  ],
})
