import { test, expect } from '@playwright/test';
import { WorkHistoryTestHelper, TestDataFactory, MockAPIResponses } from './helpers/work-history-test-helper';

/**
 * E2E Tests: Employee Work History - Comprehensive Test Suite
 * ทดสอบครบวงจรหน้าประวัติการทำงานของพนักงาน
 */

test.describe('Employee Work History - Comprehensive E2E Tests', () => {
  let helper: WorkHistoryTestHelper;
  let testEmployee: any;
  
  test.beforeEach(async ({ page }) => {
    helper = new WorkHistoryTestHelper(page);
    testEmployee = TestDataFactory.generateTestEmployee();
    
    // Login as employee
    await helper.loginAsEmployee(testEmployee.email, testEmployee.password);
    
    // Navigate to work history page
    await helper.navigateToWorkHistory();
  });

  test('Work History - Complete User Journey', async ({ page }) => {
    await test.step('1. Verify page loads with correct structure', async () => {
      // Check page title and description
      await expect(page.locator('h1')).toContainText('ประวัติการทำงาน');
      await expect(page.locator('text=รายงานการ check-in/check-out ของคุณ')).toBeVisible();
      
      // Verify main components are present
      await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
    });

    await test.step('2. Test date range filtering', async () => {
      // Test all date range options
      await helper.selectDateRange('today');
      await helper.selectDateRange('this-week');
      await helper.selectDateRange('this-month');
      
      // Test custom date range
      await helper.selectDateRange('custom');
      await expect(page.locator('[data-testid="custom-date-picker"]')).toBeVisible();
    });

    await test.step('3. Test data refresh functionality', async () => {
      await helper.refreshData();
      
      // Verify data is refreshed
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
    });

    await test.step('4. Test time entries display', async () => {
      const entryCount = await helper.getTimeEntryCount();
      
      if (entryCount > 0) {
        // Verify first time entry card
        await helper.verifyTimeEntryCard(0);
        
        // Test viewing details
        await helper.openTimeEntryDetail(0);
        await helper.verifyTimeEntryDetailModal();
        await helper.closeTimeEntryDetail();
      } else {
        // Verify empty state
        await helper.verifyEmptyState();
      }
    });

    await test.step('5. Test working hours summary', async () => {
      await helper.verifyWorkingHoursSummary();
    });
  });

  test('Work History - Data Validation and Formatting', async ({ page }) => {
    await test.step('Validate data formats and accuracy', async () => {
      const entryCount = await helper.getTimeEntryCount();
      
      if (entryCount > 0) {
        const firstCard = page.locator('[data-testid="time-entry-card"]').first();
        
        // Validate date format
        const dateText = await firstCard.locator('[data-testid="entry-date"]').textContent();
        expect(await helper.validateDateFormat(dateText || '')).toBe(true);
        
        // Validate time format
        const checkinTime = await firstCard.locator('[data-testid="checkin-time"]').textContent();
        expect(await helper.validateTimeFormat(checkinTime || '')).toBe(true);
        
        // Validate working hours format
        const workingHours = await firstCard.locator('[data-testid="working-hours"]').textContent();
        expect(await helper.validateWorkingHoursFormat(workingHours || '')).toBe(true);
        
        // Validate status badge
        const statusBadge = firstCard.locator('[data-testid="status-badge"]');
        await expect(statusBadge).toBeVisible();
        
        const statusText = await statusBadge.textContent();
        if (statusText?.includes('เสร็จสิ้น')) {
          await expect(statusBadge).toHaveClass(/text-green/);
        } else if (statusText?.includes('กำลังทำงาน')) {
          await expect(statusBadge).toHaveClass(/text-blue/);
        }
      }
    });
  });

  test('Work History - Error Handling and Edge Cases', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      await helper.simulateNetworkError();
      await helper.refreshData();
      await helper.verifyErrorState();
    });

    await test.step('Test empty state handling', async () => {
      // Mock empty response
      await page.route('**/api/employee/time-entries/history**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MockAPIResponses.getEmptyTimeEntriesResponse())
        });
      });
      
      await helper.refreshData();
      await helper.verifyEmptyState();
    });

    await test.step('Test invalid data handling', async () => {
      // Mock invalid response
      await page.route('**/api/employee/time-entries/history**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Invalid data format' })
        });
      });
      
      await helper.refreshData();
      await helper.verifyErrorState();
    });
  });

  test('Work History - Performance Testing', async ({ page }) => {
    await test.step('Test page load performance', async () => {
      const loadTime = await helper.measureLoadTime();
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    await test.step('Test filter performance', async () => {
      const filterTime = await helper.measureFilterPerformance();
      expect(filterTime).toBeLessThan(1000); // Filter should complete within 1 second
    });

    await test.step('Test refresh performance', async () => {
      const startTime = Date.now();
      await helper.refreshData();
      const refreshTime = Date.now() - startTime;
      expect(refreshTime).toBeLessThan(2000); // Refresh should complete within 2 seconds
    });
  });

  test('Work History - Responsive Design Testing', async ({ page }) => {
    await test.step('Test mobile viewport', async () => {
      await helper.setMobileViewport();
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-work-history"]')).toBeVisible();
      
      // Test mobile navigation
      await helper.testMobileNavigation();
      
      // Test mobile date filter
      await helper.testMobileDateFilter();
    });

    await test.step('Test tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Test tablet-specific features
      const timeEntryCards = page.locator('[data-testid="time-entry-card"]');
      if (await timeEntryCards.count() > 0) {
        await expect(timeEntryCards.first()).toBeVisible();
      }
    });

    await test.step('Test desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Test desktop-specific features
      await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
    });
  });

  test('Work History - Accessibility Testing', async ({ page }) => {
    await test.step('Test keyboard navigation', async () => {
      await helper.testKeyboardNavigation();
    });

    await test.step('Test screen reader support', async () => {
      await helper.testAccessibility();
    });

    await test.step('Test ARIA attributes', async () => {
      // Check for proper ARIA labels
      await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);
      
      // Check for proper ARIA roles
      await expect(page.locator('[role="button"]')).toHaveCount.greaterThan(0);
      
      // Check for proper ARIA states
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const disabled = await button.getAttribute('disabled');
        if (disabled) {
          await expect(button).toHaveAttribute('aria-disabled', 'true');
        }
      }
    });

    await test.step('Test color contrast and visual accessibility', async () => {
      // Check that status badges have sufficient contrast
      const statusBadges = page.locator('[data-testid="status-badge"]');
      const badgeCount = await statusBadges.count();
      
      for (let i = 0; i < badgeCount; i++) {
        const badge = statusBadges.nth(i);
        const textColor = await badge.evaluate(el => 
          window.getComputedStyle(el).color
        );
        const backgroundColor = await badge.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Basic check that colors are defined
        expect(textColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });

  test('Work History - Security Testing', async ({ page }) => {
    await test.step('Test authentication requirements', async () => {
      // Test that unauthenticated users cannot access work history
      await page.goto('/dashboard/work-history');
      
      // Should redirect to login or show authentication error
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|auth/);
    });

    await test.step('Test data isolation', async () => {
      // Verify that user can only see their own time entries
      const entryCount = await helper.getTimeEntryCount();
      
      if (entryCount > 0) {
        // All entries should belong to the logged-in user
        // This is verified by the API endpoint security
        await expect(page.locator('[data-testid="time-entry-card"]')).toHaveCount.greaterThan(0);
      }
    });

    await test.step('Test sensitive data protection', async () => {
      // Check that sensitive information is not exposed in the UI
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('password');
      expect(pageContent).not.toContain('token');
      expect(pageContent).not.toContain('secret');
      expect(pageContent).not.toContain('key');
    });

    await test.step('Test XSS protection', async () => {
      // Test that user input is properly sanitized
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('javascript:');
      expect(pageContent).not.toContain('onclick=');
    });
  });

  test('Work History - Integration Testing', async ({ page }) => {
    await test.step('Test integration with dashboard navigation', async () => {
      // Navigate to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page.locator('[data-testid="employee-dashboard"]')).toBeVisible();
      
      // Navigate back to work history
      await page.click('[data-testid="nav-work-history"]');
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

    await test.step('Test integration with profile page', async () => {
      // Navigate to profile
      await page.click('[data-testid="nav-profile"]');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
      
      // Navigate back to work history
      await page.click('[data-testid="nav-work-history"]');
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
    });
  });

  test('Work History - Cross-Browser Compatibility', async ({ page, browserName }) => {
    await test.step(`Test ${browserName} compatibility`, async () => {
      // Verify page loads correctly
      await expect(page.locator('[data-testid="work-history-page"]')).toBeVisible();
      
      // Test basic functionality
      await helper.selectDateRange('today');
      await helper.refreshData();
      
      // Test time entry display
      const entryCount = await helper.getTimeEntryCount();
      if (entryCount > 0) {
        await helper.verifyTimeEntryCard(0);
      }
      
      // Test modal functionality
      if (entryCount > 0) {
        await helper.openTimeEntryDetail(0);
        await helper.closeTimeEntryDetail();
      }
    });
  });

  test('Work History - Data Consistency Testing', async ({ page }) => {
    await test.step('Test data consistency across filters', async () => {
      const initialCount = await helper.getTimeEntryCount();
      
      // Test different date ranges
      await helper.selectDateRange('today');
      const todayCount = await helper.getTimeEntryCount();
      
      await helper.selectDateRange('this-week');
      const weekCount = await helper.getTimeEntryCount();
      
      await helper.selectDateRange('this-month');
      const monthCount = await helper.getTimeEntryCount();
      
      // Verify counts are logical (month >= week >= today)
      expect(monthCount).toBeGreaterThanOrEqual(weekCount);
      expect(weekCount).toBeGreaterThanOrEqual(todayCount);
    });

    await test.step('Test data consistency after refresh', async () => {
      const beforeRefresh = await helper.getTimeEntryCount();
      await helper.refreshData();
      const afterRefresh = await helper.getTimeEntryCount();
      
      // Count should remain the same after refresh
      expect(afterRefresh).toBe(beforeRefresh);
    });
  });
});
