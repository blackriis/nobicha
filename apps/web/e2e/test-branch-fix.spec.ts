import { test, expect } from '@playwright/test'

/**
 * Test the branch fix by mocking GPS directly in the page
 */
test.describe('Branch Selection Fix Validation', () => {

  test('Test branch selection with mocked GPS', async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['camera', 'geolocation'])
    
    // Mock GPS position to near สาขาสีลม location
    await context.setGeolocation({ latitude: 14.0688866, longitude: 101.1345181 })
    
    console.log('🚀 Testing branch selection with fixed coordinates')
    
    // Mock GPS API to return fixed position
    await page.addInitScript(() => {
      const mockPosition = {
        coords: {
          latitude: 14.0688866,
          longitude: 101.1345181,
          accuracy: 10
        },
        timestamp: Date.now()
      }
      
      // Override getCurrentPosition to return mock data immediately
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) => {
            console.log('🎯 Mock GPS called with position:', mockPosition)
            setTimeout(() => success(mockPosition), 100)
          },
          watchPosition: () => 1,
          clearWatch: () => {}
        },
        writable: true
      })
    })
    
    // Step 1: Login
    console.log('📝 Step 1: Employee login')
    await page.goto('/login/employee')
    await page.fill('input[type="email"]', 'employee.som@test.com')
    await page.fill('input[type="password"]', 'Employee123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
    console.log('✅ Login successful')
    
    // Step 2: Click check-in
    console.log('🔍 Step 2: Starting check-in process')
    await page.waitForTimeout(2000) // Wait for page to load
    
    const checkInButton = page.locator('button:has-text("เช็คอิน + เซลฟี่")')
    await checkInButton.waitFor({ state: 'visible', timeout: 5000 })
    await checkInButton.click()
    console.log('✅ Check-in button clicked')
    
    // Step 3: Wait for branch selector and check if branches load
    console.log('🏢 Step 3: Waiting for branch selector')
    
    // Wait for branch selector to appear
    await page.waitForSelector('text=เลือกสาขาสำหรับ Check-In', { timeout: 10000 })
    console.log('✅ Branch selector appeared')
    
    // Wait a bit for branches to load
    await page.waitForTimeout(5000)
    
    // Look for branches
    const branchOptions = page.locator('[type="radio"][name="branch"]')
    const branchCount = await branchOptions.count()
    console.log(`📍 Found ${branchCount} branch options`)
    
    // Also check for branch names
    const silamBranch = page.locator('text=สาขาสีลม')
    const silamVisible = await silamBranch.isVisible()
    console.log(`🏢 สาขาสีลม visible: ${silamVisible}`)
    
    // Check for any error messages
    const errorMsg = page.locator('text=ไม่สามารถโหลดข้อมูลสาขาได้')
    const hasError = await errorMsg.isVisible()
    console.log(`❌ Error message visible: ${hasError}`)
    
    // Check loading state
    const loading = page.locator('text=กำลังค้นหาสาขาใกล้เคียง')
    const isLoading = await loading.isVisible()
    console.log(`⏳ Loading state visible: ${isLoading}`)
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/branch-selection-debug.png' })
    
    if (branchCount > 0) {
      console.log('✅ SUCCESS: Branches loaded correctly!')
      
      // Try to select and proceed
      await branchOptions.first().click()
      console.log('✅ Branch selected')
      
      // Look for confirm button
      const confirmBtn = page.locator('button:has-text("ยืนยัน Check-In")')
      if (await confirmBtn.isVisible()) {
        console.log('✅ Confirm button available')
      }
    } else {
      console.log('❌ FAILED: No branches loaded')
      
      // Debug: check what's in the branch selector area
      const branchSelectorContent = await page.locator('[role="main"] [data-testid], .card, [class*="card"]').allTextContents()
      console.log('Branch selector content:', branchSelectorContent.slice(0, 3))
    }
    
    // Final validation
    expect(branchCount).toBeGreaterThan(0)
  })
})