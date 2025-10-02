import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Story 1.5: Selfie Capture and Check-in Record Creation
 * 
 * This test suite validates all 10 Acceptance Criteria:
 * AC1: Employee must take selfie before check-in (mandatory)
 * AC2: Employee must take selfie before check-out (mandatory)
 * AC3: System must access device front camera (request permission)
 * AC4: Selfies uploaded to Supabase Storage securely
 * AC5: System updates time_entries table with selfie URLs
 * AC6: Show preview of captured image before confirm check-in/out
 * AC7: Retry mechanism for failed uploads
 * AC8: Handle error cases: no camera, permission denied, upload failed
 * AC9: Stored images follow naming convention (employee_id, timestamp, action)
 * AC10: Clear upload status display (uploading, success, failed)
 */

test.describe('Story 1.5: Selfie Capture Workflow E2E Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    // Mock geolocation to pass GPS validation
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 })
    
    // Grant camera permissions
    await context.grantPermissions(['camera'])
    
    // Login as employee
    await page.goto('/login/employee')
    await page.fill('input[type="email"]', 'employee1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('/dashboard')
    await expect(page).toHaveTitle(/Employee Management System/)
  })

  test('AC1, AC3, AC6: Check-in requires mandatory selfie capture with camera permission and preview', async ({ page }) => {
    // Navigate to dashboard and find check-in card
    await page.goto('/dashboard')
    
    // Look for check-in button
    const checkInButton = page.locator('button:has-text("Check In")')
    await expect(checkInButton).toBeVisible()
    
    // Click check-in should trigger selfie capture workflow
    await checkInButton.click()
    
    // AC3: Camera permission should be requested/handled
    // Wait for selfie capture component to appear
    await expect(page.locator('[data-testid="selfie-capture"]')).toBeVisible({ timeout: 10000 })
    
    // AC1: Check that check-in cannot proceed without selfie
    // The check-in button should be disabled or not accessible until selfie is captured
    await expect(page.locator('button:has-text("Confirm Check In")')).toBeDisabled({ timeout: 5000 })
    
    // Look for camera video element
    const videoElement = page.locator('video[data-testid="camera-preview"]')
    await expect(videoElement).toBeVisible({ timeout: 15000 })
    
    // Capture selfie
    const captureButton = page.locator('button[data-testid="capture-selfie"]')
    await expect(captureButton).toBeVisible()
    await captureButton.click()
    
    // AC6: Preview should be shown after capture
    const previewImage = page.locator('img[data-testid="selfie-preview"]')
    await expect(previewImage).toBeVisible({ timeout: 10000 })
    
    // Confirm selfie
    const confirmButton = page.locator('button[data-testid="confirm-selfie"]')
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()
    
    // AC10: Upload status should be displayed
    await expect(page.locator('[data-testid="upload-status"]')).toBeVisible({ timeout: 5000 })
    
    // Wait for successful upload
    await expect(page.locator('text=อัปโหลดสำเร็จ')).toBeVisible({ timeout: 15000 })
    
    // Check-in should now be completable
    const finalCheckInButton = page.locator('button:has-text("ยืนยันเข้างาน")')
    await expect(finalCheckInButton).not.toBeDisabled()
    await finalCheckInButton.click()
    
    // Verify check-in success
    await expect(page.locator('text=เข้างานสำเร็จ')).toBeVisible({ timeout: 10000 })
  })

  test('AC2, AC6: Check-out requires mandatory selfie capture with preview', async ({ page }) => {
    // First, need to check-in to enable check-out
    await page.goto('/dashboard')
    
    // Complete check-in process first
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    await page.locator('button:has-text("ยืนยันเข้างาน")').click()
    await page.waitForSelector('text=เข้างานสำเร็จ')
    
    // Now test check-out
    const checkOutButton = page.locator('button:has-text("Check Out")')
    await expect(checkOutButton).toBeVisible()
    await checkOutButton.click()
    
    // AC2: Check-out requires selfie - capture component should appear
    await expect(page.locator('[data-testid="selfie-capture"]')).toBeVisible()
    
    // Capture selfie for check-out
    await page.locator('button[data-testid="capture-selfie"]').click()
    
    // AC6: Preview should be shown
    await expect(page.locator('img[data-testid="selfie-preview"]')).toBeVisible()
    
    // Confirm and complete check-out
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    await page.locator('button:has-text("ยืนยันออกงาน")').click()
    
    // Verify check-out success
    await expect(page.locator('text=ออกงานสำเร็จ')).toBeVisible()
  })

  test('AC7, AC10: Upload retry mechanism for failed uploads', async ({ page }) => {
    // Mock network failure for first upload attempts
    await page.route('**/storage/v1/object/employee-selfies/**', (route) => {
      // Fail first few requests, then succeed
      const url = route.request().url()
      if (url.includes('employee-selfies')) {
        route.abort('failed')
      }
    })
    
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // Capture selfie
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    
    // AC10: Should show upload failed status
    await expect(page.locator('text=อัปโหลดล้มเหลว')).toBeVisible({ timeout: 10000 })
    
    // AC7: Retry mechanism should be available
    const retryButton = page.locator('button[data-testid="retry-upload"]')
    await expect(retryButton).toBeVisible()
    
    // Remove network mock to allow retry success
    await page.unroute('**/storage/v1/object/employee-selfies/**')
    
    // Retry upload
    await retryButton.click()
    
    // Should succeed on retry
    await expect(page.locator('text=อัปโหลดสำเร็จ')).toBeVisible({ timeout: 15000 })
  })

  test('AC8: Handle camera permission denied error', async ({ page, context }) => {
    // Deny camera permission
    await context.clearPermissions()
    
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // AC8: Should handle permission denied gracefully
    await expect(page.locator('text=กรุณาอนุญาตให้เข้าถึงกล้อง')).toBeVisible({ timeout: 10000 })
    
    // Should provide instructions to enable camera
    await expect(page.locator('text=เปิดการอนุญาตกล้องในการตั้งค่าเบราว์เซอร์')).toBeVisible()
  })

  test('AC8: Handle no camera available error', async ({ page }) => {
    // Mock getUserMedia to simulate no camera
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => 
        Promise.reject(new Error('NotFoundError: No camera found'))
    })
    
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // AC8: Should handle no camera gracefully
    await expect(page.locator('text=ไม่พบกล้อง')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=กรุณาตรวจสอบว่าอุปกรณ์มีกล้อง')).toBeVisible()
  })

  test('AC4, AC5: Verify selfie upload to Supabase Storage and database update', async ({ page }) => {
    // Monitor network requests
    const uploadRequests = []
    const databaseRequests = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.includes('employee-selfies')) {
        uploadRequests.push(request)
      }
      if (url.includes('/api/employee/time-entries/check-in')) {
        databaseRequests.push(request)
      }
    })
    
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // Complete selfie capture
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    
    // Complete check-in
    await page.locator('button:has-text("ยืนยันเข้างาน")').click()
    await page.waitForSelector('text=เข้างานสำเร็จ')
    
    // AC4: Verify upload to Supabase Storage occurred
    expect(uploadRequests.length).toBeGreaterThan(0)
    
    // AC5: Verify database update occurred
    expect(databaseRequests.length).toBeGreaterThan(0)
    
    // Check that request included selfie URL
    const lastDbRequest = databaseRequests[databaseRequests.length - 1]
    const requestBody = lastDbRequest.postData()
    expect(requestBody).toContain('selfie')
  })

  test('AC9: Verify filename naming convention', async ({ page }) => {
    const uploadRequests = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.includes('employee-selfies') && request.method() === 'PUT') {
        uploadRequests.push(url)
      }
    })
    
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // Complete selfie capture
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    
    // AC9: Verify naming convention {employee_id}_{timestamp}_{action}.jpg
    expect(uploadRequests.length).toBeGreaterThan(0)
    
    const uploadUrl = uploadRequests[0]
    // Extract filename from URL
    const filename = uploadUrl.split('/').pop()
    
    // Should match pattern: UUID_TIMESTAMP_checkin.jpg
    const filenamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d{14}_checkin\.jpg$/
    expect(filename).toMatch(filenamePattern)
  })

  test('AC10: Upload status indicators throughout workflow', async ({ page }) => {
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // Capture selfie
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    
    // AC10: Should show uploading status
    await expect(page.locator('text=กำลังอัปโหลด')).toBeVisible()
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
    
    // Then success status
    await expect(page.locator('text=อัปโหลดสำเร็จ')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()
  })

  test('Selfie retake functionality', async ({ page }) => {
    await page.goto('/dashboard')
    const checkInButton = page.locator('button:has-text("Check In")')
    await checkInButton.click()
    
    // Capture initial selfie
    await page.locator('button[data-testid="capture-selfie"]').click()
    
    // Should show preview with retake option
    await expect(page.locator('img[data-testid="selfie-preview"]')).toBeVisible()
    
    const retakeButton = page.locator('button[data-testid="retake-selfie"]')
    await expect(retakeButton).toBeVisible()
    
    // Retake selfie
    await retakeButton.click()
    
    // Should return to camera view
    await expect(page.locator('video[data-testid="camera-preview"]')).toBeVisible()
    
    // Capture again
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    
    // Should proceed with upload
    await expect(page.locator('text=อัปโหลดสำเร็จ')).toBeVisible({ timeout: 15000 })
  })

  test('Complete workflow integration test', async ({ page }) => {
    // This test validates the complete workflow from start to finish
    await page.goto('/dashboard')
    
    // Initial state - should show available for check-in
    await expect(page.locator('text=พร้อมเข้างาน')).toBeVisible()
    
    // Start check-in
    await page.locator('button:has-text("Check In")').click()
    
    // Complete selfie workflow
    await expect(page.locator('[data-testid="selfie-capture"]')).toBeVisible()
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    
    // Complete check-in
    await page.locator('button:has-text("ยืนยันเข้างาน")').click()
    await page.waitForSelector('text=เข้างานสำเร็จ')
    
    // State should now show checked-in
    await expect(page.locator('text=เข้างานแล้ว')).toBeVisible()
    
    // Start check-out
    await page.locator('button:has-text("Check Out")').click()
    
    // Complete selfie workflow for check-out
    await page.locator('button[data-testid="capture-selfie"]').click()
    await page.locator('button[data-testid="confirm-selfie"]').click()
    await page.waitForSelector('text=อัปโหลดสำเร็จ')
    
    // Complete check-out
    await page.locator('button:has-text("ยืนยันออกงาน")').click()
    await page.waitForSelector('text=ออกงานสำเร็จ')
    
    // Should return to available state
    await expect(page.locator('text=พร้อมเข้างาน')).toBeVisible()
  })
})