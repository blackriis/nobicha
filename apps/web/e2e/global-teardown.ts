import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Teardown for Employee Work History E2E Tests
 * การทำความสะอาดหลังการทดสอบ E2E ของประวัติการทำงานพนักงาน
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Work History E2E tests...');
  
  // Launch browser for cleanup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Cleanup test data
    await cleanupTestData(page);
    
    // Cleanup test users
    await cleanupTestUsers(page);
    
    // Cleanup test time entries
    await cleanupTestTimeEntries(page);
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

/**
 * Cleanup test data for work history tests
 */
async function cleanupTestData(page: any) {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Navigate to admin login
    await page.goto('http://localhost:3000/login/admin');
    
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for admin dashboard
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    
    // Cleanup test employee if exists
    await cleanupTestEmployee(page);
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('⚠️ Test data cleanup failed:', error);
  }
}

/**
 * Cleanup test employee for work history tests
 */
async function cleanupTestEmployee(page: any) {
  console.log('👤 Cleaning up test employee...');
  
  try {
    // Navigate to employees page
    await page.click('[data-testid="nav-employees"]');
    await page.waitForSelector('[data-testid="employees-page"]');
    
    // Check if test employee exists
    const existingEmployee = await page.locator('text=test.employee.workhistory@test.com').isVisible();
    
    if (existingEmployee) {
      // Find test employee row
      const employeeRow = page.locator('[data-testid="employee-row"]:has-text("test.employee.workhistory@test.com")');
      
      // Click view details button
      await employeeRow.locator('[data-testid="view-employee-btn"]').click();
      
      // Wait for employee detail page
      await page.waitForSelector('[data-testid="employee-detail-page"]');
      
      // Check if delete button is available
      const deleteBtn = page.locator('[data-testid="delete-employee-btn"]');
      if (await deleteBtn.isVisible()) {
        // Click delete button
        await deleteBtn.click();
        
        // Confirm deletion
        await page.click('[data-testid="confirm-delete-btn"]');
        
        // Wait for success
        await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
        
        console.log('✅ Test employee deleted successfully');
      } else {
        console.log('ℹ️ Delete button not available for test employee');
      }
    } else {
      console.log('ℹ️ Test employee not found - no cleanup needed');
    }
  } catch (error) {
    console.error('⚠️ Test employee cleanup failed:', error);
  }
}

/**
 * Cleanup test users for authentication
 */
async function cleanupTestUsers(page: any) {
  console.log('🔐 Cleaning up test users...');
  
  // Test users cleanup is handled by the database cleanup
  // This function can be extended to clean up additional test users if needed
  
  console.log('✅ Test users cleanup completed');
}

/**
 * Cleanup test time entries for work history tests
 */
async function cleanupTestTimeEntries(page: any) {
  console.log('⏰ Cleaning up test time entries...');
  
  // Time entries cleanup is handled by the database cleanup
  // This function can be extended to clean up specific test time entries if needed
  
  console.log('✅ Test time entries cleanup completed');
}

/**
 * Cleanup test files and artifacts
 */
async function cleanupTestArtifacts() {
  console.log('📁 Cleaning up test artifacts...');
  
  // Cleanup test result files
  const fs = require('fs');
  const path = require('path');
  
  const testResultsDir = path.join(process.cwd(), 'test-results');
  const playwrightReportDir = path.join(process.cwd(), 'playwright-report');
  
  try {
    // Remove test results directory
    if (fs.existsSync(testResultsDir)) {
      fs.rmSync(testResultsDir, { recursive: true, force: true });
      console.log('✅ Test results directory cleaned up');
    }
    
    // Remove playwright report directory
    if (fs.existsSync(playwrightReportDir)) {
      fs.rmSync(playwrightReportDir, { recursive: true, force: true });
      console.log('✅ Playwright report directory cleaned up');
    }
  } catch (error) {
    console.error('⚠️ Test artifacts cleanup failed:', error);
  }
}

export default globalTeardown;
