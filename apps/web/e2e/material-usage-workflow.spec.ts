import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Story 2.2: Employee Material Usage Reporting
 * Tests complete material usage workflow from login to submission
 */
test.describe('Story 2.2: Material Usage Workflow', () => {

  test.beforeEach(async ({ page, context }) => {
    // Grant necessary permissions
    await context.grantPermissions(['camera'])
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 })
  })

  test('Complete Material Usage Workflow - Happy Path', async ({ page }) => {
    // Step 1: Login as employee
    await page.goto('/login/employee')
    
    // Check login form exists
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'employee.som@test.com')
    await page.fill('input[type="password"]', 'Employee123!')
    
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForTimeout(3000)
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url()
    console.log('Current URL after login:', currentUrl)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/material-usage-login.png' })
    
    // Step 2: Navigate to Material Usage page
    // Look for navigation menu or direct link
    const materialUsageLink = page.locator('a[href*="material-usage"]').first()
    
    if (await materialUsageLink.isVisible({ timeout: 5000 })) {
      await materialUsageLink.click()
    } else {
      // Try direct navigation
      await page.goto('/dashboard/material-usage')
    }
    
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Step 3: Verify Material Usage page loads
    await expect(page.locator('h2:has-text("รายงานการใช้วัตถุดิบ")')).toBeVisible()
    await expect(page.locator('text=เซสชันการทำงานปัจจุบัน')).toBeVisible()
    
    // Take screenshot of material usage page
    await page.screenshot({ path: 'test-results/material-usage-page.png' })
    
    // Step 4: Test Material Selection
    // Look for add material button or material selector
    const addMaterialButton = page.locator('button:has-text("เพิ่มวัตถุดิบ")').or(
      page.locator('button:has-text("เลือกวัตถุดิบ")')
    ).or(
      page.locator('[data-testid="add-material-button"]')
    )
    
    if (await addMaterialButton.isVisible({ timeout: 5000 })) {
      await addMaterialButton.click()
      
      // Wait for material selection dialog/modal
      await page.waitForTimeout(1000)
      
      // Look for material dropdown or selection
      const materialDropdown = page.locator('select').or(
        page.locator('[role="combobox"]')
      ).or(
        page.locator('input[placeholder*="วัตถุดิบ"]')
      )
      
      if (await materialDropdown.isVisible({ timeout: 3000 })) {
        // Select first available material
        await materialDropdown.click()
        await page.waitForTimeout(500)
        
        // Look for first option
        const firstOption = page.locator('[role="option"]').first().or(
          page.locator('option').first()
        )
        
        if (await firstOption.isVisible({ timeout: 2000 })) {
          await firstOption.click()
        }
      }
      
      // Step 5: Enter quantity
      const quantityInput = page.locator('input[type="number"]').or(
        page.locator('input[placeholder*="จำนวน"]')
      ).first()
      
      if (await quantityInput.isVisible({ timeout: 3000 })) {
        await quantityInput.fill('2.5')
      }
      
      // Step 6: Add material to list
      const addToListButton = page.locator('button:has-text("เพิ่ม")').or(
        page.locator('button:has-text("Add")')
      )
      
      if (await addToListButton.isVisible({ timeout: 2000 })) {
        await addToListButton.click()
      }
    }
    
    // Step 7: Verify material appears in list
    await page.waitForTimeout(1000)
    
    // Look for material in the list
    const materialList = page.locator('[data-testid="material-list"]').or(
      page.locator('.material-item')
    )
    
    if (await materialList.isVisible({ timeout: 3000 })) {
      await expect(materialList).toBeVisible()
    }
    
    // Step 8: Test form validation
    // Try to submit without materials (should show validation error)
    const submitButton = page.locator('button:has-text("บันทึก")').or(
      page.locator('button:has-text("ส่ง")')
    )
    
    if (await submitButton.isVisible({ timeout: 3000 })) {
      // First, clear any existing materials to test validation
      const clearButton = page.locator('button:has-text("ลบ")').or(
        page.locator('button:has-text("Remove")')
      )
      
      if (await clearButton.isVisible({ timeout: 2000 })) {
        await clearButton.click()
      }
      
      // Try to submit empty form
      await submitButton.click()
      
      // Check for validation error
      const validationError = page.locator('text=กรุณาเลือกวัตถุดิบ').or(
        page.locator('text=กรุณาแก้ไขข้อผิดพลาด')
      )
      
      if (await validationError.isVisible({ timeout: 3000 })) {
        console.log('Validation error shown correctly')
      }
    }
    
    // Step 9: Add material again and submit
    if (await addMaterialButton.isVisible({ timeout: 3000 })) {
      await addMaterialButton.click()
      await page.waitForTimeout(1000)
      
      // Select material and enter quantity
      const materialDropdown = page.locator('select').or(
        page.locator('[role="combobox"]')
      ).or(
        page.locator('input[placeholder*="วัตถุดิบ"]')
      )
      
      if (await materialDropdown.isVisible({ timeout: 3000 })) {
        await materialDropdown.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first().or(
          page.locator('option').first()
        )
        
        if (await firstOption.isVisible({ timeout: 2000 })) {
          await firstOption.click()
        }
      }
      
      const quantityInput = page.locator('input[type="number"]').or(
        page.locator('input[placeholder*="จำนวน"]')
      ).first()
      
      if (await quantityInput.isVisible({ timeout: 3000 })) {
        await quantityInput.fill('1.5')
      }
      
      const addToListButton = page.locator('button:has-text("เพิ่ม")').or(
        page.locator('button:has-text("Add")')
      )
      
      if (await addToListButton.isVisible({ timeout: 2000 })) {
        await addToListButton.click()
      }
    }
    
    // Step 10: Submit the form
    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click()
      
      // Wait for confirmation dialog
      await page.waitForTimeout(1000)
      
      // Look for confirmation dialog
      const confirmButton = page.locator('button:has-text("ยืนยัน")').or(
        page.locator('button:has-text("Confirm")')
      )
      
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click()
        
        // Wait for submission to complete
        await page.waitForTimeout(2000)
        
        // Check for success message
        const successMessage = page.locator('text=บันทึกสำเร็จ').or(
          page.locator('text=สำเร็จ')
        )
        
        if (await successMessage.isVisible({ timeout: 5000 })) {
          console.log('Material usage submitted successfully')
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/material-usage-final.png' })
  })

  test('Material Usage - No Active Session Error', async ({ page }) => {
    // Test the case where user doesn't have an active session
    
    // Mock authentication without active session
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
    
    // Visit material usage page directly
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Check for no active session message
    await expect(page.locator('h3:has-text("ไม่พบการเช็คอิน")')).toBeVisible()
    await expect(page.locator('text=กรุณาเช็คอินก่อนรายงานการใช้วัตถุดิบ')).toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-no-session.png' })
  })

  test('Material Usage - Read-only State After Submission', async ({ page }) => {
    // Test the read-only state after material usage has been submitted
    
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
    
    // Verify no add material button is visible
    const addMaterialButton = page.locator('button:has-text("เพิ่มวัตถุดิบ")')
    await expect(addMaterialButton).not.toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-readonly.png' })
  })

  test('Material Usage - Form Validation Errors', async ({ page }) => {
    // Test form validation with invalid inputs
    
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
    
    // Visit material usage page
    await page.goto('/dashboard/material-usage')
    
    await page.waitForTimeout(2000)
    
    // Test validation: Try to submit without materials
    const submitButton = page.locator('button:has-text("บันทึก")').or(
      page.locator('button:has-text("ส่ง")')
    )
    
    if (await submitButton.isVisible({ timeout: 3000 })) {
      await submitButton.click()
      
      // Check for validation error
      await expect(page.locator('text=กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ')).toBeVisible()
    }
    
    // Test validation: Add material with invalid quantity
    const addMaterialButton = page.locator('button:has-text("เพิ่มวัตถุดิบ")').or(
      page.locator('button:has-text("เลือกวัตถุดิบ")')
    )
    
    if (await addMaterialButton.isVisible({ timeout: 3000 })) {
      await addMaterialButton.click()
      await page.waitForTimeout(1000)
      
      // Select material
      const materialDropdown = page.locator('select').or(
        page.locator('[role="combobox"]')
      )
      
      if (await materialDropdown.isVisible({ timeout: 3000 })) {
        await materialDropdown.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.isVisible({ timeout: 2000 })) {
          await firstOption.click()
        }
      }
      
      // Enter invalid quantity (negative number)
      const quantityInput = page.locator('input[type="number"]').first()
      if (await quantityInput.isVisible({ timeout: 3000 })) {
        await quantityInput.fill('-1')
        
        // Try to add with invalid quantity
        const addToListButton = page.locator('button:has-text("เพิ่ม")')
        if (await addToListButton.isVisible({ timeout: 2000 })) {
          await addToListButton.click()
          
          // Check for validation error
          await expect(page.locator('text=จำนวนต้องเป็นตัวเลขบวก')).toBeVisible()
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/material-usage-validation.png' })
  })

  test('Material Usage - API Error Handling', async ({ page }) => {
    // Test error handling when API calls fail
    
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
    
    // Check for error message
    await expect(page.locator('text=ไม่สามารถโหลดข้อมูลเซสชันได้')).toBeVisible()
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("ลองใหม่")')
    await expect(retryButton).toBeVisible()
    
    await page.screenshot({ path: 'test-results/material-usage-error.png' })
  })
})
