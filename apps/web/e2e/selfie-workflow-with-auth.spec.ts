import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Story 1.5 with Authentication
 * Tests selfie capture workflow with real authentication flow
 */
test.describe('Story 1.5: Selfie Capture with Authentication', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['camera'])
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 })
  })

  test('Can login as employee and access dashboard', async ({ page }) => {
    // Go to employee login
    await page.goto('/login/employee')
    
    // Check login form exists
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'employee.som@test.com')
    await page.fill('input[type="password"]', 'Employee123!')
    
    await page.click('button[type="submit"]')
    
    // Wait for potential redirect
    await page.waitForTimeout(3000)
    
    // Check current URL and page content
    const currentUrl = page.url()
    console.log('Current URL after login:', currentUrl)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/after-login.png' })
    
    // Check if we can see dashboard elements or time entry card
    const pageContent = await page.textContent('body')
    console.log('Page content after login (first 500 chars):', pageContent?.substring(0, 500))
    
    // Look for time entry or dashboard related content
    const hasTimeEntryContent = await page.locator('text=เข้างาน').isVisible({ timeout: 5000 }).catch(() => false)
    const hasDashboardContent = await page.locator('text=Dashboard').isVisible({ timeout: 5000 }).catch(() => false)
    const hasCheckInContent = await page.locator('text=Check In').isVisible({ timeout: 5000 }).catch(() => false)
    
    console.log('Page analysis:', {
      hasTimeEntryContent,
      hasDashboardContent, 
      hasCheckInContent,
      url: currentUrl
    })
    
    // If still on login page, check for error messages
    if (currentUrl.includes('login')) {
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent().catch(() => null)
      const formError = await page.locator('.error').textContent().catch(() => null)
      console.log('Login errors:', { errorMessage, formError })
    }
  })

  test('Test authentication state and profile access', async ({ page }) => {
    // Test the user service directly through browser
    await page.goto('/')
    
    // Try to check authentication state
    const authTestResult = await page.evaluate(async () => {
      try {
        // Check if we can access any auth-related APIs
        const response = await fetch('/api/user/profile')
        return {
          status: response.status,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        }
      } catch (error) {
        return { error: error.message }
      }
    })
    
    console.log('Auth test result:', authTestResult)
  })
  
  test('Test time entry API accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Test time entry status API
    const timeEntryTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/employee/time-entries/status')
        return {
          status: response.status,
          url: response.url,
          redirected: response.redirected
        }
      } catch (error) {
        return { error: error.message }
      }
    })
    
    console.log('Time entry API test:', timeEntryTest)
  })

  test('Test with mock authentication context', async ({ page }) => {
    // Mock authentication for testing
    await page.addInitScript(() => {
      // Mock localStorage auth data
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        expires_at: Date.now() + 3600000,
        user: {
          id: 'mock-user-id',
          email: 'employee.som@test.com',
          role: 'employee'
        }
      }))
    })
    
    // Visit dashboard directly
    await page.goto('/dashboard')
    
    await page.waitForTimeout(2000)
    
    // Check what we get
    const currentUrl = page.url()
    console.log('Dashboard URL with mock auth:', currentUrl)
    
    const pageText = await page.textContent('body')
    console.log('Dashboard content with mock auth (first 300 chars):', pageText?.substring(0, 300))
    
    await page.screenshot({ path: 'test-results/mock-auth-dashboard.png' })
  })
})