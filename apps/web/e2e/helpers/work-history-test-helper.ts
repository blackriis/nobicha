import { test, expect } from '@playwright/test';

/**
 * E2E Test Helper Functions for Employee Work History
 * ฟังก์ชันช่วยเหลือสำหรับการทดสอบ E2E ของประวัติการทำงานพนักงาน
 */

export class WorkHistoryTestHelper {
  constructor(private page: any) {}

  /**
   * Login as employee with test credentials
   */
  async loginAsEmployee(email: string, password: string) {
    await this.page.goto('/login/employee');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await expect(this.page.locator('[data-testid="employee-dashboard"]')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Navigate to work history page
   */
  async navigateToWorkHistory() {
    await this.page.click('[data-testid="nav-work-history"]');
    await expect(this.page.locator('[data-testid="work-history-page"]')).toBeVisible();
  }

  /**
   * Select date range filter
   */
  async selectDateRange(range: 'today' | 'this-week' | 'this-month' | 'custom') {
    const filterMap = {
      'today': '[data-testid="filter-today"]',
      'this-week': '[data-testid="filter-this-week"]',
      'this-month': '[data-testid="filter-this-month"]',
      'custom': '[data-testid="filter-custom"]'
    };
    
    await this.page.click(filterMap[range]);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Refresh work history data
   */
  async refreshData() {
    await this.page.click('[data-testid="refresh-button"]');
    await expect(this.page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Get time entry cards count
   */
  async getTimeEntryCount(): Promise<number> {
    const cards = this.page.locator('[data-testid="time-entry-card"]');
    return await cards.count();
  }

  /**
   * Open time entry detail modal
   */
  async openTimeEntryDetail(cardIndex: number = 0) {
    const cards = this.page.locator('[data-testid="time-entry-card"]');
    await cards.nth(cardIndex).locator('[data-testid="view-details-btn"]').click();
    await expect(this.page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
  }

  /**
   * Close time entry detail modal
   */
  async closeTimeEntryDetail() {
    await this.page.click('[data-testid="close-modal-btn"]');
    await expect(this.page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
  }

  /**
   * Verify time entry card structure
   */
  async verifyTimeEntryCard(cardIndex: number = 0) {
    const card = this.page.locator('[data-testid="time-entry-card"]').nth(cardIndex);
    
    // Check required elements
    await expect(card.locator('[data-testid="entry-date"]')).toBeVisible();
    await expect(card.locator('[data-testid="checkin-time"]')).toBeVisible();
    await expect(card.locator('[data-testid="working-hours"]')).toBeVisible();
    await expect(card.locator('[data-testid="status-badge"]')).toBeVisible();
    await expect(card.locator('[data-testid="view-details-btn"]')).toBeVisible();
  }

  /**
   * Verify time entry detail modal content
   */
  async verifyTimeEntryDetailModal() {
    await expect(this.page.locator('[data-testid="modal-title"]')).toContainText('รายละเอียดการมาทำงาน');
    await expect(this.page.locator('[data-testid="detail-checkin-time"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="detail-location"]')).toBeVisible();
  }

  /**
   * Verify empty state
   */
  async verifyEmptyState() {
    await expect(this.page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="empty-state"]')).toContainText('ไม่มีข้อมูลการทำงาน');
    await expect(this.page.locator('[data-testid="empty-state-icon"]')).toBeVisible();
  }

  /**
   * Verify error state
   */
  async verifyErrorState() {
    await expect(this.page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText('เกิดข้อผิดพลาด');
    await expect(this.page.locator('[data-testid="retry-button"]')).toBeVisible();
  }

  /**
   * Verify working hours summary
   */
  async verifyWorkingHoursSummary() {
    const summary = this.page.locator('[data-testid="working-hours-summary"]');
    
    if (await summary.isVisible()) {
      await expect(summary.locator('[data-testid="total-hours"]')).toBeVisible();
      await expect(summary.locator('[data-testid="average-hours"]')).toBeVisible();
      await expect(summary.locator('[data-testid="days-worked"]')).toBeVisible();
    }
  }

  /**
   * Set mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Test mobile navigation
   */
  async testMobileNavigation() {
    await this.page.click('[data-testid="mobile-menu-toggle"]');
    await expect(this.page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  }

  /**
   * Test mobile date filter
   */
  async testMobileDateFilter() {
    await this.page.click('[data-testid="mobile-date-filter"]');
    await expect(this.page.locator('[data-testid="mobile-date-picker"]')).toBeVisible();
  }

  /**
   * Validate date format (DD/MM/YYYY)
   */
  async validateDateFormat(text: string): Promise<boolean> {
    return /\d{1,2}\/\d{1,2}\/\d{4}/.test(text);
  }

  /**
   * Validate time format (HH:MM)
   */
  async validateTimeFormat(text: string): Promise<boolean> {
    return /\d{1,2}:\d{2}/.test(text);
  }

  /**
   * Validate working hours format (X.X ชั่วโมง)
   */
  async validateWorkingHoursFormat(text: string): Promise<boolean> {
    return /\d+\.?\d*\s*ชั่วโมง/.test(text);
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    await this.page.keyboard.press('Tab');
    await expect(this.page.locator(':focus')).toBeVisible();
  }

  /**
   * Test accessibility features
   */
  async testAccessibility() {
    // Test headings
    const headings = this.page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Test ARIA labels
    await expect(this.page.locator('[aria-label]')).toHaveCount.greaterThan(0);

    // Test button accessibility
    const buttons = this.page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  }

  /**
   * Simulate network error
   */
  async simulateNetworkError() {
    await this.page.route('**/api/employee/time-entries/history**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
  }

  /**
   * Measure page load time
   */
  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.goto('/dashboard/work-history');
    await expect(this.page.locator('[data-testid="work-history-page"]')).toBeVisible();
    return Date.now() - startTime;
  }

  /**
   * Measure filter performance
   */
  async measureFilterPerformance(): Promise<number> {
    const startTime = Date.now();
    await this.selectDateRange('this-week');
    return Date.now() - startTime;
  }
}

/**
 * Test data factory for creating test employees
 */
export class TestDataFactory {
  static generateTestEmployee() {
    const timestamp = Date.now();
    return {
      email: `test.employee.${timestamp}@test.com`,
      password: 'testpassword123',
      fullName: `พนักงานทดสอบ ${timestamp}`,
      employeeId: `EMP${timestamp}`
    };
  }

  static generateTimeEntryData() {
    const now = new Date();
    const checkInTime = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 hours ago
    const checkOutTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
    
    return {
      checkInTime: checkInTime.toISOString(),
      checkOutTime: checkOutTime.toISOString(),
      totalHours: 7,
      status: 'completed',
      branchId: 'test-branch-id',
      latitude: 13.7563,
      longitude: 100.5018
    };
  }
}

/**
 * Mock API responses for testing
 */
export class MockAPIResponses {
  static getEmptyTimeEntriesResponse() {
    return {
      success: true,
      data: [],
      message: 'No time entries found'
    };
  }

  static getTimeEntriesResponse() {
    return {
      success: true,
      data: [
        {
          id: 'test-entry-1',
          checkInTime: '2024-01-15T08:00:00Z',
          checkOutTime: '2024-01-15T17:00:00Z',
          totalHours: 8,
          status: 'completed',
          branch: {
            name: 'สาขาหลัก',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ'
          }
        },
        {
          id: 'test-entry-2',
          checkInTime: '2024-01-16T08:30:00Z',
          checkOutTime: null,
          totalHours: 0,
          status: 'active',
          branch: {
            name: 'สาขาหลัก',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ'
          }
        }
      ]
    };
  }

  static getTimeEntryDetailResponse() {
    return {
      success: true,
      data: {
        id: 'test-entry-1',
        checkInTime: '2024-01-15T08:00:00Z',
        checkOutTime: '2024-01-15T17:00:00Z',
        checkInSelfieUrl: 'https://example.com/selfie1.jpg',
        checkOutSelfieUrl: 'https://example.com/selfie2.jpg',
        branch: {
          name: 'สาขาหลัก',
          latitude: 13.7563,
          longitude: 100.5018
        }
      }
    };
  }

  static getErrorResponse() {
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      code: 'FETCH_ERROR'
    };
  }
}
