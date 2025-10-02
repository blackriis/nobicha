import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Employee CRUD Operations
 * ทดสอบการเพิ่ม/แก้ไข/ลบพนักงาน: ฟอร์ม, การตรวจสอบข้อมูล, การบันทึก
 */

test.describe('Employee CRUD Operations E2E Tests', () => {
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
  });

  test('Add New Employee - Complete Workflow', async ({ page }) => {
    await test.step('Navigate to add employee page', async () => {
      // Navigate to Employees page
      await page.click('[data-testid="nav-employees"]');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Click Add Employee button
      await page.click('[data-testid="add-employee-btn"]');
      
      // Verify navigation to add employee page
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('เพิ่มพนักงานใหม่');
    });

    await test.step('Fill employee form with valid data', async () => {
      // Fill basic information
      await page.fill('[data-testid="full-name-input"]', `พนักงานทดสอบ ${Date.now()}`);
      await page.fill('[data-testid="email-input"]', testEmployeeEmail);
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.fill('[data-testid="confirm-password-input"]', 'testpassword123');
      
      // Select branch
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      
      // Set rates
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      // Verify form is filled correctly
      const nameValue = await page.locator('[data-testid="full-name-input"]').inputValue();
      const emailValue = await page.locator('[data-testid="email-input"]').inputValue();
      
      expect(nameValue).toBeTruthy();
      expect(emailValue).toBe(testEmployeeEmail);
    });

    await test.step('Submit employee form', async () => {
      // Submit form
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Wait for success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('เพิ่มพนักงานสำเร็จ');
      
      // Extract employee ID from URL or success message
      const currentUrl = page.url();
      const urlMatch = currentUrl.match(/\/admin\/employees\/([a-f0-9-]+)/);
      if (urlMatch) {
        testEmployeeId = urlMatch[1];
      }
    });

    await test.step('Verify employee appears in list', async () => {
      // Navigate back to employee list
      await page.goto('/admin/employees');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Search for the new employee
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      // Verify employee appears in search results
      const searchResults = page.locator('[data-testid="employee-table"] tbody tr');
      await expect(searchResults).toHaveCount(1);
      await expect(searchResults.first()).toContainText(testEmployeeEmail);
    });
  });

  test('Add Employee - Form Validation', async ({ page }) => {
    await test.step('Navigate to add employee page', async () => {
      await page.click('[data-testid="nav-employees"]');
      await page.click('[data-testid="add-employee-btn"]');
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
    });

    await test.step('Test required field validation', async () => {
      // Try to submit empty form
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-branch"]')).toBeVisible();
    });

    await test.step('Test email format validation', async () => {
      // Fill invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify email validation error
      await expect(page.locator('[data-testid="validation-error-email"]')).toContainText('รูปแบบอีเมลไม่ถูกต้อง');
    });

    await test.step('Test password confirmation validation', async () => {
      // Fill passwords that don't match
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'differentpassword');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify password confirmation error
      await expect(page.locator('[data-testid="validation-error-confirm-password"]')).toContainText('รหัสผ่านไม่ตรงกัน');
    });

    await test.step('Test numeric field validation', async () => {
      // Fill invalid numeric values
      await page.fill('[data-testid="hourly-rate-input"]', 'invalid-number');
      await page.fill('[data-testid="daily-rate-input"]', 'not-a-number');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify numeric validation errors
      await expect(page.locator('[data-testid="validation-error-hourly-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-daily-rate"]')).toBeVisible();
    });

    await test.step('Test duplicate email validation', async () => {
      // Fill form with existing email
      await page.fill('[data-testid="full-name-input"]', 'Test Employee');
      await page.fill('[data-testid="email-input"]', 'admin@test.com'); // Existing email
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify duplicate email error
      await expect(page.locator('[data-testid="validation-error-email"]')).toContainText('อีเมลนี้มีอยู่ในระบบแล้ว');
    });
  });

  test('Edit Employee - Complete Workflow', async ({ page }) => {
    await test.step('Navigate to employee list and find test employee', async () => {
      // Navigate to employee list
      await page.click('[data-testid="nav-employees"]');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Search for test employee
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      // Click edit button
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("${testEmployeeEmail}")`);
      await expect(employeeRow).toBeVisible();
      await employeeRow.locator('[data-testid="edit-employee-btn"]').click();
    });

    await test.step('Verify edit page loads with current data', async () => {
      // Verify edit page loads
      await expect(page.locator('[data-testid="edit-employee-page"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('แก้ไขข้อมูลพนักงาน');
      
      // Verify form is pre-filled with current data
      const nameValue = await page.locator('[data-testid="full-name-input"]').inputValue();
      const emailValue = await page.locator('[data-testid="email-input"]').inputValue();
      
      expect(nameValue).toBeTruthy();
      expect(emailValue).toBe(testEmployeeEmail);
    });

    await test.step('Update employee information', async () => {
      // Update employee information
      await page.fill('[data-testid="full-name-input"]', `พนักงานทดสอบ (แก้ไขแล้ว) ${Date.now()}`);
      await page.fill('[data-testid="hourly-rate-input"]', '120');
      await page.fill('[data-testid="daily-rate-input"]', '960');
      
      // Submit changes
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Wait for success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('แก้ไขข้อมูลพนักงานสำเร็จ');
    });

    await test.step('Verify changes are reflected in employee list', async () => {
      // Navigate back to employee list
      await page.goto('/admin/employees');
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
      
      // Search for the updated employee
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      // Verify updated information is displayed
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("${testEmployeeEmail}")`);
      await expect(employeeRow).toContainText('แก้ไขแล้ว');
    });
  });

  test('Edit Employee - Form Validation', async ({ page }) => {
    await test.step('Navigate to edit employee page', async () => {
      await page.click('[data-testid="nav-employees"]');
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("${testEmployeeEmail}")`);
      await employeeRow.locator('[data-testid="edit-employee-btn"]').click();
      await expect(page.locator('[data-testid="edit-employee-page"]')).toBeVisible();
    });

    await test.step('Test required field validation', async () => {
      // Clear required fields
      await page.fill('[data-testid="full-name-input"]', '');
      await page.fill('[data-testid="email-input"]', '');
      
      // Try to submit
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-email"]')).toBeVisible();
    });

    await test.step('Test email format validation', async () => {
      // Fill invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email-format');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify email validation error
      await expect(page.locator('[data-testid="validation-error-email"]')).toContainText('รูปแบบอีเมลไม่ถูกต้อง');
    });

    await test.step('Test numeric field validation', async () => {
      // Fill invalid numeric values
      await page.fill('[data-testid="hourly-rate-input"]', 'invalid-rate');
      await page.fill('[data-testid="daily-rate-input"]', 'invalid-daily');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify numeric validation errors
      await expect(page.locator('[data-testid="validation-error-hourly-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error-daily-rate"]')).toBeVisible();
    });
  });

  test('Delete Employee - Complete Workflow', async ({ page }) => {
    await test.step('Navigate to employee detail page', async () => {
      await page.click('[data-testid="nav-employees"]');
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("${testEmployeeEmail}")`);
      await employeeRow.locator('[data-testid="view-employee-btn"]').click();
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
    });

    await test.step('Initiate employee deletion', async () => {
      // Click delete button
      await page.click('[data-testid="delete-employee-btn"]');
      
      // Verify confirmation dialog appears
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-confirmation-message"]')).toContainText('คุณแน่ใจหรือไม่');
    });

    await test.step('Cancel deletion', async () => {
      // Click cancel button
      await page.click('[data-testid="cancel-delete-btn"]');
      
      // Verify dialog closes
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      
      // Verify still on employee detail page
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
    });

    await test.step('Confirm deletion', async () => {
      // Click delete button again
      await page.click('[data-testid="delete-employee-btn"]');
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      
      // Click confirm delete button
      await page.click('[data-testid="confirm-delete-btn"]');
      
      // Wait for success notification
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="success-notification"]')).toContainText('ลบพนักงานสำเร็จ');
      
      // Verify redirect to employee list
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    });

    await test.step('Verify employee is removed from list', async () => {
      // Search for deleted employee
      await page.fill('[data-testid="employee-search"]', testEmployeeEmail);
      await page.waitForTimeout(1000);
      
      // Verify no results found
      await expect(page.locator('[data-testid="no-search-results"]')).toBeVisible();
    });
  });

  test('Employee CRUD Error Handling', async ({ page }) => {
    await test.step('Test network error during add', async () => {
      // Simulate network failure
      await page.route('**/api/admin/employees*', route => route.abort());
      
      // Navigate to add employee page
      await page.click('[data-testid="nav-employees"]');
      await page.click('[data-testid="add-employee-btn"]');
      
      // Fill form
      await page.fill('[data-testid="full-name-input"]', 'Test Employee');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      // Submit form
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    await test.step('Test network error during edit', async () => {
      // Restore network
      await page.unroute('**/api/admin/employees*');
      
      // Create a test employee first
      await page.fill('[data-testid="full-name-input"]', 'Test Employee');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      await page.click('[data-testid="submit-employee-btn"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      // Simulate network failure for edit
      await page.route('**/api/admin/employees/*', route => route.abort());
      
      // Navigate to edit page
      await page.goto('/admin/employees');
      await page.fill('[data-testid="employee-search"]', 'test@example.com');
      await page.waitForTimeout(1000);
      
      const employeeRow = page.locator(`[data-testid="employee-row"]:has-text("test@example.com")`);
      await employeeRow.locator('[data-testid="edit-employee-btn"]').click();
      
      // Try to update
      await page.fill('[data-testid="full-name-input"]', 'Updated Name');
      await page.click('[data-testid="submit-employee-btn"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test('Employee CRUD Performance', async ({ page }) => {
    await test.step('Test add employee performance', async () => {
      const startTime = Date.now();
      
      // Navigate to add employee page
      await page.click('[data-testid="nav-employees"]');
      await page.click('[data-testid="add-employee-btn"]');
      
      const navigationTime = Date.now() - startTime;
      expect(navigationTime).toBeLessThan(2000); // Should navigate within 2 seconds
      
      // Test form load performance
      const formStartTime = Date.now();
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
      
      const formLoadTime = Date.now() - formStartTime;
      expect(formLoadTime).toBeLessThan(1000); // Form should load within 1 second
    });

    await test.step('Test form submission performance', async () => {
      // Fill form quickly
      await page.fill('[data-testid="full-name-input"]', 'Performance Test Employee');
      await page.fill('[data-testid="email-input"]', `perf.test.${Date.now()}@example.com`);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      // Test submission performance
      const submitStartTime = Date.now();
      await page.click('[data-testid="submit-employee-btn"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      const submitTime = Date.now() - submitStartTime;
      expect(submitTime).toBeLessThan(5000); // Submission should complete within 5 seconds
    });
  });

  test('Employee CRUD Responsive Design', async ({ page }) => {
    await test.step('Test mobile add employee form', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to add employee page
      await page.click('[data-testid="nav-employees"]');
      await page.click('[data-testid="add-employee-btn"]');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
      
      // Test form fields are accessible
      await expect(page.locator('[data-testid="full-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      
      // Test mobile form submission
      await page.fill('[data-testid="full-name-input"]', 'Mobile Test Employee');
      await page.fill('[data-testid="email-input"]', `mobile.test.${Date.now()}@example.com`);
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'password123');
      await page.click('[data-testid="branch-select"]');
      await page.click('[data-testid="branch-option"]:first-child');
      await page.fill('[data-testid="hourly-rate-input"]', '100');
      await page.fill('[data-testid="daily-rate-input"]', '800');
      
      await page.click('[data-testid="submit-employee-btn"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Test tablet add employee form', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to add employee page
      await page.goto('/admin/employees/add');
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
      
      // Test form layout adapts to tablet
      await expect(page.locator('[data-testid="employee-form"]')).toBeVisible();
    });

    await test.step('Test desktop add employee form', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Navigate to add employee page
      await page.goto('/admin/employees/add');
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="add-employee-page"]')).toBeVisible();
      
      // Test form uses full width effectively
      await expect(page.locator('[data-testid="employee-form"]')).toBeVisible();
    });
  });
});
