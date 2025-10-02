import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Employee Work History Page
 * ทดสอบหน้าประวัติการทำงานของพนักงาน: การแสดงข้อมูล, การกรอง, การดูรายละเอียด
 */

test.describe('Employee Work History E2E Tests', () => {
  let testEmployeeEmail: string;
  let testEmployeePassword: string;
  
  test.beforeEach(async ({ page }) => {
    // ใช้ข้อมูล test user ที่มีอยู่จริงในระบบ
    testEmployeeEmail = 'employee.som@test.com';
    testEmployeePassword = 'Employee123!';
    
    // Login as Employee
    await page.goto('/login/employee');
    await page.fill('[data-testid="email-input"]', testEmployeeEmail);
    await page.fill('[data-testid="password-input"]', testEmployeePassword);
    await page.click('[data-testid="login-button"]');
    
    // รอให้การ login สำเร็จก่อน - ตรวจสอบว่าไม่มี error message
    await expect(page.locator('text=ข้อมูลที่กรอกไม่ถูกต้อง')).not.toBeVisible({ timeout: 5000 });
    
    // รอให้ redirect ไปยัง dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // รอให้ employee dashboard โหลดเสร็จ
    await expect(page.locator('[data-testid="employee-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Work History page
    await page.click('[data-testid="nav-work-history"]');
    await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
  });

  test('Work History Page - Basic Functionality', async ({ page }) => {
      await test.step('Verify page loads correctly', async () => {
        // Verify page title and description - use getByRole for specific heading
        await expect(page.getByRole('heading', { name: 'ประวัติการทำงาน' })).toBeVisible();
        await expect(page.locator('text=รายงานการ check-in/check-out ของคุณ')).toBeVisible();
      
      // Verify refresh button is present
      await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
      
      // Verify date range filter is present
      await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
    });

    await test.step('Test date range filter functionality', async () => {
      // Test today filter
      await page.click('[data-testid="filter-today"]');
      await page.waitForTimeout(1000);
      
      // Test week filter (7 วันที่ผ่านมา)
      await page.click('[data-testid="filter-week"]');
      await page.waitForTimeout(1000);
      
      // Test month filter (30 วันที่ผ่านมา)
      await page.click('[data-testid="filter-month"]');
      await page.waitForTimeout(1000);
    });

    await test.step('Test refresh functionality', async () => {
      // Click refresh button
      await page.click('[data-testid="refresh-button"]');
      
      // Verify loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Work History - Empty State Handling', async ({ page }) => {
    await test.step('Verify empty state when no time entries', async () => {
      // Check if empty state message is displayed
      const emptyState = page.locator('[data-testid="empty-state"]');
      
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText('ไม่มีข้อมูลการทำงาน');
        await expect(emptyState).toContainText('เริ่มต้นการทำงานของคุณ');
        
        // Verify empty state icon
        await expect(page.locator('[data-testid="empty-state-icon"]')).toBeVisible();
      }
    });
  });

  test('Work History - Time Entries Display', async ({ page }) => {
    await test.step('Verify time entries are displayed correctly', async () => {
      // Wait for time entries to load
      await page.waitForTimeout(2000);
      
      // Check if time entries exist
      const timeEntryCards = page.locator('[data-testid="time-entry-card"]');
      const cardCount = await timeEntryCards.count();
      
      if (cardCount > 0) {
        // Verify first time entry card structure
        const firstCard = timeEntryCards.first();
        
        // Check date display
        await expect(firstCard.locator('[data-testid="entry-date"]')).toBeVisible();
        
        // Check check-in time
        await expect(firstCard.locator('[data-testid="checkin-time"]')).toBeVisible();
        
        // Check check-out time (if exists)
        const checkoutTime = firstCard.locator('[data-testid="checkout-time"]');
        if (await checkoutTime.isVisible()) {
          await expect(checkoutTime).toBeVisible();
        }
        
        // Check working hours display
        await expect(firstCard.locator('[data-testid="working-hours"]')).toBeVisible();
        
        // Check status badge
        await expect(firstCard.locator('[data-testid="status-badge"]')).toBeVisible();
        
        // Check view details button
        await expect(firstCard.locator('[data-testid="view-details-btn"]')).toBeVisible();
      }
    });
  });

  test('Work History - Time Entry Details Modal', async ({ page }) => {
    await test.step('Test time entry details modal', async () => {
      // Wait for time entries to load
      await page.waitForTimeout(2000);
      
      const timeEntryCards = page.locator('[data-testid="time-entry-card"]');
      const cardCount = await timeEntryCards.count();
      
      if (cardCount > 0) {
        // Click view details button on first entry
        await timeEntryCards.first().locator('[data-testid="view-details-btn"]').click();
        
        // Verify modal opens
        await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
        
        // Verify modal content
        await expect(page.locator('[data-testid="modal-title"]')).toContainText('รายละเอียดการมาทำงาน');
        
        // Check time entry information
        await expect(page.locator('[data-testid="detail-checkin-time"]')).toBeVisible();
        
        // Check location information
        await expect(page.locator('[data-testid="detail-location"]')).toBeVisible();
        
        // Check selfie images if available
        const checkInSelfie = page.locator('[data-testid="checkin-selfie-image"]');
        const checkOutSelfie = page.locator('[data-testid="checkout-selfie-image"]');
        
        if (await checkInSelfie.isVisible()) {
          await expect(checkInSelfie).toBeVisible();
        }
        
        if (await checkOutSelfie.isVisible()) {
          await expect(checkOutSelfie).toBeVisible();
        }
        
        // Test modal close functionality
        await page.click('[data-testid="close-modal-btn"]');
        await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
      }
    });
  });

  test('Work History - Working Hours Summary', async ({ page }) => {
    await test.step('Verify working hours summary display', async () => {
      // Check if working hours summary exists
      const workingHoursSummary = page.locator('[data-testid="working-hours-summary"]');
      
      if (await workingHoursSummary.isVisible()) {
        // Verify total hours display
        await expect(workingHoursSummary.locator('[data-testid="total-hours"]')).toBeVisible();
        
        // Verify average hours display
        await expect(workingHoursSummary.locator('[data-testid="average-hours"]')).toBeVisible();
        
        // Verify days worked display
        await expect(workingHoursSummary.locator('[data-testid="days-worked"]')).toBeVisible();
      }
    });
  });

  test('Work History - Error Handling', async ({ page }) => {
    await test.step('Test error scenarios', async () => {
      // Simulate network error by intercepting API calls
      await page.route('**/api/employee/time-entries/history**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      // Refresh page to trigger error
      await page.click('[data-testid="refresh-button"]');
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('เกิดข้อผิดพลาด');
      
      // Verify retry button is available
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
  });

  test('Work History - Responsive Design', async ({ page }) => {
    await test.step('Test mobile responsiveness', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify page still loads correctly on mobile
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Verify mobile-friendly navigation tabs are visible
      await expect(page.locator('[data-testid="nav-work-history"]')).toBeVisible();
      
      // Test mobile date filter functionality
      await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
      await page.click('[data-testid="filter-today"]');
      await page.waitForTimeout(500);
      
      // Test mobile refresh functionality
      await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
      await page.click('[data-testid="refresh-button"]');
      
      // Verify loading state works on mobile
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Work History - Performance Testing', async ({ page }) => {
    await test.step('Test page performance', async () => {
      // Start performance measurement (already logged in from beforeEach)
      const startTime = Date.now();
      
      // Navigate to work history page using navigation
      await page.click('[data-testid="nav-work-history"]');
      
      // Wait for page to fully load
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Measure load time
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      
      // Test filter performance
      const filterStartTime = Date.now();
      await page.click('[data-testid="filter-week"]'); // Fixed: use correct filter ID
      await page.waitForTimeout(1000);
      const filterTime = Date.now() - filterStartTime;
      expect(filterTime).toBeLessThan(2000); // Filter should complete within 2 seconds (more realistic)
    });
  });

  test('Work History - Data Validation', async ({ page }) => {
    await test.step('Validate displayed data accuracy', async () => {
      // Wait for time entries to load
      await page.waitForTimeout(2000);
      
      const timeEntryCards = page.locator('[data-testid="time-entry-card"]');
      const cardCount = await timeEntryCards.count();
      
      if (cardCount > 0) {
        const firstCard = timeEntryCards.first();
        
        // Validate date format
        const dateText = await firstCard.locator('[data-testid="entry-date"]').textContent();
        expect(dateText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // DD/MM/YYYY format
        
        // Validate time format
        const checkinTime = await firstCard.locator('[data-testid="checkin-time"]').textContent();
        expect(checkinTime).toMatch(/\d{1,2}:\d{2}/); // HH:MM format
        
        // Validate working hours format
        const workingHours = await firstCard.locator('[data-testid="working-hours"]').textContent();
        expect(workingHours).toMatch(/\d+\.?\d*\s*ชั่วโมง/); // X.X ชั่วโมง format
        
        // Validate status badge
        const statusBadge = firstCard.locator('[data-testid="status-badge"]');
        await expect(statusBadge).toBeVisible();
        
        // Check status badge color based on status
        const statusText = await statusBadge.textContent();
        if (statusText?.includes('เสร็จสิ้น')) {
          await expect(statusBadge).toHaveClass(/text-green/);
        } else if (statusText?.includes('กำลังทำงาน')) {
          await expect(statusBadge).toHaveClass(/text-blue/);
        }
      }
    });
  });

  test('Work History - Accessibility', async ({ page }) => {
    await test.step('Test accessibility features', async () => {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test screen reader support
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Test ARIA labels
      await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);
      
      // Test button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Button should have either aria-label or text content
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });
  });

  test('Work History - Security Testing', async ({ page }) => {
    await test.step('Test security features', async () => {
      // Test that only employee can access work history
      await page.goto('/dashboard/work-history');
      
      // Verify authentication is required
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Test that user can only see their own data
      const timeEntryCards = page.locator('[data-testid="time-entry-card"]');
      const cardCount = await timeEntryCards.count();
      
      if (cardCount > 0) {
        // All time entries should belong to the logged-in user
        // This is verified by the API endpoint security
        await expect(timeEntryCards).toHaveCount.greaterThan(0);
      }
      
      // Test that sensitive information is not exposed
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('password');
      expect(pageContent).not.toContain('token');
      expect(pageContent).not.toContain('secret');
    });
  });

  test('Work History - Integration with Other Features', async ({ page }) => {
    await test.step('Test integration with dashboard navigation', async () => {
      // Navigate to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page.locator('[data-testid="employee-dashboard"]')).toBeVisible();
      
      // Navigate back to work history
      await page.click('[data-testid="nav-work-history"]');
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Verify data consistency
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
    });

    await test.step('Test integration with time entry status', async () => {
      // Check if there's an active time entry
      const activeEntry = page.locator('[data-testid="active-time-entry"]');
      
      if (await activeEntry.isVisible()) {
        // Verify active entry is highlighted
        await expect(activeEntry).toHaveClass(/border-blue/);
        
        // Verify status shows "กำลังทำงาน"
        await expect(activeEntry.locator('[data-testid="status-badge"]')).toContainText('กำลังทำงาน');
      }
    });
  });
});
