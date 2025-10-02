import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Payroll Calculation Logic
 * ทดสอบเฉพาะ business logic การคิดค่าแรง: >12hrs=daily rate, ≤12hrs=hourly rate
 */

test.describe('Payroll Calculation Logic E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to Payroll page
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    await page.click('[data-testid="nav-payroll"]');
    await expect(page.locator('[data-testid="payroll-page"]')).toBeVisible();
  });

  test('Hourly Rate Calculation (≤12 hours)', async ({ page }) => {
    const cycleName = `ทดสอบรายชั่วโมง-${Date.now()}`;
    
    await test.step('Create test cycle for hourly calculation', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Calculate and verify hourly rate logic', async () => {
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Find employees with hourly calculation (≤12 hours)
      const hourlyEmployees = page.locator('[data-testid="employee-item"]')
        .filter({ has: page.locator('[data-testid="calculation-method"]:has-text("รายชั่วโมง")') });
      
      const count = await hourlyEmployees.count();
      if (count > 0) {
        const firstHourlyEmployee = hourlyEmployees.first();
        
        // Get hours and pay data
        const hoursText = await firstHourlyEmployee.locator('[data-testid="total-hours"]').textContent();
        const payText = await firstHourlyEmployee.locator('[data-testid="base-pay"]').textContent();
        
        // Extract numeric values
        const hours = parseFloat(hoursText?.replace(/[^\d.]/g, '') || '0');
        const pay = parseFloat(payText?.replace(/[^\d.]/g, '') || '0');
        
        // Verify hours ≤ 12
        expect(hours).toBeLessThanOrEqual(12);
        
        // Open details to verify calculation
        await firstHourlyEmployee.locator('[data-testid="view-details-btn"]').click();
        await expect(page.locator('[data-testid="employee-details-modal"]')).toBeVisible();
        
        // Verify daily breakdown shows hourly calculation
        const dailyEntries = page.locator('[data-testid="daily-entry"]');
        const dailyCount = await dailyEntries.count();
        
        for (let i = 0; i < dailyCount; i++) {
          const entry = dailyEntries.nth(i);
          const methodText = await entry.locator('[data-testid="daily-calculation-method"]').textContent();
          const dailyHours = await entry.locator('[data-testid="daily-hours"]').textContent();
          const dailyPay = await entry.locator('[data-testid="daily-pay"]').textContent();
          
          const dayHours = parseFloat(dailyHours?.replace(/[^\d.]/g, '') || '0');
          const dayPay = parseFloat(dailyPay?.replace(/[^\d.]/g, '') || '0');
          
          if (dayHours <= 12) {
            expect(methodText).toContain('รายชั่วโมง');
            // Verify pay = hours * hourly_rate (50 THB)
            expect(dayPay).toBe(dayHours * 50);
          }
        }
        
        await page.click('[data-testid="close-details-modal"]');
      }
    });
  });

  test('Daily Rate Calculation (>12 hours)', async ({ page }) => {
    const cycleName = `ทดสอบรายวัน-${Date.now()}`;
    
    await test.step('Create test cycle for daily calculation', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Calculate and verify daily rate logic', async () => {
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Find employees with daily calculation (>12 hours)
      const dailyEmployees = page.locator('[data-testid="employee-item"]')
        .filter({ has: page.locator('[data-testid="calculation-method"]:has-text("รายวัน")') });
      
      const count = await dailyEmployees.count();
      if (count > 0) {
        const firstDailyEmployee = dailyEmployees.first();
        
        // Open details to verify calculation
        await firstDailyEmployee.locator('[data-testid="view-details-btn"]').click();
        await expect(page.locator('[data-testid="employee-details-modal"]')).toBeVisible();
        
        // Verify daily breakdown shows daily calculation
        const dailyEntries = page.locator('[data-testid="daily-entry"]');
        const dailyCount = await dailyEntries.count();
        
        for (let i = 0; i < dailyCount; i++) {
          const entry = dailyEntries.nth(i);
          const methodText = await entry.locator('[data-testid="daily-calculation-method"]').textContent();
          const dailyHours = await entry.locator('[data-testid="daily-hours"]').textContent();
          const dailyPay = await entry.locator('[data-testid="daily-pay"]').textContent();
          
          const dayHours = parseFloat(dailyHours?.replace(/[^\d.]/g, '') || '0');
          const dayPay = parseFloat(dailyPay?.replace(/[^\d.]/g, '') || '0');
          
          if (dayHours > 12) {
            expect(methodText).toContain('รายวัน');
            // Verify pay = daily_rate (600 THB) regardless of hours
            expect(dayPay).toBe(600);
          }
        }
        
        await page.click('[data-testid="close-details-modal"]');
      }
    });
  });

  test('Mixed Calculation Method', async ({ page }) => {
    const cycleName = `ทดสอบผสม-${Date.now()}`;
    
    await test.step('Create test cycle for mixed calculation', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Calculate and verify mixed method logic', async () => {
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Find employees with mixed calculation
      const mixedEmployees = page.locator('[data-testid="employee-item"]')
        .filter({ has: page.locator('[data-testid="calculation-method"]:has-text("ผสม")') });
      
      const count = await mixedEmployees.count();
      if (count > 0) {
        const firstMixedEmployee = mixedEmployees.first();
        
        // Open details to verify mixed calculation
        await firstMixedEmployee.locator('[data-testid="view-details-btn"]').click();
        await expect(page.locator('[data-testid="employee-details-modal"]')).toBeVisible();
        
        // Verify daily breakdown has both hourly and daily methods
        const hourlyEntries = page.locator('[data-testid="daily-entry"]')
          .filter({ has: page.locator('[data-testid="daily-calculation-method"]:has-text("รายชั่วโมง")') });
        const dailyEntries = page.locator('[data-testid="daily-entry"]')
          .filter({ has: page.locator('[data-testid="daily-calculation-method"]:has-text("รายวัน")') });
        
        const hourlyCount = await hourlyEntries.count();
        const dailyCount = await dailyEntries.count();
        
        // Mixed method should have both types
        expect(hourlyCount).toBeGreaterThan(0);
        expect(dailyCount).toBeGreaterThan(0);
        
        // Verify each type follows correct calculation
        for (let i = 0; i < hourlyCount; i++) {
          const entry = hourlyEntries.nth(i);
          const dailyHours = await entry.locator('[data-testid="daily-hours"]').textContent();
          const dayHours = parseFloat(dailyHours?.replace(/[^\d.]/g, '') || '0');
          expect(dayHours).toBeLessThanOrEqual(12);
        }
        
        for (let i = 0; i < dailyCount; i++) {
          const entry = dailyEntries.nth(i);
          const dailyHours = await entry.locator('[data-testid="daily-hours"]').textContent();
          const dayHours = parseFloat(dailyHours?.replace(/[^\d.]/g, '') || '0');
          expect(dayHours).toBeGreaterThan(12);
        }
        
        await page.click('[data-testid="close-details-modal"]');
      }
    });
  });

  test('Calculation Accuracy and Precision', async ({ page }) => {
    const cycleName = `ทดสอบความแม่นยำ-${Date.now()}`;
    
    await test.step('Create test cycle for precision testing', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    });

    await test.step('Verify calculation precision', async () => {
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      
      // Verify summary totals are displayed with proper precision
      const totalBasePay = page.locator('[data-testid="total-base-pay"]');
      await expect(totalBasePay).toBeVisible();
      
      const totalText = await totalBasePay.textContent();
      // Should show Thai baht format with 2 decimal places
      expect(totalText).toMatch(/[\d,]+\.\d{2}/);
      
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Check individual employee calculations
      const employeeItems = page.locator('[data-testid="employee-item"]');
      const count = await employeeItems.count();
      
      for (let i = 0; i < Math.min(count, 2); i++) {
        const employee = employeeItems.nth(i);
        
        // Verify base pay precision (2 decimal places)
        const basePay = await employee.locator('[data-testid="base-pay"]').textContent();
        expect(basePay).toMatch(/[\d,]+\.\d{2}/);
        
        // Verify hours precision (2 decimal places)
        const hours = await employee.locator('[data-testid="total-hours"]').textContent();
        expect(hours).toMatch(/\d+\.\d{2}/);
      }
    });
  });

  test('Boundary Testing: Exactly 12 Hours', async ({ page }) => {
    const cycleName = `ทดสอบ12ชั่วโมง-${Date.now()}`;
    
    await test.step('Test 12-hour boundary condition', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Look for employees with exactly 12 hours per day
      const employeeItems = page.locator('[data-testid="employee-item"]');
      const count = await employeeItems.count();
      
      for (let i = 0; i < count; i++) {
        const employee = employeeItems.nth(i);
        await employee.locator('[data-testid="view-details-btn"]').click();
        
        const dailyEntries = page.locator('[data-testid="daily-entry"]');
        const dailyCount = await dailyEntries.count();
        
        for (let j = 0; j < dailyCount; j++) {
          const entry = dailyEntries.nth(j);
          const hoursText = await entry.locator('[data-testid="daily-hours"]').textContent();
          const hours = parseFloat(hoursText?.replace(/[^\d.]/g, '') || '0');
          
          if (hours === 12) {
            // Exactly 12 hours should use hourly rate (≤12 rule)
            const methodText = await entry.locator('[data-testid="daily-calculation-method"]').textContent();
            expect(methodText).toContain('รายชั่วโมง');
            
            const payText = await entry.locator('[data-testid="daily-pay"]').textContent();
            const pay = parseFloat(payText?.replace(/[^\d.]/g, '') || '0');
            expect(pay).toBe(600); // 12 * 50 = 600
          }
        }
        
        await page.click('[data-testid="close-details-modal"]');
      }
    });
  });

  test('Multiple Check-ins Per Day Aggregation', async ({ page }) => {
    const cycleName = `ทดสอบหลายรอบ-${Date.now()}`;
    
    await test.step('Test multiple check-ins aggregation', async () => {
      await page.click('[data-testid="create-payroll-cycle-btn"]');
      await page.fill('[data-testid="cycle-name-input"]', cycleName);
      await page.fill('[data-testid="start-date-input"]', '2025-01-01');
      await page.fill('[data-testid="end-date-input"]', '2025-01-31');
      await page.fill('[data-testid="pay-date-input"]', '2025-02-05');
      await page.click('[data-testid="create-cycle-submit"]');
      await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
      
      // Calculate payroll
      await page.click(`[data-testid="calculate-${cycleName}"]`);
      await expect(page.locator('[data-testid="calculation-preview"]')).toBeVisible();
      await page.click('[data-testid="confirm-calculation-btn"]');
      
      // Find employee with multiple check-ins per day
      const employeeItems = page.locator('[data-testid="employee-item"]');
      if (await employeeItems.count() > 0) {
        await employeeItems.first().locator('[data-testid="view-details-btn"]').click();
        
        // Verify daily breakdown shows aggregated hours
        const dailyEntries = page.locator('[data-testid="daily-entry"]');
        if (await dailyEntries.count() > 0) {
          const firstEntry = dailyEntries.first();
          
          // Check if there's multiple check-ins indicator
          const multiCheckInIndicator = firstEntry.locator('[data-testid="multiple-checkins"]');
          if (await multiCheckInIndicator.isVisible()) {
            // Verify total hours are aggregated correctly
            const hoursText = await firstEntry.locator('[data-testid="daily-hours"]').textContent();
            const hours = parseFloat(hoursText?.replace(/[^\d.]/g, '') || '0');
            
            // Click to see check-in details
            await firstEntry.locator('[data-testid="view-checkins-btn"]').click();
            await expect(page.locator('[data-testid="checkin-breakdown"]')).toBeVisible();
            
            // Verify individual check-ins sum to total
            const checkinItems = page.locator('[data-testid="checkin-item"]');
            const checkinCount = await checkinItems.count();
            let totalCalculatedHours = 0;
            
            for (let i = 0; i < checkinCount; i++) {
              const checkin = checkinItems.nth(i);
              const checkinHours = await checkin.locator('[data-testid="checkin-hours"]').textContent();
              totalCalculatedHours += parseFloat(checkinHours?.replace(/[^\d.]/g, '') || '0');
            }
            
            // Should match the aggregated total
            expect(Math.abs(totalCalculatedHours - hours)).toBeLessThan(0.01);
            
            await page.click('[data-testid="close-checkin-breakdown"]');
          }
        }
        
        await page.click('[data-testid="close-details-modal"]');
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test cycles
    try {
      const deleteButtons = page.locator('[data-testid^="delete-cycle-"]');
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        const deleteBtn = deleteButtons.nth(i);
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
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