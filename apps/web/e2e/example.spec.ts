import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Check that the page loads
  await expect(page).toHaveTitle(/Employee Management System/)
})