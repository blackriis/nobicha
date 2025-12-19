import { Page, expect } from '@playwright/test'

/**
 * Authentication helper for E2E tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as admin user
   */
  async loginAsAdmin(email: string = 'admin@test.com', password: string = 'SecureAdmin2024!@#') {
    await this.page.goto('/login')

    // Wait for login form
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 })

    // Fill login form
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)

    // Click login button
    await this.page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await this.page.waitForURL('**/admin/**', { timeout: 15000 })

    // Verify we're logged in
    await expect(this.page).toHaveURL(/\/admin/)
  }

  /**
   * Login as employee user
   */
  async loginAsEmployee(email: string, password: string) {
    await this.page.goto('/login')

    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 })

    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)

    await this.page.click('button[type="submit"]')

    // Wait for redirect to employee dashboard
    await this.page.waitForURL('**/employee/**', { timeout: 15000 })

    await expect(this.page).toHaveURL(/\/employee/)
  }

  /**
   * Logout
   */
  async logout() {
    // Click logout button (adjust selector based on your UI)
    await this.page.click('[data-testid="logout-button"]', { timeout: 5000 }).catch(() => {
      // Fallback: navigate to logout URL directly
      return this.page.goto('/logout')
    })

    // Wait for redirect to login
    await this.page.waitForURL('**/login', { timeout: 10000 })
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const url = this.page.url()
    return !url.includes('/login')
  }
}
