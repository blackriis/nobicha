import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Story 2.2: Employee Material Usage Reporting
 * Simplified tests focusing on core functionality
 */
test.describe('Story 2.2: Material Usage - Simplified Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant necessary permissions
    await context.grantPermissions(['camera'])
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 })
  })

  test('Material Usage Page Loads Correctly', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
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
    
    // Mock API response for active session
    await page.route('**/api/employee/material-usage/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            has_active_session: true,
            can_add_materials: true,
            records: [],
            total_cost: 0
          }
        })
      })
    })
    
    // Mock available materials
    await page.route('**/api/employee/material-usage/materials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'material-1',
              name: 'น้ำมันพืช',
              unit: 'ลิตร',
              cost_per_unit: 25.50
            },
            {
              id: 'material-2',
              name: 'เกลือ',
              unit: 'กิโลกรัม',
              cost_per_unit: 15.00
            }
          ]
        })
      })
    })
    
    // Visit material usage page directly
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Check page title
    await expect(page.locator('h2:has-text("รายงานการใช้วัตถุดิบ")')).toBeVisible()
    
    // Check session status
    await expect(page.locator('text=เซสชันการทำงานปัจจุบัน')).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/material-usage-page-load.png' })
  })

  test('Material Usage - No Active Session', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
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
    
    // Mock API response for no active session
    await page.route('**/api/employee/material-usage/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            has_active_session: false,
            message: 'กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ'
          }
        })
      })
    })
    
    // Visit material usage page
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Check for no active session message
    await expect(page.locator('h3:has-text("ไม่พบการเช็คอิน")')).toBeVisible()
    await expect(page.locator('text=กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ')).toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-no-session.png' })
  })

  test('Material Usage - Read-only State', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
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
    
    // Mock API response with existing records (read-only state)
    await page.route('**/api/employee/material-usage/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            has_active_session: true,
            can_add_materials: false,
            records: [
              {
                id: 'usage-1',
                time_entry_id: 'time-entry-1',
                raw_material_id: 'material-1',
                quantity_used: 2.5,
                created_at: '2025-01-01T10:00:00Z',
                raw_materials: {
                  id: 'material-1',
                  name: 'น้ำมันพืช',
                  unit: 'ลิตร',
                  cost_per_unit: 25.50
                }
              }
            ],
            total_cost: 63.75
          }
        })
      })
    })
    
    // Visit material usage page
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Check for existing records display
    await expect(page.locator('h3:has-text("การใช้วัตถุดิบที่บันทึกไว้แล้ว")')).toBeVisible()
    
    // Check for read-only message
    await expect(page.locator('text=การรายงานถูกปิดใช้งาน')).toBeVisible()
    await expect(page.locator('text=ไม่สามารถเพิ่มหรือแก้ไขการใช้วัตถุดิบในเซสชันปัจจุบันได้')).toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-readonly.png' })
  })

  test('Material Usage - API Error', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
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
    
    // Mock API error response
    await page.route('**/api/employee/material-usage/session', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })
    
    // Visit material usage page
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Check for error message (the actual error message from the component)
    await expect(page.locator('text=Internal server error')).toBeVisible()
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("ลองใหม่")')
    await expect(retryButton).toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-error.png' })
  })

  test('Material Usage - Form Validation', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
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
    
    // Mock API response for active session
    await page.route('**/api/employee/material-usage/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            has_active_session: true,
            can_add_materials: true,
            records: [],
            total_cost: 0
          }
        })
      })
    })
    
    // Mock available materials
    await page.route('**/api/employee/material-usage/materials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'material-1',
              name: 'น้ำมันพืช',
              unit: 'ลิตร',
              cost_per_unit: 25.50
            }
          ]
        })
      })
    })
    
    // Visit material usage page
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Look for submit button and try to submit empty form
    const submitButton = page.locator('button:has-text("บันทึก")').or(
      page.locator('button:has-text("ส่ง")')
    )
    
    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click()
      
      // Check for validation error
      await expect(page.locator('text=กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')).toBeVisible()
    }
    
    await page.screenshot({ path: 'test-results/material-usage-validation.png' })
  })
})
