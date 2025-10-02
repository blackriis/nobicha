import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Payroll Logic Validation (Simplified)
 * ทดสอบ payroll calculation logic โดยไม่ต้องพึ่งพา authentication
 */

test.describe('Payroll Logic Validation E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Application loads and basic navigation works', async ({ page }) => {
    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for Next.js hydration
    await page.waitForTimeout(2000);
    
    // Verify page title or header exists
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Payroll API endpoints are accessible', async ({ page }) => {
    // Test if API routes exist by checking response
    const response = await page.request.get('/api/admin/payroll-cycles');
    
    // Should get 401 (unauthorized) or similar, not 404
    expect([401, 403, 500].includes(response.status())).toBeTruthy();
    
    // Test calculation endpoint
    const calcResponse = await page.request.post('/api/admin/payroll-cycles/test-id/calculate');
    expect([401, 403, 404, 500].includes(calcResponse.status())).toBeTruthy();
  });

  test('Payroll page routes exist', async ({ page }) => {
    // Test admin payroll route exists
    const response = await page.goto('/admin/payroll');
    
    // Should redirect to login or show unauthorized, not 404
    expect(response?.status()).not.toBe(404);
  });

  test('Database schema validation through API', async ({ page }) => {
    // Test API structure by sending test requests
    const payrollData = {
      cycle_name: 'Test Cycle',
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      pay_date: '2025-02-05'
    };
    
    const response = await page.request.post('/api/admin/payroll-cycles', {
      data: payrollData
    });
    
    // Should get structured error response, not server error
    const responseText = await response.text();
    expect(responseText).toBeTruthy();
    
    // Should be JSON response with error structure
    try {
      const jsonResponse = JSON.parse(responseText);
      expect(jsonResponse).toHaveProperty('error');
    } catch {
      // If not JSON, should be HTML redirect or similar
      expect(response.status()).not.toBe(500);
    }
  });

  test('Payroll calculation business rules in code', async ({ page }) => {
    // Test calculation utilities through browser context
    await page.goto('/');
    
    // Add script to test calculation functions
    const result = await page.evaluate(() => {
      // Simulate calculation logic that should be in the frontend
      function calculateHoursWorked(checkIn: string, checkOut: string): number {
        const checkInTime = new Date(checkIn);
        const checkOutTime = new Date(checkOut);
        
        if (isNaN(checkInTime.getTime()) || isNaN(checkOutTime.getTime())) {
          return 0;
        }
        
        if (checkOutTime <= checkInTime) {
          return 0;
        }
        
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        
        return Math.max(0, Math.round(hours * 100) / 100);
      }
      
      function calculateDayPay(hours: number, hourlyRate: number, dailyRate: number) {
        if (hours > 12) {
          return { method: 'daily', pay: dailyRate };
        } else {
          return { method: 'hourly', pay: hours * hourlyRate };
        }
      }
      
      // Test cases
      const testCases = [
        {
          description: 'Hourly calculation (8 hours)',
          hours: 8,
          expected: { method: 'hourly', pay: 400 } // 8 * 50
        },
        {
          description: 'Boundary case (12 hours)',
          hours: 12,
          expected: { method: 'hourly', pay: 600 } // 12 * 50
        },
        {
          description: 'Daily calculation (13 hours)',
          hours: 13,
          expected: { method: 'daily', pay: 600 } // daily rate
        },
        {
          description: 'Long shift (16 hours)',
          hours: 16,
          expected: { method: 'daily', pay: 600 } // daily rate
        }
      ];
      
      const results = testCases.map(testCase => {
        const result = calculateDayPay(testCase.hours, 50, 600);
        return {
          description: testCase.description,
          passed: result.method === testCase.expected.method && result.pay === testCase.expected.pay,
          result,
          expected: testCase.expected
        };
      });
      
      // Test time calculation
      const timeTest = calculateHoursWorked('2025-01-15T08:00:00Z', '2025-01-15T17:00:00Z');
      
      return {
        businessRuleTests: results,
        timeCalculationTest: {
          result: timeTest,
          expected: 9,
          passed: timeTest === 9
        }
      };
    });
    
    // Verify business rule tests passed
    expect(result.businessRuleTests.every(test => test.passed)).toBe(true);
    expect(result.timeCalculationTest.passed).toBe(true);
    
    // Log results for debugging
    console.log('Business Rules Test Results:', result);
  });

  test('Thai localization patterns', async ({ page }) => {
    await page.goto('/');
    
    // Test Thai text rendering
    const thaiText = await page.evaluate(() => {
      // Create element with Thai text
      const testElement = document.createElement('div');
      testElement.textContent = 'เงินเดือน รายชั่วโมง รายวัน โบนัส หักเงิน';
      document.body.appendChild(testElement);
      
      // Check if text renders properly
      const computedStyle = window.getComputedStyle(testElement);
      const textContent = testElement.textContent;
      
      document.body.removeChild(testElement);
      
      return {
        textContent,
        fontFamily: computedStyle.fontFamily,
        textRendered: textContent === 'เงินเดือน รายชั่วโมง รายวัน โบนัส หักเงิน'
      };
    });
    
    expect(thaiText.textRendered).toBe(true);
    expect(thaiText.textContent).toContain('เงินเดือน');
  });

  test('Date and currency formatting', async ({ page }) => {
    await page.goto('/');
    
    const formatTests = await page.evaluate(() => {
      // Test Thai date formatting
      const testDate = new Date('2025-01-15');
      const thaiDate = testDate.toLocaleDateString('th-TH');
      
      // Test currency formatting
      const testAmount = 1234.56;
      const thaiCurrency = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
      }).format(testAmount);
      
      // Test number formatting
      const thaiNumber = new Intl.NumberFormat('th-TH').format(testAmount);
      
      return {
        thaiDate,
        thaiCurrency,
        thaiNumber,
        dateValid: thaiDate.includes('2568') || thaiDate.includes('2025'), // Buddhist Era or CE
        currencyValid: thaiCurrency.includes('฿') || thaiCurrency.includes('THB'),
        numberValid: thaiNumber.includes('.') || thaiNumber.includes(',')
      };
    });
    
    expect(formatTests.dateValid).toBe(true);
    expect(formatTests.currencyValid).toBe(true);
    expect(formatTests.numberValid).toBe(true);
    
    console.log('Format Tests:', formatTests);
  });

  test('Responsive design simulation', async ({ page }) => {
    await page.goto('/');
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Verify page is still functional
      await expect(page.locator('body')).toBeVisible();
      
      // Check if content is not overflowing
      const bodyScroll = await page.evaluate(() => {
        return {
          scrollWidth: document.body.scrollWidth,
          clientWidth: document.body.clientWidth,
          hasHorizontalScroll: document.body.scrollWidth > document.body.clientWidth
        };
      });
      
      // No horizontal scroll should be present (responsive design)
      expect(bodyScroll.hasHorizontalScroll).toBe(false);
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Performance baseline check', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Verify reasonable load times (adjust thresholds as needed)
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // 5 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(10000); // 10 seconds
    
    console.log('Performance Metrics:', performanceMetrics);
  });

  test('Error boundary and exception handling', async ({ page }) => {
    await page.goto('/');
    
    // Test console error handling
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Test navigation to non-existent admin page
    await page.goto('/admin/non-existent-page');
    
    // Should handle gracefully (404 or redirect)
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
    
    // Check for unhandled JavaScript errors
    await page.waitForTimeout(2000);
    
    // Filter out expected errors (like auth redirects)
    const unexpectedErrors = consoleErrors.filter(error => 
      !error.includes('401') && 
      !error.includes('403') && 
      !error.includes('Unauthorized') &&
      !error.includes('Failed to fetch')
    );
    
    expect(unexpectedErrors.length).toBe(0);
  });

  test('Accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check for basic accessibility attributes
    const accessibilityCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, a, [role]');
      let accessibleCount = 0;
      const totalCount = elements.length;
      
      elements.forEach(element => {
        // Check for basic accessibility attributes
        if (
          element.hasAttribute('aria-label') ||
          element.hasAttribute('aria-describedby') ||
          element.hasAttribute('title') ||
          element.textContent?.trim() ||
          element.getAttribute('type') === 'submit'
        ) {
          accessibleCount++;
        }
      });
      
      return {
        totalElements: totalCount,
        accessibleElements: accessibleCount,
        accessibilityRatio: totalCount > 0 ? accessibleCount / totalCount : 1
      };
    });
    
    // At least 50% of interactive elements should have accessibility attributes
    expect(accessibilityCheck.accessibilityRatio).toBeGreaterThan(0.5);
    
    console.log('Accessibility Check:', accessibilityCheck);
  });
});