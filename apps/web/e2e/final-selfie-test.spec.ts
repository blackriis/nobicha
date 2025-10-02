import { test, expect } from '@playwright/test'

/**
 * Final E2E Test for Selfie Capture Workflow
 * This test attempts the complete selfie capture workflow
 */
test.describe('Final Selfie Capture Workflow Test', () => {

  test('Complete selfie capture workflow with location bypass', async ({ page, context }) => {
    // Grant all necessary permissions
    await context.grantPermissions(['camera', 'geolocation'])
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 })
    
    // Mock GPS API to return fixed position immediately 
    await page.addInitScript(() => {
      const mockPosition = {
        coords: {
          latitude: 13.7563,
          longitude: 100.5018,
          accuracy: 10
        },
        timestamp: Date.now()
      }
      
      // Override getCurrentPosition to return mock data immediately
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) => {
            console.log('🎯 Mock GPS called - returning สาขาสีลม position')
            setTimeout(() => success(mockPosition), 100)
          },
          watchPosition: () => 1,
          clearWatch: () => {}
        },
        writable: true
      })
    })
    
    console.log('🚀 Starting complete selfie capture workflow test')
    
    // Step 1: Login
    console.log('📝 Step 1: Employee login')
    await page.goto('/login/employee')
    await page.fill('input[type="email"]', 'employee.som@test.com')
    await page.fill('input[type="password"]', 'Employee123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
    console.log('✅ Login successful - Dashboard loaded')
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/dashboard-loaded.png' })
    
    // Step 2: Find and interact with check-in UI
    console.log('🔍 Step 2: Looking for check-in interface')
    
    // Wait for page to load completely
    await page.waitForTimeout(3000)
    
    // Look for various check-in related elements
    const checkInButton = await page.locator('[data-testid="checkin-button"]').isVisible({ timeout: 5000 }).catch(() => false)
    const checkInTextOld = await page.locator('button:has-text("เข้างาน")').first().isVisible({ timeout: 5000 }).catch(() => false)
    const checkInText = await page.locator('text=เช็คอิน + เซลฟี่').first().isVisible({ timeout: 5000 }).catch(() => false)
    const timeEntryCard = await page.locator('[data-testid="time-entry-card"]').isVisible({ timeout: 5000 }).catch(() => false)
    const checkInCard = await page.locator('[data-testid="checkin-card"]').isVisible({ timeout: 5000 }).catch(() => false)
    
    console.log('UI Elements found:', {
      checkInButton,
      checkInTextOld,
      checkInText,
      timeEntryCard,
      checkInCard
    })
    
    // Try to bypass location permission requirement
    if (await page.locator('text=การเข้าถึงตำแหน่งถูกปฏิเสธ').isVisible({ timeout: 2000 })) {
      console.log('🌍 Location permission issue detected, trying manual location input')
      
      // Look for manual location input button
      const manualLocationBtn = page.locator('button:has-text("กรอกตำแหน่งด้วยตนเอง")')
      if (await manualLocationBtn.isVisible({ timeout: 2000 })) {
        await manualLocationBtn.click()
        console.log('✅ Clicked manual location input')
        
        // Fill manual coordinates
        await page.fill('input[placeholder*="latitude"]', '13.7563')
        await page.fill('input[placeholder*="longitude"]', '100.5018')
        await page.click('button:has-text("บันทึกตำแหน่ง")')
        console.log('✅ Manual location set')
        await page.waitForTimeout(2000)
      }
    }
    
    // Take screenshot after location handling
    await page.screenshot({ path: 'test-results/after-location-handling.png' })
    
    // Step 3: Try to start check-in process
    console.log('⏰ Step 3: Attempting to start check-in process')
    
    // Look for any clickable element related to check-in OR check-out
    const possibleActionElements = [
      'button:has-text("เช็คอิน + เซลฟี่")',
      'button:has-text("เช็คเอาท์ + เซลฟี่")', 
      'button:has-text("เช็คอินที่สาขาใหม่")',
      'button:has-text("เข้างาน")',
      'button:has-text("Check In")',
      '[data-testid="check-in-button"]',
      '[data-testid="checkin-button"]',
      'button:has-text("ลงเวลาเข้างาน")',
      '.check-in-button'
    ]
    
    let actionStarted = false
    let actionType = 'unknown'
    for (const selector of possibleActionElements) {
      try {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`Found action element: ${selector}`)
          if (selector.includes('เช็คเอาท์')) {
            actionType = 'checkout'
          } else if (selector.includes('เช็คอิน')) {
            actionType = 'checkin'
          }
          await element.click()
          console.log(`✅ Clicked action element (${actionType})`)
          actionStarted = true
          break
        }
      } catch (error) {
        console.log(`Element ${selector} not found or clickable`)
      }
    }
    
    if (!actionStarted) {
      console.log('❌ Could not start action process - no clickable elements found')
      
      // Debug: Get all buttons on the page
      const allButtons = await page.locator('button').all()
      console.log(`Total buttons found: ${allButtons.length}`)
      
      for (let i = 0; i < Math.min(5, allButtons.length); i++) {
        const buttonText = await allButtons[i].textContent().catch(() => 'no text')
        const buttonVisible = await allButtons[i].isVisible().catch(() => false)
        console.log(`Button ${i}: "${buttonText}" (visible: ${buttonVisible})`)
      }
    } else {
      // Step 4: Handle branch selection or selfie capture 
      console.log(`🔄 Step 4: Handling ${actionType} workflow`)
      await page.waitForTimeout(2000)
      
      // For checkout, look directly for selfie interface
      if (actionType === 'checkout') {
        console.log('📸 Looking for immediate selfie capture for checkout')
      } else {
        // For check-in, look for branch selection first
        console.log('🏢 Looking for branch selection for check-in')
      }
      
      // Look for branch selection (check-in flow)
      const branchSelectVisible = await page.locator('text=เลือกสาขาสำหรับ Check-In').isVisible({ timeout: 3000 }).catch(() => false)
      
      if (branchSelectVisible) {
        console.log('🏢 Branch selection required')
        
        // Look for branch radio buttons (updated selector)
        const branchRadios = page.locator('[type="radio"][name="branch"]')
        const branchCount = await branchRadios.count().catch(() => 0)
        console.log(`Found ${branchCount} branch radio options`)
        
        if (branchCount > 0) {
          // Select the first available branch (should be สาขาสีลม)
          await branchRadios.first().click()
          console.log('✅ Selected branch via radio button')
          
          // Click confirm check-in button
          const confirmBtn = page.locator('button:has-text("ยืนยัน Check-In")')
          if (await confirmBtn.isVisible({ timeout: 3000 })) {
            await confirmBtn.click()
            console.log('✅ Clicked ยืนยัน Check-In button')
          } else {
            console.log('❌ Could not find ยืนยัน Check-In button')
          }
        } else {
          console.log('❌ Could not find branch radio options')
        }
        
        await page.waitForTimeout(1000)
      }
      
      // Step 5: Look for selfie capture interface
      console.log('📸 Step 5: Looking for selfie capture interface')
      await page.waitForTimeout(3000)
      
      // Check for any error messages first
      const errorMsg = await page.locator('text=ไม่สามารถเข้าถึงตำแหน่งได้').isVisible({ timeout: 1000 }).catch(() => false)
      const gpsError = await page.locator('text=เบราว์เซอร์ไม่รองรับ GPS').isVisible({ timeout: 1000 }).catch(() => false)
      const generalError = await page.locator('.error, [class*="error"]').isVisible({ timeout: 1000 }).catch(() => false)
      
      console.log('Error checks:', { errorMsg, gpsError, generalError })
      
      if (errorMsg || gpsError || generalError) {
        console.log('⚠️ GPS/Location error detected in UI')
        const errorText = await page.locator('.error, [class*="error"], text*="ไม่สามารถ", text*="error"').first().textContent().catch(() => 'Unknown error')
        console.log('Error text:', errorText)
      }
      
      const selfieCapture = await page.locator('[data-testid="selfie-capture"]').isVisible({ timeout: 5000 }).catch(() => false)
      const cameraPreview = await page.locator('video').isVisible({ timeout: 5000 }).catch(() => false)
      const cameraPermissionRequest = await page.locator('text=กรุณาอนุญาตให้เข้าถึงกล้อง').isVisible({ timeout: 5000 }).catch(() => false)
      
      console.log('Selfie interface status:', {
        selfieCapture,
        cameraPreview,
        cameraPermissionRequest
      })
      
      // Take screenshot of selfie interface
      await page.screenshot({ path: 'test-results/selfie-interface.png' })
      
      if (cameraPreview) {
        console.log('📷 Camera preview found - attempting to capture selfie')
        
        // Look for capture button
        const captureButton = page.locator('button[data-testid="capture-selfie"]')
        if (await captureButton.isVisible({ timeout: 3000 })) {
          await captureButton.click()
          console.log('✅ Selfie captured')
          
          // Look for preview and confirm
          await page.waitForTimeout(1000)
          const previewImage = await page.locator('img[data-testid="selfie-preview"]').isVisible({ timeout: 3000 }).catch(() => false)
          
          if (previewImage) {
            console.log('🖼️ Selfie preview displayed')
            
            const confirmButton = page.locator('button[data-testid="confirm-selfie"]')
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click()
              console.log('✅ Selfie confirmed')
              
              // Wait for upload completion
              await page.waitForTimeout(3000)
              
              // Check for upload success
              const uploadSuccess = await page.locator('text=อัปโหลดสำเร็จ').isVisible({ timeout: 10000 }).catch(() => false)
              console.log('Upload success:', uploadSuccess)
              
              // Take final screenshot
              await page.screenshot({ path: 'test-results/final-selfie-result.png' })
            }
          }
        }
      }
    }
    
    // Final analysis
    console.log('🎯 Test completed - analyzing final state')
    const finalUrl = page.url()
    const finalPageContent = await page.textContent('body')
    
    console.log('Final test results:', {
      url: finalUrl,
      actionStarted,
      actionType,
      pageContentPreview: finalPageContent?.substring(0, 200)
    })
  })
})