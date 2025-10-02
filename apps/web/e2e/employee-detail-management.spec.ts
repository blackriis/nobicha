import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Employee Detail Management
 * ทดสอบการดูรายละเอียดพนักงาน: ข้อมูลพื้นฐาน, ประวัติการทำงาน, การแก้ไข
 */

test.describe('Employee Detail Management E2E Tests', () => {
  let testEmployeeId: string;
  
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for admin dashboard to load
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Employees page to get a valid employee ID
    await page.click('[data-testid="nav-employees"]');
    await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    
    // Get first employee ID from the table
    const firstRow = page.locator('[data-testid="employee-table"] tbody tr').first();
    const viewBtn = firstRow.locator('[data-testid="view-employee-btn"]');
    await viewBtn.click();
    
    // Extract employee ID from URL
    const currentUrl = page.url();
    const urlMatch = currentUrl.match(/\/admin\/employees\/([a-f0-9-]+)/);
    if (urlMatch) {
      testEmployeeId = urlMatch[1];
    }
    
    // Verify we're on employee detail page
    await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
  });

  test('Employee Detail Page Load and Display', async ({ page }) => {
    await test.step('Verify page structure', async () => {
      // Check page title
      await expect(page.locator('h1')).toContainText('รายละเอียดพนักงาน');
      
      // Verify main sections are visible
      await expect(page.locator('[data-testid="employee-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-actions"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
      
      // Verify action buttons
      await expect(page.locator('[data-testid="edit-employee-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-to-list-btn"]')).toBeVisible();
    });

    await test.step('Verify employee basic information', async () => {
      // Check that employee information is displayed
      await expect(page.locator('[data-testid="employee-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-role"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-branch"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-hire-date"]')).toBeVisible();
      
      // Check that information is not empty
      const nameText = await page.locator('[data-testid="employee-name"]').textContent();
      const emailText = await page.locator('[data-testid="employee-email"]').textContent();
      
      expect(nameText).toBeTruthy();
      expect(emailText).toBeTruthy();
      expect(emailText).toContain('@');
    });

    await test.step('Verify employee status display', async () => {
      // Check status badge
      const statusBadge = page.locator('[data-testid="employee-status"]');
      await expect(statusBadge).toBeVisible();
      
      // Verify status is either active or inactive
      const statusText = await statusBadge.textContent();
      expect(['active', 'inactive', 'ใช้งาน', 'ไม่ใช้งาน']).toContain(statusText?.toLowerCase());
    });
  });

  test('Employee Time Entries Section', async ({ page }) => {
    await test.step('Verify time entries section', async () => {
      // Check section header
      await expect(page.locator('[data-testid="time-entries-section"] h2')).toContainText('ประวัติการมาทำงาน');
      
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
        await expect(page.locator('[data-testid="time-entry-actions-header"]')).toBeVisible();
        
        // Check if there are time entries
        const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
        const rowCount = await timeEntryRows.count();
        
        if (rowCount > 0) {
          // Verify first row has all required data
          const firstRow = timeEntryRows.first();
          await expect(firstRow.locator('[data-testid="time-entry-date"]')).toBeVisible();
          await expect(firstRow.locator('[data-testid="time-entry-checkin"]')).toBeVisible();
          await expect(firstRow.locator('[data-testid="time-entry-status"]')).toBeVisible();
          await expect(firstRow.locator('[data-testid="view-time-entry-btn"]')).toBeVisible();
        }
      } else {
        // Verify empty state
        await expect(page.locator('[data-testid="no-time-entries"]')).toBeVisible();
      }
    });

    await test.step('Test time entries loading state', async () => {
      // Check if loading spinner appears initially
      const loadingSpinner = page.locator('[data-testid="time-entries-loading"]');
      const isLoading = await loadingSpinner.isVisible();
      
      if (isLoading) {
        // Wait for loading to complete
        await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('Time Entry Detail Modal', async ({ page }) => {
    await test.step('Open time entry detail modal', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount > 0) {
        // Click view button on first time entry
        await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
        
        // Verify modal opens
        await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="modal-title"]')).toContainText('รายละเอียดการมาทำงาน');
      }
    });

    await test.step('Verify modal content', async () => {
      const modal = page.locator('[data-testid="time-entry-detail-modal"]');
      const modalExists = await modal.isVisible();
      
      if (modalExists) {
        // Check basic information section
        await expect(page.locator('[data-testid="time-entry-basic-info"]')).toBeVisible();
        
        // Check for selfie images
        const checkInImage = page.locator('[data-testid="checkin-selfie-image"]');
        const checkOutImage = page.locator('[data-testid="checkout-selfie-image"]');
        
        // At least one image should be visible or have fallback
        const checkInVisible = await checkInImage.isVisible();
        const checkOutVisible = await checkOutImage.isVisible();
        const checkInFallback = await page.locator('[data-testid="checkin-selfie-fallback"]').isVisible();
        const checkOutFallback = await page.locator('[data-testid="checkout-selfie-fallback"]').isVisible();
        
        expect(checkInVisible || checkInFallback || checkOutVisible || checkOutFallback).toBeTruthy();
        
        // Check location information
        await expect(page.locator('[data-testid="checkin-location"]')).toBeVisible();
        
        // Check if there are notes
        const notesSection = page.locator('[data-testid="time-entry-notes"]');
        const hasNotes = await notesSection.isVisible();
        
        if (hasNotes) {
          await expect(notesSection).toBeVisible();
        }
      }
    });

    await test.step('Test modal interactions', async () => {
      const modal = page.locator('[data-testid="time-entry-detail-modal"]');
      const modalExists = await modal.isVisible();
      
      if (modalExists) {
        // Test close button
        await page.click('[data-testid="close-modal-btn"]');
        await expect(modal).not.toBeVisible();
        
        // Reopen modal
        const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
        await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
        await expect(modal).toBeVisible();
        
        // Test clicking outside modal to close
        await page.click('[data-testid="modal-backdrop"]');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test('Employee Actions', async ({ page }) => {
    await test.step('Test edit employee button', async () => {
      // Click edit button
      await page.click('[data-testid="edit-employee-btn"]');
      
      // Verify navigation to edit page
      await expect(page.locator('[data-testid="edit-employee-page"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('แก้ไขข้อมูลพนักงาน');
      
      // Navigate back
      await page.goBack();
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
    });

    await test.step('Test back to list button', async () => {
      // Click back button
      await page.click('[data-testid="back-to-list-btn"]');
      
      // Verify navigation to employee list
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Navigate back to detail page
      await page.goto(`/admin/employees/${testEmployeeId}`);
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
    });

    await test.step('Test delete employee (if available)', async () => {
      // Check if delete button exists
      const deleteBtn = page.locator('[data-testid="delete-employee-btn"]');
      const deleteExists = await deleteBtn.isVisible();
      
      if (deleteExists) {
        // Click delete button
        await deleteBtn.click();
        
        // Verify confirmation dialog
        await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
        
        // Cancel deletion
        await page.click('[data-testid="cancel-delete-btn"]');
        await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      }
    });
  });

  test('Employee Detail Error Handling', async ({ page }) => {
    await test.step('Test invalid employee ID', async () => {
      // Navigate to invalid employee ID
      await page.goto('/admin/employees/invalid-id');
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('ไม่พบข้อมูลพนักงาน');
      
      // Verify back button works
      await page.click('[data-testid="back-to-list-btn"]');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    });

    await test.step('Test non-existent employee ID', async () => {
      // Navigate to non-existent employee ID
      await page.goto('/admin/employees/00000000-0000-0000-0000-000000000000');
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('ไม่พบข้อมูลพนักงาน');
    });

    await test.step('Test network error handling', async () => {
      // Navigate back to valid employee
      await page.goto(`/admin/employees/${testEmployeeId}`);
      
      // Simulate network failure for time entries
      await page.route('**/api/admin/employees/*/time-entries*', route => route.abort());
      
      // Reload page
      await page.reload();
      
      // Verify error handling
      await expect(page.locator('[data-testid="time-entries-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-time-entries-btn"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('**/api/admin/employees/*/time-entries*');
      await page.click('[data-testid="retry-time-entries-btn"]');
      
      // Verify time entries load successfully
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
    });
  });

  test('Employee Detail Performance', async ({ page }) => {
    await test.step('Test page load performance', async () => {
      const startTime = Date.now();
      
      // Reload page
      await page.reload();
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    await test.step('Test time entries load performance', async ({ page }) => {
      const startTime = Date.now();
      
      // Wait for time entries to load
      const timeEntriesTable = page.locator('[data-testid="time-entries-table"]');
      const noTimeEntries = page.locator('[data-testid="no-time-entries"]');
      
      await Promise.race([
        timeEntriesTable.waitFor({ state: 'visible', timeout: 5000 }),
        noTimeEntries.waitFor({ state: 'visible', timeout: 5000 })
      ]);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Time entries should load within 5 seconds
    });

    await test.step('Test modal open performance', async ({ page }) => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount > 0) {
        const startTime = Date.now();
        
        // Click view button
        await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
        
        // Wait for modal to open
        await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
        
        const openTime = Date.now() - startTime;
        expect(openTime).toBeLessThan(1000); // Modal should open within 1 second
        
        // Close modal
        await page.click('[data-testid="close-modal-btn"]');
      }
    });
  });

  test('Employee Detail Responsive Design', async ({ page }) => {
    await test.step('Test mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page
      await page.reload();
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      // Check that content is properly stacked
      await expect(page.locator('[data-testid="employee-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
      
      // Test mobile actions
      await expect(page.locator('[data-testid="edit-employee-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-to-list-btn"]')).toBeVisible();
    });

    await test.step('Test tablet viewport', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Reload page
      await page.reload();
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      // Check that layout adapts to tablet
      await expect(page.locator('[data-testid="employee-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
    });

    await test.step('Test desktop viewport', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Reload page
      await page.reload();
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      // Check that layout uses full width effectively
      await expect(page.locator('[data-testid="employee-basic-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-entries-section"]')).toBeVisible();
    });
  });
});
