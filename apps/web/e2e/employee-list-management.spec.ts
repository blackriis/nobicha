import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Employee List Management
 * ทดสอบการจัดการรายชื่อพนักงาน: ค้นหา, กรอง, จัดเรียง, Pagination, ส่งออก
 */

test.describe('Employee List Management E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
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

  test('Employee List Page Load and Display', async ({ page }) => {
    await test.step('Verify page loads correctly', async () => {
      // Check page title and header
      await expect(page.locator('h1')).toContainText('รายชื่อพนักงาน');
      await expect(page.locator('[data-testid="page-description"]')).toContainText('จัดการและดูข้อมูลพนักงานทั้งหมดในระบบ');
      
      // Verify main components are visible
      await expect(page.locator('[data-testid="employee-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-employee-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-employees-btn"]')).toBeVisible();
    });

    await test.step('Verify table structure', async () => {
      // Check table headers
      await expect(page.locator('[data-testid="table-header-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-header-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-header-role"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-header-branch"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-header-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="table-header-actions"]')).toBeVisible();
      
      // Verify table has data rows
      const tableRows = page.locator('[data-testid="employee-table"] tbody tr');
      await expect(tableRows).toHaveCount.greaterThan(0);
    });
  });

  test('Employee Search Functionality', async ({ page }) => {
    await test.step('Test search by name', async () => {
      // Search for a specific name
      await page.fill('[data-testid="employee-search"]', 'สมชาย');
      await page.waitForTimeout(1000); // Wait for search to complete
      
      // Verify search results
      const searchResults = page.locator('[data-testid="employee-table"] tbody tr');
      const resultCount = await searchResults.count();
      
      if (resultCount > 0) {
        // Check that all visible results contain the search term
        for (let i = 0; i < resultCount; i++) {
          const row = searchResults.nth(i);
          const nameCell = row.locator('[data-testid="employee-name"]');
          const emailCell = row.locator('[data-testid="employee-email"]');
          
          const nameText = await nameCell.textContent();
          const emailText = await emailCell.textContent();
          
          expect(nameText?.toLowerCase()).toContain('สมชาย') || 
          expect(emailText?.toLowerCase()).toContain('สมชาย');
        }
      }
    });

    await test.step('Test search by email', async () => {
      // Clear previous search
      await page.fill('[data-testid="employee-search"]', '');
      await page.waitForTimeout(500);
      
      // Search by email
      await page.fill('[data-testid="employee-search"]', '@test.com');
      await page.waitForTimeout(1000);
      
      // Verify email search results
      const searchResults = page.locator('[data-testid="employee-table"] tbody tr');
      const resultCount = await searchResults.count();
      
      if (resultCount > 0) {
        for (let i = 0; i < resultCount; i++) {
          const row = searchResults.nth(i);
          const emailCell = row.locator('[data-testid="employee-email"]');
          const emailText = await emailCell.textContent();
          expect(emailText).toContain('@test.com');
        }
      }
    });

    await test.step('Test empty search', async () => {
      // Clear search
      await page.fill('[data-testid="employee-search"]', '');
      await page.waitForTimeout(1000);
      
      // Verify all employees are shown
      const allRows = page.locator('[data-testid="employee-table"] tbody tr');
      await expect(allRows).toHaveCount.greaterThan(0);
    });

    await test.step('Test no results search', async () => {
      // Search for non-existent employee
      await page.fill('[data-testid="employee-search"]', 'nonexistentemployee12345');
      await page.waitForTimeout(1000);
      
      // Verify no results message
      await expect(page.locator('[data-testid="no-search-results"]')).toBeVisible();
    });
  });

  test('Employee Filtering Functionality', async ({ page }) => {
    await test.step('Test status filter', async () => {
      // Test active filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      await page.waitForTimeout(1000);
      
      // Verify all visible employees are active
      const activeRows = page.locator('[data-testid="employee-table"] tbody tr');
      const rowCount = await activeRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = activeRows.nth(i);
        const statusBadge = row.locator('[data-testid="status-badge"]');
        await expect(statusBadge).toContainText('active');
      }
      
      // Test inactive filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-inactive"]');
      await page.waitForTimeout(1000);
      
      // Clear filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-all"]');
      await page.waitForTimeout(1000);
    });

    await test.step('Test role filter', async () => {
      // Test employee role filter
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-employee"]');
      await page.waitForTimeout(1000);
      
      // Verify all visible employees have employee role
      const employeeRows = page.locator('[data-testid="employee-table"] tbody tr');
      const rowCount = await employeeRows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = employeeRows.nth(i);
        const roleBadge = row.locator('[data-testid="role-badge"]');
        await expect(roleBadge).toContainText('employee');
      }
      
      // Clear filter
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="filter-all"]');
      await page.waitForTimeout(1000);
    });

    await test.step('Test branch filter', async () => {
      // Test branch filter
      await page.click('[data-testid="branch-filter"]');
      const branchOptions = page.locator('[data-testid="branch-option"]');
      const optionCount = await branchOptions.count();
      
      if (optionCount > 0) {
        await branchOptions.first().click();
        await page.waitForTimeout(1000);
        
        // Verify filtered results
        const filteredRows = page.locator('[data-testid="employee-table"] tbody tr');
        await expect(filteredRows).toHaveCount.greaterThan(0);
        
        // Clear filter
        await page.click('[data-testid="branch-filter"]');
        await page.click('[data-testid="filter-all"]');
        await page.waitForTimeout(1000);
      }
    });
  });

  test('Employee Table Sorting', async ({ page }) => {
    await test.step('Test name sorting', async () => {
      // Click name header to sort
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(1000);
      
      // Verify sorting indicator
      await expect(page.locator('[data-testid="sort-indicator-name"]')).toBeVisible();
      
      // Click again to reverse sort
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(1000);
      
      // Verify reverse sorting indicator
      await expect(page.locator('[data-testid="sort-indicator-name-desc"]')).toBeVisible();
    });

    await test.step('Test email sorting', async () => {
      // Click email header to sort
      await page.click('[data-testid="sort-email"]');
      await page.waitForTimeout(1000);
      
      // Verify sorting works
      await expect(page.locator('[data-testid="sort-indicator-email"]')).toBeVisible();
    });

    await test.step('Test created date sorting', async () => {
      // Click created date header to sort
      await page.click('[data-testid="sort-created"]');
      await page.waitForTimeout(1000);
      
      // Verify sorting works
      await expect(page.locator('[data-testid="sort-indicator-created"]')).toBeVisible();
    });
  });

  test('Employee Table Pagination', async ({ page }) => {
    await test.step('Test pagination controls', async () => {
      // Check if pagination exists
      const pagination = page.locator('[data-testid="pagination"]');
      const paginationExists = await pagination.isVisible();
      
      if (paginationExists) {
        // Test next page
        const nextBtn = page.locator('[data-testid="next-page"]');
        if (await nextBtn.isEnabled()) {
          await nextBtn.click();
          await page.waitForTimeout(1000);
          
          // Verify page changed
          await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
        }
        
        // Test previous page
        const prevBtn = page.locator('[data-testid="prev-page"]');
        if (await prevBtn.isEnabled()) {
          await prevBtn.click();
          await page.waitForTimeout(1000);
          
          // Verify page changed back
          await expect(page.locator('[data-testid="current-page"]')).toContainText('1');
        }
        
        // Test page size change
        await page.click('[data-testid="page-size-select"]');
        await page.click('[data-testid="page-size-10"]');
        await page.waitForTimeout(1000);
        
        // Verify page size changed
        const tableRows = page.locator('[data-testid="employee-table"] tbody tr');
        const rowCount = await tableRows.count();
        expect(rowCount).toBeLessThanOrEqual(10);
      }
    });
  });

  test('Employee Actions', async ({ page }) => {
    await test.step('Test view employee action', async () => {
      // Click view button on first employee
      const firstRow = page.locator('[data-testid="employee-table"] tbody tr').first();
      await firstRow.locator('[data-testid="view-employee-btn"]').click();
      
      // Verify navigation to employee detail page
      await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
      
      // Navigate back
      await page.goBack();
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    });

    await test.step('Test edit employee action', async () => {
      // Click edit button on first employee
      const firstRow = page.locator('[data-testid="employee-table"] tbody tr').first();
      await firstRow.locator('[data-testid="edit-employee-btn"]').click();
      
      // Verify navigation to edit page
      await expect(page.locator('[data-testid="edit-employee-page"]')).toBeVisible();
      
      // Navigate back
      await page.goBack();
      await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    });

    await test.step('Test employee actions dropdown', async () => {
      // Click actions dropdown on first employee
      const firstRow = page.locator('[data-testid="employee-table"] tbody tr').first();
      await firstRow.locator('[data-testid="employee-actions-dropdown"]').click();
      
      // Verify dropdown menu appears
      await expect(page.locator('[data-testid="actions-dropdown-menu"]')).toBeVisible();
      
      // Click outside to close dropdown
      await page.click('body');
      await expect(page.locator('[data-testid="actions-dropdown-menu"]')).not.toBeVisible();
    });
  });

  test('Employee Export Functionality', async ({ page }) => {
    await test.step('Test export to CSV', async () => {
      // Start download promise
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('[data-testid="export-employees-btn"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/employees.*\.csv/);
    });

    await test.step('Test export with filters', async () => {
      // Apply a filter first
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      await page.waitForTimeout(1000);
      
      // Start download promise
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('[data-testid="export-employees-btn"]');
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download includes filter in filename
      expect(download.suggestedFilename()).toMatch(/employees.*active.*\.csv/);
    });
  });

  test('Employee List Performance', async ({ page }) => {
    await test.step('Test page load performance', async () => {
      const startTime = Date.now();
      
      // Reload page
      await page.reload();
      await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    await test.step('Test search performance', async () => {
      const startTime = Date.now();
      
      // Perform search
      await page.fill('[data-testid="employee-search"]', 'test');
      await page.waitForTimeout(1000);
      
      const searchTime = Date.now() - startTime;
      expect(searchTime).toBeLessThan(1000); // Search should complete within 1 second
    });

    await test.step('Test filter performance', async () => {
      const startTime = Date.now();
      
      // Apply filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="filter-active"]');
      await page.waitForTimeout(1000);
      
      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(1000); // Filter should complete within 1 second
    });
  });

  test('Employee List Error Handling', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Simulate network failure
      await page.route('**/api/admin/employees*', route => route.abort());
      
      // Reload page
      await page.reload();
      
      // Verify error message is shown
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    await test.step('Test retry functionality', async () => {
      // Restore network
      await page.unroute('**/api/admin/employees*');
      
      // Click retry button
      await page.click('[data-testid="retry-button"]');
      
      // Verify page loads successfully
      await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
    });
  });
});
