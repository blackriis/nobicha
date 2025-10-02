import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Complete Employee Management Workflow
 * ทดสอบครบวงจรการจัดการพนักงาน: ดูรายชื่อ → เพิ่มพนักงาน → แก้ไข → ดูรายละเอียด → ดูประวัติการทำงาน
 */

test.describe('Employee Management Complete Workflow E2E Tests', () => {
  let testEmployeeId: string;
  let testEmployeeEmail: string;
  
  test.beforeEach(async ({ page }) => {
    // Generate unique test data for this test run
    const timestamp = Date.now();
    testEmployeeEmail = `test.employee.${timestamp}@test.com`;
    
    // Login as Admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for admin dashboard to load
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Employees page
    await page.click('[data-testid="nav-employees"]');
    await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
  });

  test('Complete Employee Management Workflow: List → Add → Edit → View Details → Time Entries', async ({ page }) => {
    
    // Step 1: Test Employee List Page
    await test.step('Test Employee List Page functionality', async () => {
      // Verify page loads correctly
      await expect(page.locator('h1')).toContainText('รายชื่อพนักงาน');
      
      // Test search functionality
      await page.fill('[data-testid="employee-search"]', 'test');
      await page.waitForTimeout(1000); // Wait for search to complete
      
      // Test filter functionality
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      
      // Test sorting
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(500);
      
      // Verify table has data
      await expect(page.locator('[data-testid="employee-table"] tbody tr')).toHaveCount.greaterThan(0);
      
      // Test pagination if available
      const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
      if (paginationExists) {
        await page.click('[data-testid="next-page"]');
        await page.waitForTimeout(500);
      }
    });

    // Step 2: Add New Employee
    await test.step('Add new employee', async () => {
      // Click Add Employee button
      await page.click('[data-testid="add-employee-btn"]');
      await expect(page.locator('h1')).toContainText('เพิ่มพนักงานใหม่');
      
      // Fill employee form
      await page.fill('[data-testid="full-name-input"]', `พนักงานทดสอบ ${Date.now()}`);
      await page.fill('[data-testid="email-input"]', testEmployeeEmail);
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.fill('[data-testid="confirm-password-input"]', 'testpassword123');
      
      // Select branch (assuming first branch is available)
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      
      // Set hourly and daily rates
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      // Submit form
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Wait for success and get employee ID from URL or response
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible({ timeout: 10000 });
      
      // Extract employee ID from current URL or success message
      const currentUrl = page.url();
      const urlMatch = currentUrl.match(/\/admin\/employees\/([a-f0-9-]+)/);
      if (urlMatch) {
        testEmployeeId = urlMatch[1];
      }
    });

    // Step 3: View Employee Details
    await test.step('View employee details', async () => {
      // Navigate to employee list if not already there
      await page.goto('/admin/employees');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Find and click on the test employee
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("${testEmployeeEmail}")`);
      await expect(employeeRow).toBeVisible();
      
      // Click view details button
      await employeeRow.locator('[data-testid="view-employee-btn"]').click();
      
      // Verify employee detail page loads
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('รายละเอียดพนักงาน');
      
      // Verify employee information is displayed
      await expect(page.locator('[data-testid="employee-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-email"]')).toContainText(testEmployeeEmail);
      await expect(page.locator('[data-testid="employee-status"]')).toBeVisible();
    });

    // Step 4: View Time Entries
    await test.step('View employee time entries', async () => {
      // Verify time entries section is visible
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
      
      // Check if time entries table exists
      const timeEntriesTable = page.locator('[data-testid="time-entries-table"]');
      const hasTimeEntries = await timeEntriesTable.isVisible();
      
      if (hasTimeEntries) {
        // Verify table headers
        await expect(page.locator('[data-testid="time-entry-date-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="time-entry-checkin-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="time-entry-checkout-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="time-entry-hours-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="time-entry-status-header"]')).toBeVisible();
        
        // Check if there are any time entries
        const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
        const rowCount = await timeEntryRows.count();
        
        if (rowCount > 0) {
          // Test viewing time entry details
          await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
          
          // Verify time entry detail modal opens
          await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
          
          // Verify modal content
          await expect(page.locator('[data-testid="modal-title"]')).toContainText('รายละเอียดการมาทำงาน');
          
          // Check for selfie images if available
          const checkInImage = page.locator('[data-testid="checkin-selfie-image"]');
          const checkOutImage = page.locator('[data-testid="checkout-selfie-image"]');
          
          if (await checkInImage.isVisible()) {
            await expect(checkInImage).toBeVisible();
          }
          
          if (await checkOutImage.isVisible()) {
            await expect(checkOutImage).toBeVisible();
          }
          
          // Verify location information
          await expect(page.locator('[data-testid="checkin-location"]')).toBeVisible();
          
          // Close modal
          await page.click('[data-testid="close-modal-btn"]');
          await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
        } else {
          // No time entries - verify empty state
          await expect(page.locator('[data-testid="no-time-entries"]')).toBeVisible();
        }
      }
    });

    // Step 5: Edit Employee
    await test.step('Edit employee information', async () => {
      // Click edit button
      await page.click('[data-testid="edit-employee-btn"]');
      
      // Verify edit page loads
      await expect(page.locator('h1')).toContainText('แก้ไขข้อมูลพนักงาน');
      
      // Update employee information
      await page.fill('[data-testid="full-name-input"]', `พนักงานทดสอบ (แก้ไขแล้ว) ${Date.now()}`);
      await page.fill('[data-testid="hourly-rate-input"]', '120');
      await page.fill('[data-testid="daily-rate-input"]', '960');
      
      // Submit changes
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      // Navigate back to employee detail to verify changes
      await page.goto(`/admin/employees/${testEmployeeId}`);
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      // Verify updated information is displayed
      await expect(page.locator('[data-testid="employee-name"]')).toContainText('แก้ไขแล้ว');
    });

    // Step 6: Test Employee List Search and Filter
    await test.step('Test advanced search and filtering', async () => {
      // Navigate back to employee list
      await page.goto('/admin/employees');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Test search by email
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      // Verify search results
      const searchResults = page.locator('[data-testid="employee-table"] tbody tr');
      await expect(searchResults).toHaveCount(1);
      await expect(searchResults.first()).toContainText(testEmployeeEmail);
      
      // Clear search
      await page.fill('[data-testid="employee-search"]', '');
      await page.waitForTimeout(1000);
      
      // Test role filter
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-employee"]');
      await page.waitForTimeout(1000);
      
      // Test status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      await page.waitForTimeout(1000);
      
      // Test branch filter
      await page.click('[data-testid="branch-filter"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.waitForTimeout(1000);
    });

    // Step 7: Test Export Functionality
    await test.step('Test export functionality', async () => {
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-employees-btn"]');
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/employees.*\.(csv|xlsx)/);
    });

    // Step 8: Cleanup - Delete Test Employee (Optional)
    await test.step('Cleanup test data', async () => {
      // Navigate to employee detail page
      await page.goto(`/admin/employees/${testEmployeeId}`);
      
      // Click delete button (if available)
      const deleteBtn = page.locator('[data-testid="delete-employee-btn"]');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Confirm deletion
        await page.click('[data-testid="confirm-delete-btn"]');
        
        // Verify success
        await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
        
        // Verify redirect to employee list
        await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      }
    });
  });

  test('Employee Management Error Handling', async ({ page }) => {
    await test.step('Test error scenarios', async () => {
      // Test invalid employee ID
      await page.goto('/admin/employees/invalid-id');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Test non-existent employee
      await page.goto('/admin/employees/00000000-0000-0000-0000-000000000000');
      await expect(page.locator('[data-testid="employee-not-found"]')).toBeVisible();
      
      // Test form validation errors
      await page.goto('/admin/employees/add');
      await page.click('[data-testid="submit-employee-btn"]');
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });

  test('Employee Management Responsive Design', async ({ page }) => {
    await test.step('Test mobile responsiveness', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to employee list
      await page.goto('/admin/employees');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-employee-list"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test mobile search
      await page.click('[data-testid="mobile-search-toggle"]');
      await expect(page.locator('[data-testid="mobile-search"]')).toBeVisible();
      
      // Test mobile filters
      await page.click('[data-testid="mobile-filters-toggle"]');
      await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
    });
  });

  test('Employee Management Performance', async ({ page }) => {
    await test.step('Test performance metrics', async () => {
      // Start performance measurement
      const startTime = Date.now();
      
      // Navigate to employee list
      await page.goto('/admin/employees');
      
      // Wait for page to fully load
      await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
      
      // Measure load time
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      
      // Test search performance
      const searchStartTime = Date.now();
      await page.fill('[data-testid="employee-search"]', 'test');
      await page.waitForTimeout(1000);
      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(1000); // Search should complete within 1 second
    });
  });
});
