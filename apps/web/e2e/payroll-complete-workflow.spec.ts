import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Complete Payroll Management Workflow
 * ทดสอบครบวงจรการจัดการเงินเดือน: สร้างรอบ → คำนวณ → จัดการโบนัส/หัก → ส่งออก
 */

test.describe('Payroll Complete Workflow E2E Tests', () => {
  let payrollCycleName: string;
  
  test.beforeEach(async ({ page }) => {
    // Generate unique cycle name for this test run
    const timestamp = Date.now();
    payrollCycleName = `เงินเดือนทดสอบ-${timestamp}`;
    
    // Login as Admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for admin dashboard to load
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Payroll page
    await page.click('[data-testid="nav-payroll"]');
    await expect(page.locator('[data-testid="payroll-page"]')).toBeVisible();
  });

  test('Complete Payroll Workflow: Create → Calculate → Bonus/Deduct → Export', async ({ page }) => {
    // Step 1: Create new payroll cycle
    await test.step('Create new payroll cycle', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      
      // Fill in cycle details
      await page.fill('[data-testid="cycle-name-input"]', payrollCycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      
      // Submit creation
      await page.click('[data-testid="create-cycle-submit"]');
      
      // Verify creation success
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      await expect(page.locator(`[data-testid="cycle-${payrollCycleName}"]`)).toBeVisible();
    });

    // Step 2: Calculate payroll for the cycle
    await test.step('Calculate payroll for employees', async () => {
      // Click calculate for the newly created cycle
      await page.click(`[data-testid="calculate-${payrollCycleName}"]`);
      
      // Wait for calculation preview to load
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      
      // Verify calculation summary shows
      await expect(page.locator('[data-testid="total-employees"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-base-pay"]')).toBeVisible();
      
      // Confirm calculation
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Verify calculation success
      await expect(page.locator('[data-testid="calculation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-list"]')).toBeVisible();
    });

    // Step 3: Add bonus and deductions to employees
    await test.step('Manage employee bonuses and deductions', async () => {
      // Click on first employee to manage bonus/deduction
      await page.click('[data-testid="employee-item"]:first-child [data-testid="manage-bonus-btn"]');
      
      // Wait for bonus/deduction form
      await expect(page.locator('[data-testid="bonus-deduction-form"]')).toBeVisible();
      
      // Add a bonus
      await page.fill('[data-testid="bonus-amount-input"]', '1000');
      await page.fill('[data-testid="bonus-reason-input"]', 'ผลงานดีเด่น');
      
      // Add a deduction
      await page.fill('[data-testid="deduction-amount-input"]', '200');
      await page.fill('[data-testid="deduction-reason-input"]', 'มาสาย');
      
      // Preview adjustment
      await page.click('[data-testid="preview-adjustment-btn"]');
      await expect(page.locator('[data-testid="adjustment-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-pay-calculation"]')).toBeVisible();
      
      // Confirm adjustment
      await page.click('[data-testid="confirm-adjustment-btn"]');
      await expect(page.locator('[data-testid="adjustment-success"]')).toBeVisible();
    });

    // Step 4: Finalize payroll cycle
    await test.step('Finalize payroll cycle', async () => {
      // Go to finalization
      await page.click('[data-testid="finalize-payroll-btn"]');
      
      // Wait for finalization summary
      await expect(page.locator('[data-testid="finalization-summary"]')).toBeVisible();
      
      // Verify summary details
      await expect(page.locator('[data-testid="total-employees-final"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-base-pay-final"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-bonuses-final"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-deductions-final"]')).toBeVisible();
      await expect(page.locator('[data-testid="net-total-final"]')).toBeVisible();
      
      // Confirm finalization
      await page.click('[data-testid="confirm-finalization-btn"]');
      
      // Verify finalization confirmation dialog
      await expect(page.locator('[data-testid="finalization-dialog"]')).toBeVisible();
      await page.click('[data-testid="final-confirm-btn"]');
      
      // Verify finalization success
      await expect(page.locator('[data-testid="finalization-success"]')).toBeVisible();
      
      // Verify cycle status changed to 'completed'
      await expect(page.locator(`[data-testid="cycle-${payrollCycleName}"] [data-testid="status-badge"]`))
        .toHaveText('เสร็จสิ้น');
    });

    // Step 5: Export payroll data
    await test.step('Export payroll data', async () => {
      // Click export options
      await page.click(`[data-testid="export-${payrollCycleName}"]`);
      
      // Wait for export options
      await expect(page.locator('[data-testid="export-options"]')).toBeVisible();
      
      // Test CSV export
      const csvDownloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-btn"]');
      const csvDownload = await csvDownloadPromise;
      expect(csvDownload.suggestedFilename()).toContain('.csv');
      
      // Test PDF export
      const pdfDownloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf-btn"]');
      const pdfDownload = await pdfDownloadPromise;
      expect(pdfDownload.suggestedFilename()).toContain('.pdf');
      
      // Verify export success notification
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
    });
  });

  test('Payroll Business Rules Validation E2E', async ({ page }) => {
    // Create test cycle for business rules testing
    const testCycleName = `กฎธุรกิจ-${Date.now()}`;
    
    await test.step('Create cycle for business rules testing', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', testCycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Verify payroll calculation rules', async () => {
      // Calculate payroll
      await page.click(`[data-testid="calculate-${testCycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Check for employees with different calculation methods
      const employeeItems = page.locator('[data-testid="employee-item"]');
      const count = await employeeItems.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const employee = employeeItems.nth(i);
        
        // Verify calculation method is displayed
        await expect(employee.locator('[data-testid="calculation-method"]')).toBeVisible();
        
        // Verify hours and pay are displayed
        await expect(employee.locator('[data-testid="total-hours"]')).toBeVisible();
        await expect(employee.locator('[data-testid="base-pay"]')).toBeVisible();
        
        // Click to see detailed breakdown
        await employee.locator('[data-testid="view-details-btn"]').click();
        await expect(page.locator('[data-testid="employee-details-modal"]')).toBeVisible();
        
        // Verify daily breakdown shows calculation method per day
        await expect(page.locator('[data-testid="daily-breakdown"]')).toBeVisible();
        await expect(page.locator('[data-testid="daily-calculation-method"]').first()).toBeVisible();
        
        // Close modal
        await page.click('[data-testid="close-details-modal"]');
      }
    });

    await test.step('Test overlapping cycle prevention', async () => {
      // Try to create overlapping cycle
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', `ทับซ้อน-${Date.now()}`);
      await page.fill('[data-testid="start-date-input"]', '2025-01-15'); // Overlaps with previous cycle
      await page.fill('[data-testid="end-date-input"]', '2025-02-15');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-20');
      
      await page.click('[data-testid="create-cycle-submit"]');
      
      // Verify validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]'))
        .toContainText('ช่วงวันที่ทับซ้อน');
    });
  });

  test('Payroll Error Handling and Edge Cases', async ({ page }) => {
    await test.step('Test invalid date ranges', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      
      // Test end date before start date
      await page.fill('[data-testid="cycle-name-input"]', 'วันที่ผิด');
      await page.fill('[data-testid="start-date-input"]', '2025-01-31');
      await page.fill('[data-testid="end-date-input"]', '2025-01-01'); // Before start date
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      
      await page.click('[data-testid="create-cycle-submit"]');
      
      // Verify validation error
      await expect(page.locator('[data-testid="date-validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-validation-error"]'))
        .toContainText('วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด');
    });

    await test.step('Test calculation with no employees', async () => {
      // Create cycle in future period with no time entries
      const futureCycleName = `อนาคต-${Date.now()}`;
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', futureCycleName);
      await page.fill('[data-testid="start-date-input"]', '2026-01-01');
      await page.fill('[data-testid="end-date-input"]', '2026-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2026-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      
      // Try to calculate
      await page.click(`[data-testid="calculate-${futureCycleName}"]`);
      
      // Verify appropriate message for no data
      await expect(page.locator('[data-testid="no-employees-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-employees-message"]'))
        .toContainText('ไม่พบพนักงาน');
    });

    await test.step('Test bonus/deduction validation', async () => {
      // Use existing calculated cycle
      const employees = page.locator('[data-testid="employee-item"]');
      if (await employees.count() > 0) {
        await employees.first().locator('[data-testid="manage-bonus-btn"]').click();
        
        // Test negative bonus
        await page.fill('[data-testid="bonus-amount-input"]', '-500');
        await page.click('[data-testid="preview-adjustment-btn"]');
        await expect(page.locator('[data-testid="bonus-validation-error"]')).toBeVisible();
        
        // Test excessive deduction
        await page.fill('[data-testid="bonus-amount-input"]', '0');
        await page.fill('[data-testid="deduction-amount-input"]', '999999');
        await page.click('[data-testid="preview-adjustment-btn"]');
        await expect(page.locator('[data-testid="deduction-warning"]')).toBeVisible();
      }
    });
  });

  test('Payroll UI/UX and Thai Localization', async ({ page }) => {
    await test.step('Verify Thai language interface', async () => {
      // Check main page titles and labels
      await expect(page.locator('[data-testid="page-title"]')).toContainText('การจัดการเงินเดือน');
      await expect(page.locator('[data-testid="create-cycle-btn"]')).toContainText('สร้างรอบใหม่');
      
      // Check table headers
      await expect(page.locator('[data-testid="cycle-name-header"]')).toContainText('ชื่อรอบ');
      await expect(page.locator('[data-testid="period-header"]')).toContainText('ช่วงเวลา');
      await expect(page.locator('[data-testid="status-header"]')).toContainText('สถานะ');
    });

    await test.step('Verify responsive design and accessibility', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="payroll-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="payroll-page"]')).toBeVisible();
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    await test.step('Test loading states and animations', async () => {
      // Create cycle to test loading states
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', `โหลดดิ้ง-${Date.now()}`);
      await page.fill('[data-testid="start-date-input"]', '2025-02-01');
      await page.fill('[data-testid="end-date-input"]', '2025-02-28');
      await page.fill('[data-testid="pay-date-input"]', '2025-03-05');
      
      // Verify loading spinner appears during creation
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  test('Payroll Security and Permissions', async ({ page }) => {
    await test.step('Verify admin-only access', async () => {
      // Logout and try to access as non-admin
      await page.click('[data-testid="logout-btn"]');
      
      // Try direct navigation to payroll
      await page.goto('/admin/payroll');
      
      // Should be redirected to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    await test.step('Verify data validation and sanitization', async () => {
      // Re-login as admin
      await page.goto('/login/admin');
      await page.fill('[data-testid="email-input"]', 'admin@test.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.goto('/admin/payroll');
      
      // Test XSS prevention in cycle name
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', '<script>alert("xss")</script>');
      await page.fill('[data-testid="start-date-input"]', '2025-03-01');
      await page.fill('[data-testid="end-date-input"]', '2025-03-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-04-05');
      await page.click('[data-testid="create-cycle-submit"]');
      
      // Verify script tag is escaped/sanitized
      await expect(page.locator('[data-testid="cycle-name-display"]'))
        .not.toContainText('<script>');
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete test cycles if they exist
    try {
      const deleteButtons = page.locator('[data-testid^="delete-cycle-"]');
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        const deleteBtn = deleteButtons.nth(i);
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          // Confirm deletion if dialog appears
          const confirmBtn = page.locator('[data-testid="confirm-delete-btn"]');
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
          }
        }
      }
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  });
});